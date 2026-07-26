import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, getRoleFromJWT } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const serverClient = await createSupabaseServerClient()
    const { data: { session } } = await serverClient.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = getRoleFromJWT(session)
    const isAdmin = role === 'admin' || role === 'super_admin'
    const workshopId = (() => {
      try {
        const payload = JSON.parse(atob(session.access_token.split('.')[1]))
        return payload?.app_metadata?.workshop_id as string | null
      } catch { return null }
    })()

    const adminClient = await createSupabaseServerClient()
    let query = adminClient
      .from('work_orders')
      .select('*, work_order_events(*), appointments(*), quotes(*)')
      .eq('id', id)

    if (isAdmin && workshopId) {
      query = query.eq('workshop_id', workshopId)
    }

    const { data: workOrder, error } = await query.single()

    if (error || !workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    if (!isAdmin) {
      const quoteUserId = (workOrder as unknown as { quotes?: { user_id: string } }).quotes?.user_id
      if (quoteUserId !== session.user?.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json({ workOrder })
  } catch (err: unknown) {
    console.error('Get work order API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to fetch work order', message }, { status: 500 })
  }
}
