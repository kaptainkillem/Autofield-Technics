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
      <div className="card text-center py-10">
        <p className="text-3xl mb-2">🧾</p>
        <p className="text-sm text-grey">No invoices yet.</p>
      </div>
    )
  }

  const totalRevenue = receipts.reduce((sum, r) => sum + (r.amount_paid ?? 0), 0)

  return (
    <div className="card p-0 overflow-hidden">
      <div className="p-4 border-b border-grey-medium/30 flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm font-semibold text-black">All invoices</span>
        <span className="text-xs text-green-700 font-semibold">
          Total: R {totalRevenue.toLocaleString('en-ZA')}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-grey-lightest border-b border-grey-medium/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-grey uppercase tracking-wide">Invoice</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-grey uppercase tracking-wide hidden md:table-cell">Method</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-grey uppercase tracking-wide">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-grey uppercase tracking-wide hidden sm:table-cell">Date</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((inv) => (
              <tr
                key={inv.id}
                className="border-b border-grey-medium/20 hover:bg-grey-lightest transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="text-xs font-mono text-grey-medium">
                    {inv.invoice_number ?? inv.id.slice(0, 8).toUpperCase()}
                  </p>
                  {inv.notes && (
                    <p className="text-xs text-grey mt-0.5">{inv.notes}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-grey hidden md:table-cell capitalize">
                  {inv.payment_method ?? '—'}
                </td>
                <td className="px-4 py-3 font-semibold text-black">
                  R {inv.amount_paid.toLocaleString('en-ZA')}
                </td>
                <td className="px-4 py-3 text-grey hidden sm:table-cell">
                  {timeAgo(inv.job_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}