import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { SITE_CONFIG } from '@/lib/site-config'

const resend = new Resend(process.env.RESEND_API_KEY)
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Autofield Alerts <onboarding@resend.dev>'
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? SITE_CONFIG.contact.email

export async function POST(request: NextRequest) {
  try {
    // 🛡️ 1. Security Check: Validate incoming headers to guarantee only Supabase calls this
    const webhookSecret = request.headers.get('x-supabase-webhook-secret')
    if (webhookSecret !== process.env.SUPABASE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized network dispatch' }, { status: 401 })
    }

    // 2. Extract payload snapshot directly from the database engine insert transaction
    const payload = await request.json()
    
    // Supabase payload data maps the raw row inside the 'record' or 'new' parameter fields
    const quote = payload.record || payload.new

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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'

    // 🚀 3. Execute the automated mail delivery transaction
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: `🔧 New Quote Request: ${name} — ${make} ${model}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; rounded-radius: 8px;">
          <h2 style="color: #1a1a1a; margin-bottom: 5px;">New Repair Quote Requested</h2>
          <p style="color: #666; font-size: 14px; margin-top: 0;">A customer has just submitted an estimate request form on your platform.</p>
          
          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          
          <h3 style="color: #333; font-size: 16px; margin-bottom: 10px;">👤 Customer Details</h3>
          <p style="font-size: 14px; margin: 4px 0;"><strong>Name:</strong> ${name}</p>
          <p style="font-size: 14px; margin: 4px 0;"><strong>WhatsApp/Phone:</strong> ${phone}</p>
          
          <h3 style="color: #333; font-size: 16px; margin-bottom: 10px; margin-top: 20px;">🚗 Vehicle & Service</h3>
          <p style="font-size: 14px; margin: 4px 0;"><strong>Vehicle:</strong> ${year} ${make} ${model}</p>
          <p style="font-size: 14px; margin: 4px 0;"><strong>VIN Key:</strong> <span style="font-family: monospace; background: #f5f5f5; padding: 2px 4px; border-radius: 4px;">${vin}</span></p>
          <p style="font-size: 14px; margin: 4px 0;"><strong>Requested Service:</strong> <span style="color: #E11D48; font-weight: bold;">${service}</span></p>
          
          <h3 style="color: #333; font-size: 16px; margin-bottom: 10px; margin-top: 20px;">📝 Issue Description</h3>
          <div style="background: #f9f9f9; padding: 12px; border-radius: 6px; border-left: 4px solid #cbd5e1; font-size: 14px; color: #475569; line-height: 1.6; font-style: italic;">
            "${cleanDescription}"
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${appUrl}/dashboard/admin/quotes" style="background: #E11D48; color: white; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px; display: inline-block;">
              Open Admin Quotes Inbox →
            </a>
          </div>
        </div>
      `,
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