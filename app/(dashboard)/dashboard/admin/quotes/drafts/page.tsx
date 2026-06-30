import Link from 'next/link'
import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function QuoteDraftsPage() {
  const supabase = createSupabaseAdminClient()
  const { data } = await supabase
    .from('quotes')
    .select('*')
    .eq('source', 'mechanic')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <PageWrapper>
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-grey-light pb-3">
          <div>
            <h1 className="text-2xl font-bold text-grey-dark">Quote Drafts</h1>
            <p className="text-sm text-grey">Mechanic-created quotes saved from the quote engine.</p>
          </div>
          <Link href="/dashboard/admin/quotes/create">
            <Button>Create Quote</Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-grey-medium/20 text-xs uppercase tracking-wider text-grey">
                <th className="py-3 pr-3">Quote</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 pl-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-light">
              {(data ?? []).map((quote) => (
                <tr key={quote.id}>
                  <td className="py-3 pr-3 font-semibold text-grey-dark">{quote.quote_number ?? quote.id.slice(0, 8)}</td>
                  <td className="py-3 px-3">{quote.customer_name}</td>
                  <td className="py-3 px-3 capitalize">{quote.status}</td>
                  <td className="py-3 pl-3 text-right font-semibold">R{Number(quote.total ?? quote.estimated_quote ?? 0).toFixed(2)}</td>
                </tr>
              ))}
              {(data ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-grey">No mechanic-created quotes yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  )
}

