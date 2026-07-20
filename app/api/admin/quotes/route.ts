import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import crypto from 'node:crypto'

const LineItemSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1),
  qty: z.number().min(1),
  unitPrice: z.number().min(0),
})

const CreateQuoteSchema = z.object({
  customerName: z.string().trim().min(1),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().trim().min(1),
  vehicleYear: z.number().int().min(1900).max(2100).optional().nullable(),
  vehicleMake: z.string().trim().optional(),
  vehicleModel: z.string().trim().optional(),
  serviceType: z.string().trim().optional(),
  description: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  status: z.enum(['draft', 'pending', 'sent', 'accepted', 'declined', 'completed', 'cancelled']).default('draft'),
  discountPercent: z.number().min(0).max(100).default(0),
  depositPercent: z.number().min(0).max(100).optional(),
  depositAmount: z.number().min(0).optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  lineItems: z.array(LineItemSchema).min(1),
})

function makeDocumentNumber(prefix: string) {
  const now = new Date()
  return `${prefix}-${now.getFullYear()}-${now.getTime()}`
}

export async function POST(request: Request) {
  try {
    const auth = await verifyStaffUser()
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed, remaining } = checkRateLimit(`admin:quotes:${ip}`, { maxRequests: 20, windowMs: 60_000 })
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  }

  let body: z.infer<typeof CreateQuoteSchema>
  try {
    body = CreateQuoteSchema.parse(await request.json())
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : 'Invalid quote'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const subtotal = body.lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  const discountAmount = subtotal * (body.discountPercent / 100)
  const total = Math.max(0, subtotal - discountAmount)
  const quoteNumber = makeDocumentNumber('AF-Q')
  const description = body.description || body.lineItems.map((item) => item.name).join(', ')

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('quotes')
    .insert({
      workshop_id: auth.workshopId,
      user_id: auth.userId,
      quote_token: crypto.randomUUID(),
      customer_name: body.customerName,
      customer_email: body.customerEmail || null,
      customer_phone: body.customerPhone,
      vehicle_year: body.vehicleYear ?? null,
      vehicle_make: body.vehicleMake || null,
      vehicle_model: body.vehicleModel || null,
      service_type: body.serviceType || null,
      description,
      notes: body.notes || null,
      status: body.status,
      estimated_quote: total,
      quote_number: quoteNumber,
      line_items: body.lineItems,
      discount_percent: body.discountPercent,
      deposit_percent: body.depositPercent ?? null,
      deposit_amount: body.depositAmount ?? null,
      expiry_date: body.expiryDate ?? null,
      subtotal,
      total,
      source: 'mechanic',
    } as never)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ quote: data }, { status: 201 })
  } catch (error) {
    console.error('[admin:quotes:create]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
