import { NextRequest, NextResponse } from 'next/server'
import { createSuperAdminClient } from '@/lib/super-admin'
import { createSupabaseServerClient, getRoleFromJWT } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const sessionClient = await createSupabaseServerClient()
    const { data: { session } } = await sessionClient.auth.getSession()

    if (!session || getRoleFromJWT(session) !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const workshopId = request.nextUrl.searchParams.get('workshopId')
    if (!workshopId) {
      return NextResponse.json({ error: 'workshopId is required' }, { status: 400 })
    }

    const adminClient = createSuperAdminClient()

    const { data: settings, error } = await adminClient
      .from('business_settings')
      .select('*')
      .eq('workshop_id', workshopId)
      .maybeSingle()

    if (error) {
      console.error('Fetch workshop settings error:', error)
      return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Workshop settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
