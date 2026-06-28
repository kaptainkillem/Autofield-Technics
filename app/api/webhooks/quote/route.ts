import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { SITE_CONFIG } from '@/lib/site-config'
import { buildQuoteNotificationEmail } from '@/lib/email-templates'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Autofield Alerts <onboarding@resend.dev>'
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? SITE_CONFIG.contact.email

const WebhookPayloadSchema = z.object({
  record: z.object({
    customer_name: z.string().optional(),
    customer_phone: z.string().optional(),
    vehicle_make: z.string().optional(),
    vehicle_model: z.string().optional(),
    vehicle_year: z.union([z.number(), z.string()]).optional(),
    description: z.string().optional(),
  }).optional(),
  new: z.object({
    customer_name: z.string().optional(),
    customer_phone: z.string().optional(),
    vehicle_make: z.string().optional(),
    vehicle_model: z.string().optional(),
    vehicle_year: z.union([z.number(), z.string()]).optional(),
    description: z.string().optional(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // 🛡️ 1. Security Check: Validate incoming headers to guarantee only Supabase calls this
    const webhookSecret = request.headers.get('x-supabase-webhook-secret')
    if (webhookSecret !== process.env.SUPABASE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized network dispatch' }, { status: 401 })
    }

    // 2. Validate payload structure with Zod
    const rawPayload = await request.json()
    const parsed = WebhookPayloadSchema.safeParse(rawPayload)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Malformed webhook payload' }, { status: 400 })
    }

    // Supabase payload data maps the raw row inside the 'record' or 'new' parameter fields
    const quote = parsed.data.record || parsed.data.new

    if (!quote) {
      return NextResponse.json({ error: 'No data records found in transaction body' }, { status: 400 })
    }

    // Extract raw string attributes or configure clean system fallbacks
    const name = quote.customer_name || 'Anonymous Client'
    const phone = quote.customer_phone || 'Not provided'
    const make = quote.vehicle_make || 'Unknown Make'
    const model = quote.vehicle_model || 'Unknown Model'
    const year = quote.vehicle_year || 'N/A'
    const rawDescription = quote.description || ''

    // Parse out service type parameters or raw VIN items cleanly if embedded in the description string
    const serviceTypeMatch = rawDescription.match(/\[Service:\s*([^\]]+)\]/)
    const vinMatch = rawDescription.match(/\[VIN:\s*([^\]]+)\]/)
    
    const service = serviceTypeMatch ? serviceTypeMatch[1] : 'General Mechanical Work'
    const vin = vinMatch ? vinMatch[1] : 'Not provided'

    // Clean description body text extraction
    const cleanDescription = rawDescription.includes(' — ') 
      ? rawDescription.split(' — ')[1] 
      : rawDescription

    // 🚀 3. Execute the automated mail delivery transaction using reusable template
    const { subject, text, html } = buildQuoteNotificationEmail({
      id: 'webhook',
      customer_name: name,
      customer_phone: phone,
      vehicle_make: make,
      vehicle_model: model,
      vehicle_year: String(year),
      service_type: service,
      description: cleanDescription,
    })

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject,
      text,
      html,
    })

    if (error) {
      console.error('Mail system error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (err: any) {
    console.error('Webhook execution crash flag:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}