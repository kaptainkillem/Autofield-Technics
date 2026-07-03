import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { QuotesInbox } from '@/components/admin/QuotesInbox'
import { Database } from '@/types/database'
import { PageWrapper } from '@/components/layout/PageWrapper'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ filter?: string }>
}

export default async function AdminQuotesPage({ searchParams }: PageProps) {
  const { filter: initialFilter } = await searchParams
  const supabase = createSupabaseAdminClient()
  const { data } = await supabase
    .from('quotes')
    .select('*')
    .neq('status', 'pending')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  const quotes = (data ?? []) as Database['public']['Tables']['quotes']['Row'][]

  const declinedCount = quotes.filter((q) => q.status === 'declined').length

  return (
    <PageWrapper>
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-grey-light pb-3">
          <div>
            <h1 className="text-2xl font-bold text-grey-dark">Quotes</h1>
            <p className="text-sm text-grey">
              All quotes — drafts, sent estimates, accepted jobs, and declined requests.
              {declinedCount > 0 && (
                <span className="ml-1 text-red-600 font-semibold">{declinedCount} declined.</span>
              )}
            </p>
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
        <QuotesInbox quotes={quotes} initialFilter={initialFilter} />
      </div>
    </PageWrapper>
  )
}
