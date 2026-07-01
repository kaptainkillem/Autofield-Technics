import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { z } from 'zod'
import { parseISO, getDay } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'

const TIMEZONE = 'Africa/Johannesburg'

const BookBodySchema = z.object({
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  scheduled_time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm'),
})

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
  const slotStartSAST = new Date(`${date}T${slotTime}:00+02:00`)
  const slotEndSAST = new Date(`${date}T${slotTime}:00+02:00`)
  slotEndSAST.setMinutes(slotEndSAST.getMinutes() + 60)

  const blockedStartUTC = new Date(blockedStart)
  const blockedEndUTC = new Date(blockedEnd)

  return slotStartSAST < blockedEndUTC && slotEndSAST > blockedStartUTC
}

/**
 * Check if a 1-hour slot starting at `slotTime` overlaps with
 * an appointment that starts at `apptTime` and lasts `durationMinutes`.
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(request)
    const { allowed, remaining } = checkRateLimit(`book:${ip}`, {
      maxRequests: 10,
      windowMs: 60_000,
    })

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many booking attempts. Please try again in a minute.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    const { id } = await params

    // 1. Validate body
    let body: z.infer<typeof BookBodySchema>
    try {
      const raw = await request.json()
      body = BookBodySchema.parse(raw)
    } catch {
      return NextResponse.json(
        { error: 'Invalid body. Expected: { scheduled_date: "YYYY-MM-DD", scheduled_time: "HH:mm" }' },
        { status: 400 }
      )
    }

    const { scheduled_date, scheduled_time } = body
    const supabase = createSupabaseAdminClient()

    // 2. Verify quote exists and is accepted
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, user_id, service_type, status')
      .eq('id', id)
      .single()

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Only allow booking on accepted quotes
    if (quote.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Quote must be accepted before booking' },
        { status: 400 }
      )
    }

    if (!quote.user_id) {
      return NextResponse.json(
        { error: 'Quote must be linked to a user account before booking' },
        { status: 400 }
      )
    }

    // 3. Verify slot is still available (double-booking protection)
    const sastDate = parseISO(scheduled_date)
    const dayOfWeek = getDay(sastDate)

    // Check working hours
    const { data: workingHour } = await supabase
      .from('working_hours')
      .select('start_time, end_time, is_active')
      .eq('day_of_week', dayOfWeek)
      .single()

    if (!workingHour || !workingHour.is_active) {
      return NextResponse.json({ error: 'Shop is closed on this day' }, { status: 400 })
    }

    // Verify slot is within working hours
    const [slotHour] = scheduled_time.split(':').map(Number)
    const [startHour] = workingHour.start_time.split(':').map(Number)
    const [endHour] = workingHour.end_time.split(':').map(Number)

    if (slotHour < startHour || slotHour >= endHour) {
      return NextResponse.json({ error: 'Selected time is outside working hours' }, { status: 400 })
    }

    // Check existing appointments on this date
    const { data: appointments } = await supabase
      .from('appointments')
      .select('scheduled_time, duration_minutes')
      .eq('scheduled_date', scheduled_date)
      .neq('status', 'cancelled')

    if (appointments && appointments.length > 0) {
      const isBlocked = appointments.some((appt) => {
        if (!appt.scheduled_time) return false
        const duration = appt.duration_minutes ?? 60
        return slotOverlapsAppointment(scheduled_time, appt.scheduled_time, duration)
      })
      if (isBlocked) {
        return NextResponse.json(
          { error: 'This slot has just been taken. Please select another time.' },
          { status: 409 }
        )
      }
    }

    // Check blocked slots
    const sastStart = fromZonedTime(`${scheduled_date}T00:00:00`, TIMEZONE)
    const sastEnd = fromZonedTime(`${scheduled_date}T23:59:59`, TIMEZONE)

    const { data: blockedSlots } = await supabase
      .from('blocked_slots')
      .select('start_datetime, end_datetime')
      .lt('start_datetime', sastEnd.toISOString())
      .gt('end_datetime', sastStart.toISOString())

    if (blockedSlots && blockedSlots.length > 0) {
      const isBlocked = blockedSlots.some((blocked) =>
        slotOverlapsBlockedSlot(scheduled_date, scheduled_time, blocked.start_datetime, blocked.end_datetime)
      )
      if (isBlocked) {
        return NextResponse.json(
          { error: 'This time is blocked. Please select another slot.' },
          { status: 409 }
        )
      }
    }

    // 4. Create appointment with pending status (awaits mechanic approval)
    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        user_id: quote.user_id,
        quote_id: quote.id,
        service_type: quote.service_type ?? 'General Service',
        scheduled_date,
        scheduled_time,
        status: 'pending',
        duration_minutes: 60,
        notes: null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert appointment error:', insertError)
      return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
    }

    // 5. Return success
    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        scheduled_date: appointment.scheduled_date,
        scheduled_time: appointment.scheduled_time,
        status: appointment.status,
      },
      message: 'Appointment requested. Awaiting mechanic approval.',
    })
  } catch (err: any) {
    console.error('Book appointment API error:', err)
    return NextResponse.json(
      { error: 'Failed to book appointment', message: err.message },
      { status: 500 }
    )
  }
}
