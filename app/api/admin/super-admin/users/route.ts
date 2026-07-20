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

    const { searchParams } = request.nextUrl
    const search = searchParams.get('search')?.trim() || ''
    const role = searchParams.get('role') || ''
    const workshopId = searchParams.get('workshopId') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))

    const adminClient = createSuperAdminClient()

    let query = adminClient.from('profiles').select('*', { count: 'exact' })

    if (search) query = query.ilike('full_name', `%${search}%`)
    if (role) query = query.eq('role', role)
    if (workshopId) query = query.eq('workshop_id', workshopId)

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: profiles, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Fetch users error:', error)
      return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
    }

    const users = profiles && profiles.length > 0
      ? await (async () => {
          const authResults = await Promise.allSettled(
            profiles.map((p) => adminClient.auth.admin.getUserById(p.id))
          )

          const workshopIds = [...new Set(profiles.map((p) => p.workshop_id).filter(Boolean) as string[])]
          const { data: workshops } = workshopIds.length > 0
            ? await adminClient.from('workshops').select('id, name').in('id', workshopIds)
            : { data: [] }
          const workshopMap = new Map((workshops ?? []).map((w) => [w.id, w.name]))

          return profiles.map((p, i) => {
            const authResult = authResults[i]
            const email = authResult.status === 'fulfilled'
              ? authResult.value.data?.user?.email ?? null
              : null

            return {
              id: p.id,
              fullName: p.full_name ?? '',
              email,
              role: p.role ?? 'client',
              workshopId: p.workshop_id ?? null,
              workshopName: workshopMap.get(p.workshop_id ?? '') ?? null,
              phone: p.phone ?? null,
              createdAt: p.created_at,
            }
          })
        })()
      : []

    return NextResponse.json({ users, total: count ?? 0, page, limit })
  } catch (error) {
    console.error('Super-admin users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
