import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { Database } from '@/types/database'
import { LeadsTable } from '@/components/admin/LeadsTable'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { SITE_CONFIG } from '@/lib/site-config'

type Lead = Database['public']['Tables']['leads']['Row']

export const dynamic = 'force-dynamic'

export default async function AdminLeadsPage() {
  const supabase = createSupabaseAdminClient()

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  const items = (leads ?? []) as Lead[]

  return (
    <PageWrapper>
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
      <div className="mb-6 border-b border-grey-light pb-3">
        <h1 className="text-2xl font-bold text-grey-dark">{SITE_CONFIG.dashboard.pageTitles.leads}</h1>
          <p className="text-sm text-grey">Review raw client vehicle problems before generating an official estimation sheet.</p>
        </div>
        <LeadsTable leads={items} />
      </div>
    </PageWrapper>
  )
}