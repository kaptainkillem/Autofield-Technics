'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type ReviewInsert = Database['public']['Tables']['reviews']['Insert']

export function ReviewForm() {
  const [rating, setRating]       = useState(0)
  const [hovered, setHovered]     = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const [form, setForm] = useState({
    customerName:    '',
    vehicleServiced: '',
    reviewText:      '',
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (rating === 0) {
      setError('Please select a star rating.')
      return
    }

    setLoading(true)

    // Typed insert — matches database.ts exactly
    const payload: ReviewInsert = {
      customer_name:    form.customerName,
      vehicle_serviced: form.vehicleServiced || null,
      rating,
      review_text:      form.reviewText,
      status:           'pending',
    }

    const { error: supabaseError } = await supabase
      .from('reviews')
      .insert(payload)

    setLoading(false)

    if (supabaseError) {
      console.error(supabaseError)
      setError('Something went wrong. Please try again.')
      return
    }

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
          Your review has been submitted and will appear once approved by our team.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-5">

      {/* Full Name */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-grey">Full Name</label>
        <input
          name="customerName"
          type="text"
          placeholder="John Doe"
          required
          value={form.customerName}
          onChange={handleChange}
          className="w-full border border-grey-medium rounded-base px-4 py-2.5 text-sm text-grey focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Vehicle Serviced */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-grey">Vehicle Serviced</label>
        <input
          name="vehicleServiced"
          type="text"
          placeholder="e.g. BMW M4 2021"
          value={form.vehicleServiced}
          onChange={handleChange}
          className="w-full border border-grey-medium rounded-base px-4 py-2.5 text-sm text-grey focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Star Rating */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-grey">Rate Our Service</label>
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
              <span className={star <= (hovered || rating) ? 'text-yellow-400' : 'text-grey-medium'}>
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
        <label className="text-sm font-semibold text-grey">Your Review</label>
        <textarea
          name="reviewText"
          placeholder="Tell us about your experience..."
          required
          rows={4}
          value={form.reviewText}
          onChange={handleChange}
          className="w-full border border-grey-medium rounded-base px-4 py-2.5 text-sm text-grey focus:outline-none focus:border-primary transition-colors resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 font-medium">{error}</p>
      )}

      <Button type="submit" variant="primary" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Review'}
      </Button>

    </form>
  )
}