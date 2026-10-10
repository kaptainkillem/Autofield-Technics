import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSuperAdminClient } from '@/lib/super-admin'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { checkRateLimit } from '@/lib/rate-limiter'

const QuoteSchema = z.object({
  workshop_id: z.string().uuid(),
  customer_name: z.string().trim().min(1).max(200),
  customer_email: z.string().email().max(320).nullable().optional(),
  customer_phone: z.string().trim().min(1).max(50),
  vehicle_make: z.string().trim().max(100).nullable().optional(),
  vehicle_model: z.string().trim().max(100).nullable().optional(),
  vehicle_year: z.number().int().min(1886).max(2100).nullable().optional(),
  description: z.string().trim().min(1).max(2000),
  service_type: z.string().trim().max(100).nullable().optional(),
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed, remaining } = checkRateLimit(`quotes:create:${ip}`, { maxRequests: 5, windowMs: 60_000 })
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, {
      status: 429,
      headers: { 'X-RateLimit-Remaining': String(remaining) },
    })
  }

  let body: z.infer<typeof QuoteSchema>
  try {
    body = QuoteSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Please check the quote details and try again.' }, { status: 400 })
  }

  try {
    const adminClient = createSuperAdminClient()
    const { data: workshop, error: workshopError } = await adminClient
      .from('workshops')
      .select('id')
      .eq('id', body.workshop_id)
      .maybeSingle()
    if (workshopError || !workshop) {
      return NextResponse.json({ error: 'Workshop could not be found.' }, { status: 400 })
    }

    const sessionClient = await createSupabaseServerClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    const { data: quote, error } = await adminClient
      .from('quotes')
      .insert({
        workshop_id: workshop.id,
        user_id: user?.id ?? null,
        customer_name: body.customer_name,
        customer_email: body.customer_email || null,
        customer_phone: body.customer_phone,
        vehicle_make: body.vehicle_make || null,
        vehicle_model: body.vehicle_model || null,
        vehicle_year: body.vehicle_year ?? null,
        description: body.description,
        service_type: body.service_type || null,
        status: 'pending',
      } as never)
      .select('id, quote_token')
      .single()

    if (error || !quote) {
      console.error('Quote submission error:', error)
      return NextResponse.json({ error: 'Could not save your request. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ id: quote.id, quote_token: quote.quote_token }, { status: 201 })
  } catch (error) {
    console.error('Quote submission API error:', error)
    return NextResponse.json({ error: 'Could not save your request. Please try again.' }, { status: 500 })
  }
}
