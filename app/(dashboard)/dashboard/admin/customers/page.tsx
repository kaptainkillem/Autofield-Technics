import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { AdminCustomers } from '@/components/admin/AdminCustomers'
import { Database } from '@/types/database'
import { PageWrapper } from '@/components/layout/PageWrapper'

export const dynamic = 'force-dynamic'

export default async function AdminCustomersPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  const workshopId = session ? (() => {
    try {
      const payload = JSON.parse(atob(session.access_token.split('.')[1]))
      return payload?.app_metadata?.workshop_id as string | null
    } catch { return null }
  })() : null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'client')
    .eq('workshop_id', workshopId as string)
    .order('created_at', { ascending: false })
  const customers = (data ?? []) as Database['public']['Tables']['profiles']['Row'][]

  return (
    <PageWrapper>
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
        <div className="mb-6 border-b border-grey-light pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-grey-dark">Customer Base Profiles Directory</h1>
            <p className="text-sm text-grey">Registered workspace user indices, contact data tracking targets, and communication links logs.</p>
          </div>
        </div>
        <AdminCustomers customers={customers} />
      </div>
    </PageWrapper>
  )
}