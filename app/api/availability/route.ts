import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { checkRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'
import { parseISO, getDay, format } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

const TIMEZONE = 'Africa/Johannesburg'

const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
})

/**
 * Generate 1-hour slot strings between start and end times.
 * Both inputs are "HH:mm" strings in SAST.
 */
function generateSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = []
  const [startHour] = startTime.split(':').map(Number)
  const [endHour] = endTime.split(':').map(Number)

  for (let h = startHour; h < endHour; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
  }

  return slots
}

/**
 * Check if a 1-hour slot starting at `slotTime` (HH:mm) overlaps with
 * an appointment that starts at `apptTime` (HH:mm) and lasts `durationMinutes`.
 */
function slotOverlapsAppointment(
  slotTime: string,
  apptTime: string,
  durationMinutes: number
): boolean {
  const [slotH, slotM] = slotTime.split(':').map(Number)
  const [apptH, apptM] = apptTime.split(':').map(Number)

  const slotStart = slotH * 60 + slotM
  const slotEnd = slotStart + 60
  const apptStart = apptH * 60 + apptM
  const apptEnd = apptStart + durationMinutes

  return slotStart < apptEnd && slotEnd > apptStart
}

/**
 * Check if a 1-hour slot starting at `slotTime` (HH:mm) on `date` (YYYY-MM-DD)
 * in SAST overlaps with a blocked slot (UTC TIMESTAMPTZ).
 */
function slotOverlapsBlockedSlot(
  date: string,
  slotTime: string,
  blockedStart: string,
  blockedEnd: string
): boolean {
  // Construct the slot's start and end as SAST, then convert to UTC timestamps
  const slotStartSAST = new Date(`${date}T${slotTime}:00+02:00`)
  const slotEndSAST = new Date(`${date}T${slotTime}:00+02:00`)
  slotEndSAST.setMinutes(slotEndSAST.getMinutes() + 60)

  const blockedStartUTC = new Date(blockedStart)
  const blockedEndUTC = new Date(blockedEnd)

  return slotStartSAST < blockedEndUTC && slotEndSAST > blockedStartUTC
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, remaining } = checkRateLimit(`availability:${ip}`, { maxRequests: 30, windowMs: 60_000 })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    // 1. Validate query params
    const { searchParams } = new URL(request.url)
    const rawDate = searchParams.get('date')

    const parsed = QuerySchema.safeParse({ date: rawDate })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 })
    }

    const { date } = parsed.data

    // 2. Parse the SAST date and get day of week
    const sastDate = parseISO(date)
    const dayOfWeek = getDay(sastDate) // 0 = Sunday, 1 = Monday, ...

    const supabase = createSupabaseAdminClient()

    // 3. Query working_hours for this day
    const { data: workingHour } = await supabase
      .from('working_hours')
      .select('start_time, end_time, is_active')
      .eq('day_of_week', dayOfWeek)
      .single()

    // If no working hours defined or closed, return empty
    if (!workingHour || !workingHour.is_active) {
      return NextResponse.json({ date, slots: [] })
    }

    // 4. Generate all 1-hour slots for the day
    const allSlots = generateSlots(workingHour.start_time, workingHour.end_time)

    // 5. Query appointments for this date (excluding cancelled)
    const { data: appointments } = await supabase
      .from('appointments')
      .select('scheduled_time, duration_minutes, status')
      .eq('scheduled_date', date)
      .neq('status', 'cancelled')

    // 6. Remove slots occupied by appointments
    let availableSlots = allSlots
    if (appointments && appointments.length > 0) {
      availableSlots = availableSlots.filter((slot) => {
        return !appointments.some((appt) => {
          if (!appt.scheduled_time) return false
          const duration = appt.duration_minutes ?? 60
          return slotOverlapsAppointment(slot, appt.scheduled_time, duration)
        })
      })
    }

    // 7. Query blocked_slots overlapping this date in SAST
    // SAST date YYYY-MM-DD spans: [YYYY-MM-DDT00:00:00+02:00, YYYY-MM-DDT23:59:59+02:00)
    // In UTC that's: [YYYY-MM-DDT22:00:00Z (prev day), YYYY-MM-DDT21:59:59Z)
    const sastStart = fromZonedTime(`${date}T00:00:00`, TIMEZONE)
    const sastEnd = fromZonedTime(`${date}T23:59:59`, TIMEZONE)

    const { data: blockedSlots } = await supabase
      .from('blocked_slots')
      .select('start_datetime, end_datetime')
      .lt('start_datetime', sastEnd.toISOString())
      .gt('end_datetime', sastStart.toISOString())

    // 8. Remove slots that overlap with blocked slots
    if (blockedSlots && blockedSlots.length > 0) {
      availableSlots = availableSlots.filter((slot) => {
        return !blockedSlots.some((blocked) =>
          slotOverlapsBlockedSlot(date, slot, blocked.start_datetime, blocked.end_datetime)
        )
      })
    }

    // 9. Time Travel Bug Fix: Filter out past slots if requesting today
    // Use a 30-minute buffer so customers can't book 5 minutes before a slot starts
    const nowSAST = toZonedTime(new Date(), TIMEZONE)
    const todaySASTStr = format(nowSAST, 'yyyy-MM-dd')
    const BUFFER_MINUTES = 30

    if (date === todaySASTStr) {
      const nowMinutes = nowSAST.getHours() * 60 + nowSAST.getMinutes()
      const cutoffMinutes = nowMinutes + BUFFER_MINUTES

      availableSlots = availableSlots.filter((slot) => {
        const [slotHour, slotMinute] = slot.split(':').map(Number)
        const slotStartMinutes = slotHour * 60 + slotMinute
        return slotStartMinutes > cutoffMinutes
      })
    }

    // 10. Return the final available slots
    return NextResponse.json({
      date,
      timezone: TIMEZONE,
      slots: availableSlots,
    })
  } catch (err: any) {
    console.error('Availability API error:', err)
    return NextResponse.json(
      { error: 'Failed to compute availability', message: err.message },
      { status: 500 }
    )
  }
}
