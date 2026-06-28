export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-grey-light rounded-base ${className ?? ''}`}
    />
  )
}
