import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { QuotesInbox } from '@/components/admin/QuotesInbox'
import { Database } from '@/types/database'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { SITE_CONFIG } from '@/lib/site-config'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function AdminQuotesPage() {
  const supabase = createSupabaseAdminClient()
  const { data } = await supabase.from('quotes').select('*').is('deleted_at', null).order('created_at', { ascending: false })
  const quotes = (data ?? []) as Database['public']['Tables']['quotes']['Row'][]

  return (
    <PageWrapper>
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-grey-light pb-3">
          <div>
            <h1 className="text-2xl font-bold text-grey-dark">{SITE_CONFIG.dashboard.pageTitles.quotes}</h1>
            <p className="text-sm text-grey">Manage, analyze, update processing parameters, and review system generated client interaction requests.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/admin/quotes/create">
              <Button>Create Quote</Button>
            </Link>
            <Link href="/dashboard/admin/quotes/drafts">
              <Button variant="outline">Quote Drafts</Button>
            </Link>
          </div>
        </div>
        <QuotesInbox quotes={quotes} />
      </div>
    </PageWrapper>
  )
}
