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

const EditQuoteSchema = z.object({
  customerName: z.string().trim().min(1).optional(),
  customerEmail: z.string().email().optional().or(z.literal('')).optional(),
  customerPhone: z.string().trim().min(1).optional(),
  vehicleYear: z.number().int().min(1900).max(2100).optional().nullable(),
  vehicleMake: z.string().trim().optional(),
  vehicleModel: z.string().trim().optional(),
  serviceType: z.string().trim().optional(),
  description: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  status: z.enum(['draft', 'pending', 'sent', 'accepted', 'declined', 'completed', 'cancelled']).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  depositPercent: z.number().min(0).max(100).optional(),
  depositAmount: z.number().min(0).optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  lineItems: z.array(LineItemSchema).min(1).optional(),
  pdfUrl: z.string().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

  const auth = await verifyStaffUser()
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed, remaining } = checkRateLimit(`admin:quotes-edit:${ip}`, { maxRequests: 20, windowMs: 60_000 })
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  }

  let body: z.infer<typeof EditQuoteSchema>
  try {
    body = EditQuoteSchema.parse(await request.json())
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : 'Invalid payload'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()

  const { data: existing, error: fetchError } = await supabase
    .from('quotes')
    .select('id, quote_token')
    .eq('id', id)
    .eq('workshop_id', auth.workshopId as string)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.customerName !== undefined) updates.customer_name = body.customerName
  if (body.customerEmail !== undefined) updates.customer_email = body.customerEmail || null
  if (body.customerPhone !== undefined) updates.customer_phone = body.customerPhone
  if (body.vehicleMake !== undefined) updates.vehicle_make = body.vehicleMake || null
  if (body.vehicleModel !== undefined) updates.vehicle_model = body.vehicleModel || null
  if (body.serviceType !== undefined) updates.service_type = body.serviceType || null
  if (body.description !== undefined) updates.description = body.description || null
  if (body.notes !== undefined) updates.notes = body.notes || null
  if (body.status !== undefined) {
    updates.status = body.status
    if (body.status === 'sent') {
      updates.whatsapp_sent_at = new Date().toISOString()
    }
  }
  if (body.discountPercent !== undefined) updates.discount_percent = body.discountPercent
  if (body.depositPercent !== undefined) updates.deposit_percent = body.depositPercent
  if (body.depositAmount !== undefined) updates.deposit_amount = body.depositAmount
  if (body.expiryDate !== undefined) updates.expiry_date = body.expiryDate || null
  if (body.pdfUrl !== undefined) updates.pdf_url = body.pdfUrl

  if (body.vehicleYear !== undefined) {
    updates.vehicle_year = body.vehicleYear ?? null
  }

  if (body.lineItems !== undefined) {
    const subtotal = body.lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
    const discountPercent = body.discountPercent ?? 0
    const discountAmount = subtotal * (discountPercent / 100)
    const total = Math.max(0, subtotal - discountAmount)

    updates.line_items = body.lineItems as never
    updates.subtotal = subtotal
    updates.total = total
    updates.description = body.description || body.lineItems.map((item) => item.name).join(', ')
    updates.estimated_quote = total
  }

  if (!(existing as any).quote_token) {
    updates.quote_token = crypto.randomUUID()
  }

  const { data, error } = await supabase
    .from('quotes')
    .update(updates as never)
    .eq('id', id)
    .eq('workshop_id', auth.workshopId as string)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ quote: data })
  } catch (error) {
    console.error('[admin:quotes:edit]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
