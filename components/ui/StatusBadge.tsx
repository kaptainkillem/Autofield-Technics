interface StatusBadgeProps {
  status: string
  className?: string
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-grey-lightest text-grey',
  pending: 'bg-yellow-100 text-yellow-800',
  proposed: 'bg-blue-100 text-blue-800',
  sent: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  confirmed: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
  approved: 'bg-green-100 text-green-800',
  // Workshop Engine statuses
  checked_in: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-blue-100 text-blue-800',
  awaiting_parts: 'bg-amber-100 text-amber-800',
  revision_pending: 'bg-orange-100 text-orange-800',
  ready_for_pickup: 'bg-teal-100 text-teal-800',
}

const STATUS_LABELS: Record<string, string> = {
  checked_in: 'Checked In',
  in_progress: 'In Progress',
  awaiting_parts: 'Awaiting Parts',
  revision_pending: 'Revision Pending',
  ready_for_pickup: 'Ready for Pickup',
}

function formatStatusLabel(status: string): string {
  if (STATUS_LABELS[status]) return STATUS_LABELS[status]
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status] ?? 'bg-grey-lightest text-grey'

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles} ${className}`}>
      {formatStatusLabel(status)}
    </span>
  )
}
