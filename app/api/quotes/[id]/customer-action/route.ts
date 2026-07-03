import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabaseServer'
import { checkRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'

const CustomerActionSchema = z.object({
  action: z.enum(['accept', 'decline']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, remaining } = checkRateLimit(`customer-action:${ip}`, { maxRequests: 10, windowMs: 60_000 })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    const supabaseAuth = await createSupabaseServerClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()

    let body: z.infer<typeof CustomerActionSchema>
    try {
      body = CustomerActionSchema.parse(await request.json())
    } catch {
      return NextResponse.json(
        { error: 'Invalid body. Expected: { action: "accept" | "decline" }' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseAdminClient()

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, user_id, status, customer_email')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    if (user) {
      const isOwner = quote.user_id === user.id
      const emailMatch = quote.customer_email && user.email && quote.customer_email.toLowerCase() === user.email.toLowerCase()
      if (!isOwner && !emailMatch) {
        return NextResponse.json({ error: 'This quote does not belong to you' }, { status: 403 })
      }
    }

    if (quote.status !== 'sent') {
      return NextResponse.json(
        { error: `Cannot ${body.action} a quote with status "${quote.status}"` },
        { status: 400 }
      )
    }

    const newStatus = body.action === 'accept' ? 'accepted' : 'declined'

    const updateFields: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    if (user && !quote.user_id) {
      updateFields.user_id = user.id
    }

    const { data: updated, error: updateError } = await supabase
      .from('quotes')
      .update(updateFields as any)
      .eq('id', id)
      .select()
      .single() as { data: any; error: any }

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ quote: updated })
  } catch (err) {
    console.error('[CUSTOMER QUOTE ACTION]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
