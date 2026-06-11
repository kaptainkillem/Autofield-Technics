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
  const stats = [
    {
      label:    'Total Quotes',
      value:    totalQuotes.toString(),
      note:     'All time',
      icon:     '📋',
      positive: true,
    },
    {
      label:    'Pending Quotes',
      value:    pendingQuotes.toString(),
      note:     pendingQuotes > 0 ? 'Need attention' : 'All clear',
      icon:     '⏳',
      positive: pendingQuotes === 0,
    },
    {
      label:    'Completed Jobs',
      value:    completedQuotes.toString(),
      note:     'All time',
      icon:     '✅',
      positive: true,
    },
    {
      label:    'Revenue (month)',
      value:    `R ${monthlyRevenue.toLocaleString('en-ZA')}`,
      note:     'Current month',
      icon:     '💰',
      positive: true,
    },
    {
      label:    'Reviews Pending',
      value:    pendingReviews.toString(),
      note:     pendingReviews > 0 ? 'Awaiting approval' : 'None pending',
      icon:     '⭐',
      positive: pendingReviews === 0,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map(({ label, value, note, icon, positive }) => (
        <div key={label} className="card flex flex-col gap-2">
          <span className="text-2xl">{icon}</span>
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