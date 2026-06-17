import { Star } from 'lucide-react'

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

  const AVATAR_COLORS = [
    'bg-primary',
    'bg-green-600',
    'bg-orange-500',
    'bg-purple-600',
    'bg-teal-500',
    'bg-rose-500',
    'bg-indigo-500',
    'bg-amber-600',
  ]

  const colorIndex = customerName
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length

  const avatarColor = AVATAR_COLORS[colorIndex]

  return (
    <div className="card flex flex-col gap-3">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
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

        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={18}
              className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-grey-medium'}
            />
          ))}
        </div>
      </div>

      <p className="text-body text-sm">{reviewText}</p>

      <p className="text-xs text-grey">{date}</p>

    </div>
  )
}