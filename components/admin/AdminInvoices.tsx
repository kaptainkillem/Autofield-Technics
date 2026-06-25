import { Database } from '@/types/database'

type Receipt = Database['public']['Tables']['receipts']['Row']

interface AdminInvoicesProps {
  receipts: Receipt[]
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days} days ago`
  if (days < 14) return '1 week ago'
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

export function AdminInvoices({ receipts }: AdminInvoicesProps) {
  if (receipts.length === 0) {
    return (
      <div className="text-center py-10 text-grey bg-white border border-grey-medium/10 rounded-base">
        <p className="text-3xl mb-2">🧾</p>
        <p className="text-sm text-grey">No invoices yet.</p>
      </div>
    )
  }

  const totalRevenue = receipts.reduce((sum, r) => sum + (r.amount_paid ?? 0), 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-grey-medium/10 rounded-base overflow-hidden">
        <div className="p-4 border-b border-grey-medium/20 flex items-center justify-between flex-wrap gap-2 bg-white">
          <span className="text-sm font-semibold text-grey-dark">All invoices</span>
          <span className="text-xs text-green-700 font-semibold">
            Total: R {totalRevenue.toLocaleString('en-ZA')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-white border-b border-grey-medium/20 text-grey uppercase tracking-wider text-xs">
                <th className="py-3 px-4 font-bold">Invoice</th>
                <th className="py-3 px-4 font-bold hidden md:table-cell">Method</th>
                <th className="py-3 px-4 font-bold">Amount</th>
                <th className="py-3 px-4 font-bold hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-light">
              {receipts.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-primary/5 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-xs font-mono text-grey-medium">
                      {inv.id.slice(0, 8).toUpperCase()}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-grey hidden md:table-cell capitalize">
                    {inv.payment_method ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-grey-dark">
                    R {inv.amount_paid.toLocaleString('en-ZA')}
                  </td>
                  <td className="px-4 py-3 text-grey hidden sm:table-cell">
                    {timeAgo(inv.issued_at ?? '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
