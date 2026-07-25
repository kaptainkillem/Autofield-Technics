import { NextRequest, NextResponse } from 'next/server'
import { createSuperAdminClient } from '@/lib/super-admin'
import { createSupabaseServerClient, getRoleFromJWT } from '@/lib/supabaseServer'
import { sanitizeText, sanitizePhone, sanitizeEmail } from '@/lib/input-sanitizer'

async function requireSuperAdmin() {
  const sessionClient = await createSupabaseServerClient()
  const { data: { session } } = await sessionClient.auth.getSession()
  if (!session || getRoleFromJWT(session) !== 'super_admin') {
    return { authorized: false, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { authorized: true, error: null }
}

export async function GET(request: NextRequest) {
  try {
    const { authorized, error } = await requireSuperAdmin()
    if (!authorized) return error!

    const workshopId = request.nextUrl.searchParams.get('workshopId')
    if (!workshopId) {
      return NextResponse.json({ error: 'workshopId is required' }, { status: 400 })
    }

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
    const { authorized, error } = await requireSuperAdmin()
    if (!authorized) return error!

    const body = await request.json()
    const workshopId = body.workshopId as string | undefined

    if (!workshopId) {
      return NextResponse.json({ error: 'workshopId is required' }, { status: 400 })
    }

    const { workshopId: _w, ...fields } = body as Record<string, unknown>

    const payload: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === 'string') {
        if (key.endsWith('_phone') || key.startsWith('phone') || key === 'whatsapp_number') {
          payload[key] = sanitizePhone(value) || null
        } else if (key.endsWith('_email') || key.startsWith('email')) {
          payload[key] = sanitizeEmail(value) || null
        } else {
          payload[key] = sanitizeText(value)
        }
      } else {
        payload[key] = value ?? null
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
