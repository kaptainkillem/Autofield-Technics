import { NextRequest, NextResponse } from 'next/server'
import { createSuperAdminClient } from '@/lib/super-admin'
import { createSupabaseServerClient, getRoleFromJWT } from '@/lib/supabaseServer'
import { sanitizeText, sanitizePhone } from '@/lib/input-sanitizer'
import { checkRateLimit } from '@/lib/rate-limiter'

function getWorkshopIdFromJWT(session: { access_token?: string } | null): string | null {
  if (!session?.access_token) return null
  try {
    const payload = JSON.parse(atob(session.access_token.split('.')[1]))
    return payload?.app_metadata?.workshop_id ?? null
  } catch {
    return null
  }
}

const ALLOWED_FIELDS = [
  'company_name',
  'logo_url',
  'address',
  'vat_number',
  'registration_number',
  'bank_name',
  'account_holder',
  'account_number',
  'branch_code',
  'hourly_rate',
  'callout_fee',
  'diagnostic_fee',
  'default_deposit_percent',
  'terms_conditions',
  'document_footer',
] as const

export async function GET() {
  try {
    const sessionClient = await createSupabaseServerClient()
    const { data: { session } } = await sessionClient.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = getRoleFromJWT(session)
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const workshopId = getWorkshopIdFromJWT(session)
    if (!workshopId) {
      return NextResponse.json({ error: 'No workshop assigned' }, { status: 400 })
    }

    const adminClient = createSuperAdminClient()
    const { data: settings, error: fetchError } = await adminClient
      .from('business_settings')
      .select('company_name, logo_url, address, vat_number, registration_number, bank_name, account_holder, account_number, branch_code, hourly_rate, callout_fee, diagnostic_fee, default_deposit_percent, terms_conditions, document_footer')
      .eq('workshop_id', workshopId)
      .maybeSingle()

    if (fetchError) {
      console.error('Fetch admin settings error:', fetchError)
      return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (err) {
    console.error('Admin settings GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionClient = await createSupabaseServerClient()
    const { data: { session } } = await sessionClient.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = getRoleFromJWT(session)
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const workshopId = getWorkshopIdFromJWT(session)
    if (!workshopId) {
      return NextResponse.json({ error: 'No workshop assigned' }, { status: 400 })
    }

    const userId = session?.user?.id
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const rateLimitKey = userId ?? ip

    const { allowed, remaining } = checkRateLimit(`admin:settings:${rateLimitKey}`, {
      maxRequests: 20,
      windowMs: 60_000,
    })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    const body = await request.json()

    const payload: Record<string, unknown> = {}
    for (const key of ALLOWED_FIELDS) {
      if (key in body && body[key] !== undefined) {
        const value = body[key]
        if (typeof value === 'string') {
          if (key.endsWith('_phone') || key.startsWith('phone')) {
            payload[key] = sanitizePhone(value) || null
          } else {
            payload[key] = sanitizeText(value)
          }
        } else {
          payload[key] = value ?? null
        }
      }
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
    }

    const adminClient = createSuperAdminClient()
    const { error: upsertError } = await adminClient
      .from('business_settings')
      .upsert({
        ...payload,
        workshop_id: workshopId,
      })

    if (upsertError) {
      console.error('Save admin settings error:', upsertError)
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin settings POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
