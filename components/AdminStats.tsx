import { ClipboardList, Hourglass, CheckCircle2, Banknote, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface AdminStatsProps {
  totalQuotes:     number
  pendingQuotes:   number
  completedQuotes: number
  monthlyRevenue:  number
  pendingReviews:  number
}

export function AdminStats({
  totalQuotes,
  pendingQuotes,
  completedQuotes,
  monthlyRevenue,
  pendingReviews,
}: AdminStatsProps) {
  const stats: {
    label: string
    value: string
    note: string
    icon: LucideIcon
    positive: boolean
  }[] = [
    {
      label:    'Total Quotes',
      value:    totalQuotes.toString(),
      note:     'All time',
      icon:     ClipboardList,
      positive: true,
    },
    {
      label:    'Pending Quotes',
      value:    pendingQuotes.toString(),
      note:     pendingQuotes > 0 ? 'Need attention' : 'All clear',
      icon:     Hourglass,
      positive: pendingQuotes === 0,
    },
    {
      label:    'Completed Jobs',
      value:    completedQuotes.toString(),
      note:     'All time',
      icon:     CheckCircle2,
      positive: true,
    },
    {
      label:    'Revenue (month)',
      value:    `R ${monthlyRevenue.toLocaleString('en-ZA')}`,
      note:     'Current month',
      icon:     Banknote,
      positive: true,
    },
    {
      label:    'Reviews Pending',
      value:    pendingReviews.toString(),
      note:     pendingReviews > 0 ? 'Awaiting approval' : 'None pending',
      icon:     Star,
      positive: pendingReviews === 0,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map(({ label, value, note, icon: Icon, positive }) => (
        <div key={label} className="card flex flex-col gap-2">
          <Icon className="h-6 w-6 text-primary" />
          <p className="text-2xl font-bold text-black leading-none">{value}</p>
          <p className="text-sm text-grey">{label}</p>
          <p className={`text-xs font-medium ${positive ? 'text-green-600' : 'text-red-500'}`}>
            {note}
          </p>
        </div>
      ))}
    </div>
  )
}