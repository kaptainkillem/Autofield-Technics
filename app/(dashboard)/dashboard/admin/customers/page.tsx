import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { AdminCustomers } from '@/components/admin/AdminCustomers'
import { Database } from '@/types/database'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { SITE_CONFIG } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

export default async function AdminCustomersPage() {
  const supabase = createSupabaseAdminClient()
  const { data } = await supabase.from('profiles').select('*').eq('role', 'client').order('created_at', { ascending: false })
  const customers = (data ?? []) as Database['public']['Tables']['profiles']['Row'][]

  return (
    <PageWrapper>
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
        <div className="mb-6 border-b border-grey-light pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-grey-dark">{SITE_CONFIG.dashboard.pageTitles.customers}</h1>
            <p className="text-sm text-grey">Registered workspace user indices, contact data tracking targets, and communication links logs.</p>
          </div>
        </div>
        <AdminCustomers customers={customers} />
      </div>
    </PageWrapper>
  )
}