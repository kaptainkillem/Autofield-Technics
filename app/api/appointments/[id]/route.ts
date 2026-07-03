import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'

const VALID_STATUSES = ['pending', 'proposed', 'confirmed', 'completed', 'cancelled'] as const

const UpdateAppointmentSchema = z.object({
  status: z.enum(VALID_STATUSES).optional(),
  notes: z.string().trim().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const auth = await verifyStaffUser()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, remaining } = checkRateLimit(`admin:appointments-edit:${ip}`, { maxRequests: 30, windowMs: 60_000 })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    let body: z.infer<typeof UpdateAppointmentSchema>
    try {
      body = UpdateAppointmentSchema.parse(await request.json())
    } catch {
      return NextResponse.json({ error: 'Invalid appointment data' }, { status: 400 })
    }

    const adminClient = createSupabaseAdminClient()

    const { data: existing, error: fetchError } = await adminClient
      .from('appointments')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.status !== undefined) updates.status = body.status
    if (body.notes !== undefined) updates.notes = body.notes || null

    const { data, error } = await adminClient
      .from('appointments')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update appointment error:', error)
      return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
    }

    return NextResponse.json({ success: true, appointment: data })
  } catch (err: unknown) {
    console.error('Update appointment API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to update appointment', message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const auth = await verifyStaffUser()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, remaining } = checkRateLimit(`admin:appointments-delete:${ip}`, { maxRequests: 20, windowMs: 60_000 })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    const adminClient = createSupabaseAdminClient()

    const { data: existing, error: fetchError } = await adminClient
      .from('appointments')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    const { error } = await adminClient.from('appointments').delete().eq('id', id)

    if (error) {
      console.error('Delete appointment error:', error)
      return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Appointment deleted' })
  } catch (err: unknown) {
    console.error('Delete appointment API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to delete appointment', message }, { status: 500 })
  }
}
