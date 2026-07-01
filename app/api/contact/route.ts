import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { sanitizeText, sanitizeName, sanitizeEmail, sanitizePhone } from '@/lib/input-sanitizer'
import { z } from 'zod'
import { Resend } from 'resend'
import { SITE_CONFIG } from '@/lib/site-config'

const resend = new Resend(process.env.RESEND_API_KEY)
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Autofield Technics <onboarding@resend.dev>'
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? SITE_CONFIG.contact.email

const CONTACT_SCHEMA = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone is required').max(30),
  message: z.string().min(1, 'Message is required').max(2000),
})

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const { allowed, remaining } = checkRateLimit(`contact:${ip}`, {
      maxRequests: 3,
      windowMs: 60_000,
    })

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many messages. Please try again in a minute.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    const body = await req.json()
    const parsed = CONTACT_SCHEMA.parse(body)

    const name = sanitizeName(parsed.name)
    const email = parsed.email ? sanitizeEmail(parsed.email) : null
    const phone = sanitizePhone(parsed.phone)
    const message = sanitizeText(parsed.message, 2000)

    const emailHtml = `
<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
  <h2 style="color: #3B82F6; margin-bottom: 16px;">New Contact Message</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
    <tr><td style="padding: 8px 0; font-weight: 600;">Name</td><td>${escapeHtml(name)}</td></tr>
    <tr><td style="padding: 8px 0; font-weight: 600;">Email</td><td>${escapeHtml(email ?? 'N/A')}</td></tr>
    <tr><td style="padding: 8px 0; font-weight: 600;">Phone</td><td>${escapeHtml(phone)}</td></tr>
    <tr><td style="padding: 8px 0; font-weight: 600; vertical-align: top;">Message</td><td>${escapeHtml(message)}</td></tr>
  </table>
  <hr style="border: none; border-top: 1px solid #e5e7eb;" />
  <p style="font-size: 12px; color: #9ca3af;">Sent from ${SITE_CONFIG.name} contact form</p>
</div>`.trim()

    await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: `Contact Form: ${name} from ${SITE_CONFIG.name}`,
      html: emailHtml,
      replyTo: email || undefined,
    })

    return NextResponse.json(
      { success: true, message: 'Message sent successfully!' },
      { status: 200, headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  } catch (err) {
    console.error('Contact API error:', err)

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: err.issues[0]?.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
