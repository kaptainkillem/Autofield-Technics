import { NextRequest, NextResponse } from 'next/server'
import { createSuperAdminClient } from '@/lib/super-admin'
import { createSupabaseServerClient, getRoleFromJWT } from '@/lib/supabaseServer'
import { sanitizeText, sanitizePhone, sanitizeEmail } from '@/lib/input-sanitizer'
import { checkRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'

const WorkshopSettingsSchema = z.object({
  workshopId: z.string().uuid('Workshop ID is required'),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  primary_text_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondary_text_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  favicon_url: z.string().url().max(500).optional().or(z.literal('')),
  logo_url: z.string().url().max(500).optional().or(z.literal('')),
  og_image_url: z.string().url().max(500).optional().or(z.literal('')),
  font_family: z.string().max(100).optional(),
  notification_email: z.boolean().optional(),
  notification_push: z.boolean().optional(),
  notification_whatsapp: z.boolean().optional(),
  whatsapp_auto_reply: z.string().max(500).optional().or(z.literal('')),
  whatsapp_business_only: z.boolean().optional(),
  admin_notification_email: z.string().email().max(255).optional().or(z.literal('')),
  email_display_name: z.string().max(200).optional().or(z.literal('')),
  email_reply_to: z.string().email().max(255).optional().or(z.literal('')),
  email_from: z.string().email().max(255).optional().or(z.literal('')),
  email_provider: z.enum(['resend', 'smtp']).optional(),
  smtp_note: z.string().max(1000).optional().or(z.literal('')),
  smtp_host: z.string().max(255).optional().or(z.literal('')),
  smtp_port: z.number().int().min(1).max(65535).optional(),
  smtp_username: z.string().max(255).optional().or(z.literal('')),
  smtp_password: z.string().max(255).optional().or(z.literal('')),
  smtp_secure: z.boolean().optional(),
  site_name: z.string().max(200).optional(),
  company_name: z.string().max(200).optional().or(z.literal('')),
  phone: z.string().max(30).optional(),
  whatsapp_number: z.string().max(30).optional().or(z.literal('')),
  contact_email: z.string().email().max(255).optional().or(z.literal('')),
  city: z.string().max(100).optional(),
  region: z.string().max(100).optional().or(z.literal('')),
  country: z.string().length(2).optional(),
  currency: z.string().length(3).optional(),
  address: z.string().max(500).optional().or(z.literal('')),
  hero_title: z.string().max(200).optional(),
  hero_description: z.string().max(1000).optional(),
  hero_image_url: z.string().url().max(500).optional().or(z.literal('')),
  experience_tagline: z.string().max(200).optional().or(z.literal('')),
  service_tagline: z.string().max(200).optional(),
  response_time: z.string().max(100).optional(),
  years_experience: z.string().max(50).optional().or(z.literal('')),
  specializations: z.array(z.string().max(100)).optional(),
  service_radius: z.string().max(50).optional(),
  business_type: z.string().max(100).optional(),
  business_hours: z.string().max(2000).optional().or(z.literal('')),
  document_footer: z.string().max(2000).optional().or(z.literal('')),
  terms_conditions: z.string().max(10000).optional().or(z.literal('')),
  home_page_content: z.any().optional(),
  nav_links: z.array(z.any()).optional(),
  social_links: z.array(z.any()).optional(),
  footer_show_social: z.boolean().optional(),
  footer_show_email: z.boolean().optional(),
  footer_show_company_reg: z.boolean().optional(),
  bank_name: z.string().max(200).optional().or(z.literal('')),
  account_holder: z.string().max(200).optional().or(z.literal('')),
  account_number: z.string().max(100).optional().or(z.literal('')),
  branch_code: z.string().max(50).optional().or(z.literal('')),
  vat_number: z.string().max(100).optional().or(z.literal('')),
  registration_number: z.string().max(100).optional().or(z.literal('')),
  hourly_rate: z.number().min(0).optional(),
  callout_fee: z.number().min(0).optional(),
  diagnostic_fee: z.number().min(0).optional(),
  default_deposit_percent: z.number().min(0).max(100).optional(),
}).strict()

async function requireSuperAdmin() {
  const sessionClient = await createSupabaseServerClient()
  const { data: { session } } = await sessionClient.auth.getSession()
  if (!session || getRoleFromJWT(session) !== 'super_admin') {
    return { authorized: false as const, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), userId: null as string | null }
  }
  return { authorized: true as const, error: null, userId: session.user.id }
}

export async function GET(request: NextRequest) {
  try {
    const { authorized, error, userId } = await requireSuperAdmin()
    if (!authorized) return error!

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const rateLimitKey = userId ?? ip

    const { allowed, remaining } = checkRateLimit(`super-admin:workshop-settings:${rateLimitKey}`, {
      maxRequests: 10,
      windowMs: 60_000,
    })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    const workshopIdRaw = request.nextUrl.searchParams.get('workshopId')
    const parsed = z.string().uuid('Workshop ID must be a valid UUID').safeParse(workshopIdRaw)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const workshopId = parsed.data

    const adminClient = createSuperAdminClient()

    const { data: settings, error: fetchError } = await adminClient
      .from('business_settings')
      .select('*')
      .eq('workshop_id', workshopId)
      .maybeSingle()

    if (fetchError) {
      console.error('Fetch workshop settings error:', fetchError)
      return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (err) {
    console.error('Workshop settings error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, error, userId } = await requireSuperAdmin()
    if (!authorized) return error!

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const rateLimitKey = userId ?? ip

    const { allowed, remaining } = checkRateLimit(`super-admin:workshop-settings:${rateLimitKey}`, {
      maxRequests: 10,
      windowMs: 60_000,
    })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    const body = await request.json()
    const parsed = WorkshopSettingsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { workshopId, ...fields } = parsed.data

    const payload: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) continue
      if (typeof value === 'string') {
        if (key.endsWith('_phone') || key.startsWith('phone') || key === 'whatsapp_number') {
          payload[key] = sanitizePhone(value) || null
        } else if (key.endsWith('_email') || key.startsWith('email')) {
          payload[key] = sanitizeEmail(value) || null
        } else {
          payload[key] = sanitizeText(value)
        }
      } else {
        payload[key] = value
      }
    }

    const adminClient = createSuperAdminClient()
    const { error: upsertError } = await adminClient
      .from('business_settings')
      .upsert({
        ...payload,
        workshop_id: workshopId,
        updated_at: new Date().toISOString(),
      })

    if (upsertError) {
      console.error('Save workshop settings error:', upsertError)
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Workshop settings POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
