import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter'
import { sanitizeText, sanitizeName, sanitizeEmail, sanitizePhone } from '@/lib/input-sanitizer'
import { z } from 'zod'

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

    const supabase = createSupabaseAdminClient()

    const { error } = await supabase.from('leads').insert({
      name: sanitizeName(parsed.name),
      phone: sanitizePhone(parsed.phone),
      notes: sanitizeText(parsed.message, 2000),
    })

    if (error) {
      console.error('Contact insert error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to send message. Please try again.' },
        { status: 500 }
      )
    }

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
