const INVOICES = [
  { id: 'INV-030', service: 'Oil service',   amount: 'R 650',   date: '3 weeks ago',  status: 'Paid' },
  { id: 'INV-021', service: 'Tyre rotation', amount: 'R 400',   date: '2 months ago', status: 'Paid' },
]

export function UserInvoices() {
  if (INVOICES.length === 0) {
    return (
      <div className="bg-white border border-grey-medium/10 rounded-base shadow-sm p-6 text-center py-10">
        <p className="text-3xl mb-3">🧾</p>
        <p className="text-sm text-grey">No invoices yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-grey-medium/10 rounded-base shadow-sm overflow-hidden">
      <ul className="divide-y divide-grey-medium/20">
        {INVOICES.map((inv) => (
          <li
            key={inv.id}
            className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-primary/5 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-grey-dark">{inv.service}</p>
              <p className="text-xs text-grey-medium">{inv.id} · {inv.date}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-grey-dark">{inv.amount}</p>
              <span className="text-xs font-semibold text-green-700">
                {inv.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}