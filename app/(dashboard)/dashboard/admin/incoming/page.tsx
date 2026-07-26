import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { IncomingTable } from '@/components/admin/IncomingTable'
import { PageWrapper } from '@/components/layout/PageWrapper'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function IncomingPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const workshopId = (() => {
    try {
      const payload = JSON.parse(atob(session!.access_token.split('.')[1]))
      return payload?.app_metadata?.workshop_id as string
    } catch { return '' }
  })()
  const { data } = await supabase
    .from('quotes')
    .select('*')
    .eq('workshop_id', workshopId)
    .eq('status', 'pending')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <PageWrapper>
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-grey-light pb-3">
          <div>
            <h1 className="text-2xl font-bold text-grey-dark">Incoming Requests</h1>
            <p className="text-sm text-grey">New submissions from customers via the contact form and quote page. Accept to start building a quote.</p>
          </div>
          <Link
            href="/dashboard/admin/quotes?filter=declined"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-grey-dark bg-white border border-grey-medium/20 rounded-base hover:bg-grey-lightest transition-colors no-underline"
          >
            View declined requests
          </Link>
        </div>
        <IncomingTable requests={(data ?? []) as any} />
      </div>
    </PageWrapper>
  )
}
