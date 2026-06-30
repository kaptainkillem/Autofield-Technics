import { createSupabaseServerClient } from '@/lib/supabaseServer'

const STAFF_ROLES = new Set(['admin', 'mechanic'])

export async function verifyStaffUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { authorized: false as const, error: 'Unauthorized', status: 401 }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  if (!profile || !STAFF_ROLES.has(profile.role)) {
    return { authorized: false as const, error: 'Forbidden', status: 403 }
  }

  return { authorized: true as const, userId: user.id, role: profile.role }
}

