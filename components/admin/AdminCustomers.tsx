import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AdminCustomersProps {
  customers: Profile[]
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return 'Recently'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days < 7)  return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function AdminCustomers({ customers }: AdminCustomersProps) {
  if (customers.length === 0) {
    return (
      <div className="card text-center py-10">
        <p className="text-3xl mb-2">👥</p>
        <p className="text-sm text-grey">No customers yet.</p>
      </div>
    )
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="p-4 border-b border-grey-medium/30 flex items-center justify-between">
        <span className="text-sm font-semibold text-black">All customers</span>
        <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
          {customers.length} total
        </span>
      </div>

      <ul className="divide-y divide-grey-medium/20">
        {customers.map((c) => {
          const name     = c.full_name ?? 'Unknown'
          const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

          return (
            <li
              key={c.id}
              className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-grey-lightest transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-black">{name}</p>
                  <p className="text-xs text-grey">{c.phone ?? 'No phone'}</p>
                </div>
              </div>
              <p className="text-xs text-grey-medium flex-shrink-0">
                {timeAgo(c.created_at)}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}