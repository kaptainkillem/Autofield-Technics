interface ReviewCardProps {
  id: string
  customerName: string
  rating: number
  reviewText: string
  date: string
  vehicleServiced?: string
}

export function ReviewCard({
  customerName,
  rating,
  reviewText,
  date,
  vehicleServiced,
}: ReviewCardProps) {
  const initials = customerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="card flex flex-col gap-3">

      {/* Header: avatar + name + stars */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-black leading-tight">
              {customerName}
            </p>
            {vehicleServiced && (
              <p className="text-xs text-grey">{vehicleServiced}</p>
            )}
          </div>
        </div>

        {/* Star display */}
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`text-lg leading-none ${
                star <= rating ? 'text-yellow-400' : 'text-grey-medium'
              }`}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      {/* Review text */}
      <p className="text-body text-sm">{reviewText}</p>

      {/* Date */}
      <p className="text-xs text-grey-medium">{date}</p>

    </div>
  )
}