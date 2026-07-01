import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { IncomingTable } from '@/components/admin/IncomingTable'
import { PageWrapper } from '@/components/layout/PageWrapper'

export const dynamic = 'force-dynamic'

export default async function IncomingPage() {
  const supabase = createSupabaseAdminClient()
  const { data } = await supabase
    .from('quotes')
    .select('*')
    .eq('status', 'pending')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <PageWrapper>
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
        <div className="mb-6 border-b border-grey-light pb-3">
          <h1 className="text-2xl font-bold text-grey-dark">Incoming Requests</h1>
          <p className="text-sm text-grey">New submissions from customers via the contact form and quote page. Accept to start building a quote.</p>
        </div>
        <IncomingTable requests={(data ?? []) as any} />
      </div>
    </PageWrapper>
  )
}
