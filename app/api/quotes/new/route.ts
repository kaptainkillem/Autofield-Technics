import { NextRequest, NextResponse } from 'next/server'
import { createSuperAdminClient } from '@/lib/super-admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { z } from 'zod'
import { sanitizeText, sanitizeEmail, sanitizePhone } from '@/lib/input-sanitizer'

const QuoteSubmitSchema = z.object({
  workshopId: z.string().uuid('Invalid workshop'),
  customerName: z.string().min(1, 'Name is required').max(200),
  customerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  customerPhone: z.string().min(1, 'Phone is required').max(30),
  brand: z.string().max(100).default(''),
  model: z.string().max(100).default(''),
  year: z.union([z.string(), z.number()]).optional(),
  vin: z.string().max(17).default(''),
  service: z.string().min(1, 'Service is required'),
  description: z.string().min(1, 'Description is required').max(2000),
})

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const { allowed, remaining } = checkRateLimit(`quote:submit:${ip}`, {
      maxRequests: 10,
      windowMs: 60_000,
    })

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many quote submissions. Please try again in a minute.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    const body = await req.json()

    let parsed
    try {
      parsed = QuoteSubmitSchema.parse(body)
    } catch (err: any) {
      return NextResponse.json(
        { error: err.errors?.[0]?.message || 'Invalid request body' },
        { status: 400 }
      )
    }

    const adminClient = createSuperAdminClient()

    const defaultSlug = process.env.NEXT_PUBLIC_DEFAULT_WORKSHOP_SLUG
    if (!defaultSlug) {
      return NextResponse.json(
        { error: 'Workshop not configured for this deployment.' },
        { status: 403 }
      )
    }

    const { data: defaultWorkshop } = await adminClient
      .from('workshops')
      .select('id')
      .eq('slug', defaultSlug)
      .maybeSingle()

    if (!defaultWorkshop || defaultWorkshop.id !== parsed.workshopId) {
      return NextResponse.json(
        { error: 'Invalid workshop identifier.' },
        { status: 403 }
      )
    }

    const integratedDescription = `[Service: ${sanitizeText(parsed.service, 200)}]${parsed.vin ? ` [VIN: ${sanitizeText(parsed.vin, 17)}]` : ''} — ${sanitizeText(parsed.description, 2000) || 'No description provided.'}`

    const { data, error: insertError } = await adminClient
      .from('quotes')
      .insert({
        workshop_id: parsed.workshopId,
        customer_name: sanitizeText(parsed.customerName, 200),
        customer_email: parsed.customerEmail ? sanitizeEmail(parsed.customerEmail) || null : null,
        customer_phone: sanitizePhone(parsed.customerPhone),
        vehicle_make: sanitizeText(parsed.brand, 100),
        vehicle_model: sanitizeText(parsed.model, 100),
        vehicle_year: parsed.year ? parseInt(String(parsed.year)) : null,
        description: sanitizeText(integratedDescription, 2000),
        status: 'pending',
      })
      .select('id, quote_token')
      .single()

    if (insertError) {
      console.error('Quote insert error:', insertError)
      return NextResponse.json(
        { error: 'Could not save your request. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      quoteId: data.id,
      quoteToken: data.quote_token,
    })
  } catch (err: any) {
    console.error('Quote submission API error:', err)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}
