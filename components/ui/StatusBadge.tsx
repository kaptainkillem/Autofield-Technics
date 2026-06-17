interface StatusBadgeProps {
  status: string
  className?: string
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
  approved: 'bg-green-100 text-green-800',
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status] ?? 'bg-grey-lightest text-grey'

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${styles} ${className}`}>
      {status}
    </span>
  )
}