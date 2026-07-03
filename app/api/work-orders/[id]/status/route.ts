import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabaseServer'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'

const VALID_STATUSES = [
  'checked_in',
  'in_progress',
  'awaiting_parts',
  'revision_pending',
  'ready_for_pickup',
  'completed',
] as const

const StatusBodySchema = z.object({
  status: z.enum(VALID_STATUSES),
  notes: z.string().max(500).optional(),
  client_visible_notes: z.string().max(500).optional(),
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
    const { allowed, remaining } = checkRateLimit(`admin:work-orders-status:${ip}`, { maxRequests: 30, windowMs: 60_000 })
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
        { error: `Invalid body. Expected: { status: ${VALID_STATUSES.join('|')}, notes?: string, client_visible_notes?: string }` },
        { status: 400 }
      )
    }

    const serverClient = await createSupabaseServerClient()
    const { data: { user } } = await serverClient.auth.getUser()
    const adminId = user?.id ?? null

    const adminClient = createSupabaseAdminClient()

    const { data: workOrder, error: fetchError } = await adminClient
      .from('work_orders')
      .select('id, status, appointment_id')
      .eq('id', id)
      .single()

    if (fetchError || !workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    if (workOrder.status === 'completed' && body.status !== 'completed') {
      return NextResponse.json({ error: 'Completed work orders cannot be changed' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const updates: Record<string, unknown> = {
      status: body.status,
      updated_at: now,
    }

    if (body.notes !== undefined) {
      updates.mechanic_notes = body.notes
    }

    if (body.client_visible_notes !== undefined) {
      updates.client_visible_notes = body.client_visible_notes
    }

    if (body.status === 'in_progress' && workOrder.status !== 'in_progress') {
      updates.started_at = now
    }

    if (body.status === 'completed') {
      updates.completed_at = now
    }

    const { data: updated, error: updateError } = await adminClient
      .from('work_orders')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Update work order status error:', updateError)
      return NextResponse.json({ error: 'Failed to update work order status' }, { status: 500 })
    }

    // Record audit event
    await adminClient.from('work_order_events').insert({
      work_order_id: id,
      event_type: 'status_change',
      old_status: workOrder.status,
      new_status: body.status,
      notes: body.notes ?? body.client_visible_notes ?? undefined,
      created_by: adminId,
    })

    // If completed, also mark the appointment as completed
    if (body.status === 'completed' && workOrder.appointment_id) {
      await adminClient
        .from('appointments')
        .update({ status: 'completed', updated_at: now })
        .eq('id', workOrder.appointment_id)
    }

    return NextResponse.json({
      success: true,
      workOrder: updated,
      message: `Work order status updated to ${body.status.replace(/_/g, ' ')}`,
    })
  } catch (err: unknown) {
    console.error('Update work order status API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to update work order status', message }, { status: 500 })
  }
}
