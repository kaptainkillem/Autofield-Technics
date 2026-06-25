import { StatusBadge } from '@/components/ui/StatusBadge'

type Status = 'Pending' | 'Active' | 'Completed' | 'Cancelled'

const STATUS_DESCRIPTIONS: Record<Status, string> = {
  Pending:   'Awaiting review by our team',
  Active:    'Job in progress',
  Completed: 'Job complete',
  Cancelled: 'Cancelled',
}

const MOCK_QUOTES = [
  {
    id: 'Q-047',
    service: 'Brake service',
    vehicle: 'VW Polo 2021',
    date: '2 days ago',
    amount: 'R 1 800',
    status: 'Pending' as Status,
  },
  {
    id: 'Q-038',
    service: 'Oil service',
    vehicle: 'VW Polo 2021',
    date: '3 weeks ago',
    amount: 'R 650',
    status: 'Completed' as Status,
  },
  {
    id: 'Q-029',
    service: 'Tyre rotation',
    vehicle: 'VW Polo 2021',
    date: '2 months ago',
    amount: 'R 400',
    status: 'Completed' as Status,
  },
]

const WA_NUMBER = '27000000000' // TODO: replace with real number

export function UserQuotes() {
  return (
    <div className="flex flex-col gap-4">
      {MOCK_QUOTES.map((q) => (
        <div key={q.id} className="bg-white border border-grey-medium/10 rounded-base shadow-sm p-6 flex flex-col gap-3">

          {/* Top row: service + status */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-grey-dark">{q.service}</p>
              <p className="text-sm text-grey">{q.vehicle}</p>
            </div>
            <StatusBadge status={q.status.toLowerCase()} />
          </div>

          {/* Status description */}
          <p className="text-xs text-grey-medium">{STATUS_DESCRIPTIONS[q.status]}</p>

          {/* Bottom row: amount + date + action */}
          <div className="flex items-center justify-between pt-2 border-t border-grey-medium/20">
            <div>
              <p className="text-base font-bold text-grey-dark">{q.amount}</p>
              <p className="text-xs text-grey-medium">{q.date} · #{q.id}</p>
            </div>
            {q.status === 'Pending' || q.status === 'Active' ? (
              <a
                href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Hi, following up on my quote #${q.id} for ${q.service}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-primary hover:underline"
              >
                💬 Follow up
              </a>
            ) : (
              <a
                href="/reviews"
                className="text-xs font-semibold text-grey hover:text-primary hover:underline"
              >
                ⭐ Leave a review
              </a>
            )}
          </div>

        </div>
      ))}
    </div>
  )
}