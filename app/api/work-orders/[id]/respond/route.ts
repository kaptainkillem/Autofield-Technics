import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limiter'
import { randomUUID } from 'crypto'

const RespondBodySchema = z.object({
  action: z.enum(['accept', 'decline']),
})

interface LineItem {
  id: string
  name: string
  qty: number
  unitPrice: number
}

function parseLineItems(value: unknown): LineItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item): LineItem | null => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null
      const row = item as Record<string, unknown>
      return {
        id: String(row.id ?? ''),
        name: String(row.name ?? ''),
        qty: Number(row.qty ?? 1),
        unitPrice: Number(row.unitPrice ?? 0),
      }
    })
    .filter((item): item is LineItem => Boolean(item?.name))
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const serverClient = await createSupabaseServerClient()
    const { data: { user } } = await serverClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { allowed, remaining } = checkRateLimit(`customer:revision-respond:${user.id}`, {
      maxRequests: 20,
      windowMs: 60_000,
    })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    let body: z.infer<typeof RespondBodySchema>
    try {
      body = RespondBodySchema.parse(await request.json())
    } catch {
      return NextResponse.json({ error: 'Invalid body. Expected: { action: "accept" | "decline" }' }, { status: 400 })
    }

    const adminClient = await createSupabaseServerClient()

    const { data: workOrder, error: fetchError } = await adminClient
      .from('work_orders')
      .select('id, status, quote_id, additional_work_items, additional_work_total, workshop_id')
      .eq('id', id)
      .single()

    if (fetchError || !workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    if (workOrder.status !== 'revision_pending') {
      return NextResponse.json({ error: 'This work order does not have a pending revision' }, { status: 400 })
    }

    const { data: quote, error: quoteError } = await adminClient
      .from('quotes')
      .select('id, user_id, line_items, subtotal, total, discount_percent')
      .eq('id', workOrder.quote_id)
      .single()

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    if (quote.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only respond to your own work orders' }, { status: 403 })
    }

    const now = new Date().toISOString()

    if (body.action === 'accept') {
      const additionalItems = parseLineItems(workOrder.additional_work_items)
      const existingItems = parseLineItems(quote.line_items)

      // Generate fresh IDs to avoid collisions with existing quote line items
      const mergedItems = [
        ...existingItems,
        ...additionalItems.map((item) => ({ ...item, id: randomUUID() })),
      ]

      const subtotal = mergedItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
      const discountPercent = Number(quote.discount_percent ?? 0)
      const discountAmount = subtotal * (discountPercent / 100)
      const total = Math.max(0, subtotal - discountAmount)

      const { error: quoteUpdateError } = await adminClient
        .from('quotes')
        .update({
          line_items: mergedItems as never,
          subtotal,
          total,
          estimated_quote: total,
          description: mergedItems.map((item) => item.name).join(', '),
          updated_at: now,
        })
        .eq('id', quote.id)

      if (quoteUpdateError) {
        console.error('Quote update error on revision accept:', quoteUpdateError)
        return NextResponse.json({ error: 'Failed to update quote with additional work' }, { status: 500 })
      }
    }

    const { data: updated, error: updateError } = await adminClient
      .from('work_orders')
      .update({
        status: 'in_progress',
        revision_approved: body.action === 'accept',
        revision_responded_at: now,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Respond to revision error:', updateError)
      return NextResponse.json({ error: 'Failed to respond to additional work request' }, { status: 500 })
    }

    // Record audit event
    await adminClient.from('work_order_events').insert({
      work_order_id: id,
      workshop_id: workOrder.workshop_id!,
      event_type: body.action === 'accept' ? 'revision_accepted' : 'revision_declined',
      old_status: 'revision_pending',
      new_status: 'in_progress',
      notes: body.action === 'accept'
        ? `Client accepted additional work worth R${workOrder.additional_work_total}`
        : 'Client declined additional work',
      created_by: user.id,
    })

    return NextResponse.json({
      success: true,
      workOrder: updated,
      message: body.action === 'accept'
        ? 'Additional work accepted and added to your quote.'
        : 'Additional work declined. The mechanic will continue with the original scope.',
    })
  } catch (err: unknown) {
    console.error('Respond to revision API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to respond to additional work request', message }, { status: 500 })
  }
}
