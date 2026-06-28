import Link from 'next/link'
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
    href: string
  }[] = [
    {
      label:    'Total Quotes',
      value:    totalQuotes.toString(),
      note:     'All time',
      icon:     ClipboardList,
      positive: true,
      href:     '/dashboard/admin/quotes',
    },
    {
      label:    'Pending Quotes',
      value:    pendingQuotes.toString(),
      note:     pendingQuotes > 0 ? 'Need attention' : 'All clear',
      icon:     Hourglass,
      positive: pendingQuotes === 0,
      href:     '/dashboard/admin/quotes?status=pending',
    },
    {
      label:    'Completed Jobs',
      value:    completedQuotes.toString(),
      note:     'All time',
      icon:     CheckCircle2,
      positive: true,
      href:     '/dashboard/admin/jobs',
    },
    {
      label:    'Revenue (month)',
      value:    `R ${monthlyRevenue.toLocaleString('en-ZA')}`,
      note:     'Current month',
      icon:     Banknote,
      positive: true,
      href:     '/dashboard/admin/finance',
    },
    {
      label:    'Reviews Pending',
      value:    pendingReviews.toString(),
      note:     pendingReviews > 0 ? 'Awaiting approval' : 'None pending',
      icon:     Star,
      positive: pendingReviews === 0,
      href:     '/dashboard/admin/reviews',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map(({ label, value, note, icon: Icon, positive, href }) => (
        <Link
          key={label}
          href={href}
          className="bg-white border border-grey-medium/10 rounded-base shadow-sm p-6 flex flex-col gap-2 hover:border-primary/30 hover:shadow-md transition-all no-underline group"
        >
          <Icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
          <p className="text-2xl font-bold text-grey-dark leading-none">{value}</p>
          <p className="text-sm text-grey">{label}</p>
          <p className={`text-xs font-medium ${positive ? 'text-green-600' : 'text-red-500'}`}>
            {note}
          </p>
        </Link>
      ))}
    </div>
  )
}