import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'

const LineItemSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1),
  qty: z.number().min(1),
  unitPrice: z.number().min(0),
})

const CreateInvoiceSchema = z.object({
  quoteId: z.string().uuid().optional().nullable(),
  customerName: z.string().trim().min(1),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().trim().optional(),
  vehicleYear: z.number().int().min(1900).max(2100).optional().nullable(),
  vehicleMake: z.string().trim().optional(),
  vehicleModel: z.string().trim().optional(),
  serviceType: z.string().trim().optional(),
  description: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'cancelled']).default('draft'),
  paymentMethod: z.enum(['Cash', 'Card']).optional().nullable(),
  discountPercent: z.number().min(0).max(100).default(0),
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
  const { allowed, remaining } = checkRateLimit(`admin:invoices:${ip}`, { maxRequests: 20, windowMs: 60_000 })
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  }

  let body: z.infer<typeof CreateInvoiceSchema>
  try {
    body = CreateInvoiceSchema.parse(await request.json())
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : 'Invalid invoice'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const subtotal = body.lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  const discountAmount = subtotal * (body.discountPercent / 100)
  const total = Math.max(0, subtotal - discountAmount)
  const invoiceNumber = makeDocumentNumber('AF-I')

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      user_id: auth.userId,
      quote_id: body.quoteId ?? null,
      invoice_number: invoiceNumber,
      customer_name: body.customerName,
      customer_email: body.customerEmail || null,
      customer_phone: body.customerPhone || null,
      vehicle_year: body.vehicleYear ?? null,
      vehicle_make: body.vehicleMake || null,
      vehicle_model: body.vehicleModel || null,
      service_type: body.serviceType || null,
      description: body.description || null,
      notes: body.notes || null,
      status: body.status,
      payment_method: body.paymentMethod ?? null,
      line_items: body.lineItems,
      discount_percent: body.discountPercent,
      subtotal,
      total,
    } as never)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ invoice: data }, { status: 201 })
  } catch (error) {
    console.error('[admin:invoices:create]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

