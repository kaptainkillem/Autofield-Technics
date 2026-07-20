import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { createSuperAdminClient } from '@/lib/super-admin'
import { checkRateLimit } from '@/lib/rate-limiter'
import { sendTemplateEmail, getWorkshopAdminEmail } from '@/lib/email'
import { z } from 'zod'

const CustomerActionSchema = z.object({
  action: z.enum(['accept', 'decline']),
  quote_token: z.string().uuid().optional(),
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

    const adminClient = createSuperAdminClient()

    const supabase = await createSupabaseServerClient()

    let body: z.infer<typeof CustomerActionSchema>
    try {
      body = CustomerActionSchema.parse(await request.json())
    } catch {
      return NextResponse.json(
        { error: 'Invalid body. Expected: { action: "accept" | "decline", quote_token?: string }' },
        { status: 400 }
      )
    }

    const { data: quote, error: quoteError } = await adminClient
      .from('quotes')
      .select('id, user_id, status, customer_email, workshop_id, customer_name, customer_phone, vehicle_year, vehicle_make, vehicle_model, service_type, quote_number, total, quote_token')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Check if this quote is already owned — only authenticated users can act on owned quotes
    if (quote.user_id) {
      // Cryptographically verify the session
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return NextResponse.json({ error: 'Please sign in to manage this quote' }, { status: 401 })
      }

      const emailMatch = quote.customer_email && user.email &&
        quote.customer_email.toLowerCase() === user.email.toLowerCase()

      if (quote.user_id !== user.id && !emailMatch) {
        return NextResponse.json({ error: 'This quote does not belong to you' }, { status: 403 })
      }
    } else {
      // Quote is unclaimed — user must provide the quote_token to claim it
      if (!body.quote_token) {
        return NextResponse.json({ error: 'Please sign in and provide your quote token to claim this quote' }, { status: 401 })
      }

      if (body.quote_token !== quote.quote_token) {
        return NextResponse.json({ error: 'Invalid quote token' }, { status: 403 })
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return NextResponse.json({ error: 'Please sign in to claim this quote' }, { status: 401 })
      }

      // Claim: link this quote to the authenticated user
      const { error: claimError } = await adminClient
        .from('quotes')
        .update({ user_id: user.id, updated_at: new Date().toISOString() })
        .eq('id', id)
        .is('user_id', null)

      if (claimError) {
        return NextResponse.json({ error: 'Failed to claim quote. It may already be claimed.' }, { status: 409 })
      }

      quote.user_id = user.id
    }

    if (quote.status !== 'sent') {
      return NextResponse.json(
        { error: `Cannot ${body.action} a quote with status "${quote.status}"` },
        { status: 400 }
      )
    }

    const newStatus = body.action === 'accept' ? 'accepted' : 'declined'

    const { data: updated, error: updateError } = await adminClient
      .from('quotes')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    if (quote.workshop_id) {
      const vehicleInfo = [quote.vehicle_year, quote.vehicle_make, quote.vehicle_model].filter(Boolean).join(' ') || 'N/A'
      const total = `R ${Number(quote.total || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
      const vars = {
        customerName: quote.customer_name,
        customerPhone: quote.customer_phone || 'N/A',
        vehicleInfo,
        quoteNumber: quote.quote_number || id.slice(0, 8),
        total,
        dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/dashboard/admin/quotes`,
      }

      if (newStatus === 'accepted') {
        const adminEmail = await getWorkshopAdminEmail(quote.workshop_id)
        if (adminEmail) {
          sendTemplateEmail({
            templateKey: 'quote_accepted_alert',
            to: adminEmail,
            variables: vars,
            workshopId: quote.workshop_id,
          }).catch(() => {})
        }
      } else {
        const adminEmail = await getWorkshopAdminEmail(quote.workshop_id)
        if (adminEmail) {
          sendTemplateEmail({
            templateKey: 'quote_declined_alert',
            to: adminEmail,
            variables: vars,
            workshopId: quote.workshop_id,
          }).catch(() => {})
        }
      }
    }

    return NextResponse.json({ quote: updated })
  } catch (err) {
    console.error('[CUSTOMER QUOTE ACTION]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
