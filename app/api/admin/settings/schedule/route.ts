import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'

const WorkingHourSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  is_active: z.boolean(),
})

const UpsertWorkingHoursSchema = z.object({
  type: z.literal('working_hours'),
  hours: z.array(WorkingHourSchema).min(7).max(7),
})

const AddBlockedSlotSchema = z.object({
  type: z.literal('blocked_slot_add'),
  start_datetime: z.string(),
  end_datetime: z.string(),
  reason: z.string().optional().nullable(),
})

const DeleteBlockedSlotSchema = z.object({
  type: z.literal('blocked_slot_delete'),
  id: z.string().uuid(),
})

const RequestBodySchema = z.discriminatedUnion('type', [
  UpsertWorkingHoursSchema,
  AddBlockedSlotSchema,
  DeleteBlockedSlotSchema,
])

export async function POST(request: NextRequest) {
  const auth = await verifyStaffUser()
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed, remaining } = checkRateLimit(`admin:schedule:${ip}`, { maxRequests: 20, windowMs: 60_000 })
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  }

  let body
  try {
    body = RequestBodySchema.parse(await request.json())
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()

  if (body.type === 'working_hours') {
    const { error } = await supabase
      .from('working_hours')
      .upsert(
        body.hours.map((h) => ({
          day_of_week: h.day_of_week,
          start_time: h.start_time,
          end_time: h.end_time,
          is_active: h.is_active,
        })),
        { onConflict: 'day_of_week' }
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (body.type === 'blocked_slot_add') {
    const { error } = await supabase
      .from('blocked_slots')
      .insert({
        start_datetime: body.start_datetime,
        end_datetime: body.end_datetime,
        reason: body.reason ?? null,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (body.type === 'blocked_slot_delete') {
    const { error } = await supabase
      .from('blocked_slots')
      .delete()
      .eq('id', body.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown operation' }, { status: 400 })
}
