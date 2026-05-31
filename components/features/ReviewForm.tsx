'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function ReviewForm() {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: wire to Supabase insert
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="card text-center py-10">
        <p className="text-2xl mb-3">✅</p>
        <h3 className="text-lg font-semibold text-black mb-1">
          Thank you for your review!
        </h3>
        <p className="text-small text-grey">
          Your feedback helps other customers and keeps us improving.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-5">

      {/* Full Name */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-grey">
          Full Name
        </label>
        <input
          type="text"
          placeholder="John Doe"
          required
          className="w-full border border-grey-medium rounded-base px-4 py-2.5 text-sm text-grey focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Vehicle Serviced */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-grey">
          Vehicle Serviced
        </label>
        <input
          type="text"
          placeholder="e.g. BMW M4 2021"
          required
          className="w-full border border-grey-medium rounded-base px-4 py-2.5 text-sm text-grey focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Star Rating */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-grey">
          Rate Our Service
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="text-3xl leading-none transition-colors focus:outline-none"
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <span
                className={
                  star <= (hovered || rating)
                    ? 'text-yellow-400'
                    : 'text-grey-medium'
                }
              >
                ★
              </span>
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-xs text-grey">
            {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rating]}
          </p>
        )}
      </div>

      {/* Review Text */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-grey">
          Your Review
        </label>
        <textarea
          placeholder="Tell us about your experience..."
          required
          rows={4}
          className="w-full border border-grey-medium rounded-base px-4 py-2.5 text-sm text-grey focus:outline-none focus:border-primary transition-colors resize-none"
        />
      </div>

      <Button type="submit" variant="primary">
        Submit Review
      </Button>

    </form>
  )
}