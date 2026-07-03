import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabaseServer'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'

const RevisionItemSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1),
  qty: z.number().min(1),
  unitPrice: z.number().min(0),
})

const RevisionBodySchema = z.object({
  items: z.array(RevisionItemSchema).min(1),
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
    const { allowed, remaining } = checkRateLimit(`admin:work-orders-revision:${ip}`, { maxRequests: 20, windowMs: 60_000 })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    let body: z.infer<typeof RevisionBodySchema>
    try {
      body = RevisionBodySchema.parse(await request.json())
    } catch {
      return NextResponse.json(
        { error: 'Invalid body. Expected: { items: [{id, name, qty, unitPrice}], client_visible_notes?: string }' },
        { status: 400 }
      )
    }

    const serverClient = await createSupabaseServerClient()
    const { data: { user } } = await serverClient.auth.getUser()
    const adminId = user?.id ?? null

    const adminClient = createSupabaseAdminClient()

    const { data: workOrder, error: fetchError } = await adminClient
      .from('work_orders')
      .select('id, status, quote_id')
      .eq('id', id)
      .single()

    if (fetchError || !workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    if (workOrder.status === 'completed') {
      return NextResponse.json({ error: 'Cannot request additional work on a completed job' }, { status: 400 })
    }

    const additionalTotal = body.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
    const now = new Date().toISOString()

    const { data: updated, error: updateError } = await adminClient
      .from('work_orders')
      .update({
        status: 'revision_pending',
        additional_work_items: body.items as never,
        additional_work_total: additionalTotal,
        revision_approved: null,
        revision_responded_at: null,
        client_visible_notes: body.client_visible_notes ?? null,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Submit revision error:', updateError)
      return NextResponse.json({ error: 'Failed to submit additional work request' }, { status: 500 })
    }

    // Record audit event
    await adminClient.from('work_order_events').insert({
      work_order_id: id,
      event_type: 'revision_submitted',
      old_status: workOrder.status,
      new_status: 'revision_pending',
      notes: `Additional work: ${body.items.map((i) => `${i.name} (x${i.qty})`).join(', ')}`,
      created_by: adminId,
    })

    return NextResponse.json({
      success: true,
      workOrder: updated,
      message: 'Additional work request submitted. Client will be notified.',
    })
  } catch (err: unknown) {
    console.error('Submit revision API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to submit additional work request', message }, { status: 500 })
  }
}
