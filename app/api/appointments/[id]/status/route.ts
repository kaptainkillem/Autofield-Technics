import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'

const VALID_STATUSES = ['pending', 'proposed', 'confirmed', 'completed', 'cancelled'] as const

const StatusBodySchema = z.object({
  status: z.enum(VALID_STATUSES),
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
    const { allowed, remaining } = checkRateLimit(`admin:appointments-status:${ip}`, { maxRequests: 30, windowMs: 60_000 })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    let body: z.infer<typeof StatusBodySchema>
    try {
      body = StatusBodySchema.parse(await request.json())
    } catch {
      return NextResponse.json(
        { error: `Invalid body. Expected: { status: ${VALID_STATUSES.join('|')}, notes?: string }` },
        { status: 400 }
      )
    }

    const adminClient = await createSupabaseServerClient()

    const { data: existing, error: fetchError } = await adminClient
      .from('appointments')
      .select('id')
      .eq('id', id)
      .eq('workshop_id', auth.workshopId!)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = {
      status: body.status,
      updated_at: new Date().toISOString(),
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes || null
    }

    const { data, error } = await adminClient
      .from('appointments')
      .update(updates as never)
      .eq('id', id)
      .eq('workshop_id', auth.workshopId!)
      .select()
      .single()

    if (error) {
      console.error('Update appointment status error:', error)
      return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
    }

    return NextResponse.json({ success: true, appointment: data })
  } catch (err: unknown) {
    console.error('Update appointment status API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to update appointment', message }, { status: 500 })
  }
}
