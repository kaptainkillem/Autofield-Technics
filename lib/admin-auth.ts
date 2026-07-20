import { createSupabaseServerClient, getRoleFromJWT } from '@/lib/supabaseServer'

const STAFF_ROLES = new Set(['admin', 'super_admin'])

export async function verifyStaffUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { authorized: false as const, error: 'Unauthorized', status: 401 }
  }

  // Validate session is still active with the Auth server (catches revoked/deleted users)
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { authorized: false as const, error: 'Session expired or invalid', status: 401 }
  }

  const role = getRoleFromJWT(session)
  const workshopId: string | null = (() => {
    try {
      const payload = JSON.parse(atob(session.access_token.split('.')[1]))
      return payload?.app_metadata?.workshop_id ?? null
    } catch {
      return null
    }
  })()

  if (!role || !STAFF_ROLES.has(role)) {
    return { authorized: false as const, error: 'Forbidden', status: 403 }
  }

  return {
    authorized: true as const,
    userId: session.user?.id ?? '',
    role,
    workshopId,
  }
}
