import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const serverClient = await createSupabaseServerClient()
    const { data: { user } } = await serverClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await serverClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'mechanic'

    const adminClient = createSupabaseAdminClient()
    const { data: workOrder, error } = await adminClient
      .from('work_orders')
      .select('*, work_order_events(*), appointments(*), quotes(*)')
      .eq('id', id)
      .single()

    if (error || !workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    if (!isAdmin) {
      const quoteUserId = (workOrder as unknown as { quotes?: { user_id: string } }).quotes?.user_id
      if (quoteUserId !== user.id) {
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
