import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function InvoicesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const workshopId = (() => {
    try {
      const payload = JSON.parse(atob(session!.access_token.split('.')[1]))
      return payload?.app_metadata?.workshop_id as string
    } catch { return '' }
  })()
  const { data } = await supabase
    .from('invoices')
    .select('*')
    .eq('workshop_id', workshopId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <PageWrapper>
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-grey-light pb-3">
          <div>
            <h1 className="text-2xl font-bold text-grey-dark">Invoices</h1>
            <p className="text-sm text-grey">Create invoices manually or pull accepted quote details into an editable invoice.</p>
          </div>
          <Link href="/dashboard/admin/invoices/create">
            <Button>Create Invoice</Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-grey-medium/20 text-xs uppercase tracking-wider text-grey">
                <th className="py-3 pr-3">Invoice</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 pl-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-light">
              {(data ?? []).map((invoice) => (
                <tr key={invoice.id}>
                  <td className="py-3 pr-3 font-semibold text-grey-dark">{invoice.invoice_number ?? invoice.id.slice(0, 8)}</td>
                  <td className="py-3 px-3">{invoice.customer_name}</td>
                  <td className="py-3 px-3 capitalize">{invoice.status}</td>
                  <td className="py-3 pl-3 text-right font-semibold">R{Number(invoice.total ?? 0).toFixed(2)}</td>
                </tr>
              ))}
              {(data ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-grey">No invoices created yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  )
}

