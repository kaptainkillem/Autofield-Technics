'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type ReviewRow = Database['public']['Tables']['reviews']['Row']
type ReviewInsert = {
  [K in keyof ReviewRow]?: ReviewRow[K]
} & { customer_name: string; rating: number; comment: string; user_id: string }

function getErrorMessage(code: string | undefined, message: string | undefined): string {
  if (code === 'PGRST204') {
    return 'A database column is missing. Please contact support.'
  }
  if (code === '23505') {
    return 'This review already exists.'
  }
  if (code === '42501') {
    return 'You do not have permission to submit a review.'
  }
  if (code === '23502') {
    return 'You must be signed in to submit a review.'
  }
  if (message?.includes('column') && message.includes('does not exist')) {
    return 'Database schema mismatch. Please contact support.'
  }
  return message || 'Something went wrong. Please try again.'
}

export function ReviewForm() {
  const [user, setUser] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    customerName: '',
    vehicleServiced: '',
    reviewText: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
      setCheckingAuth(false)
    })
  }, [])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!user) {
      setError('Please sign in to submit your review.')
      return
    }

    if (rating === 0) {
      setError('Please select a star rating.')
      return
    }

    const trimmedComment = form.reviewText.trim()
    if (trimmedComment.length < 5) {
      setError('Please write a bit more about your experience (at least 5 characters).')
      return
    }

    if (trimmedComment.length > 2000) {
      setError('Your review is a bit long. Please keep it under 2000 characters.')
      return
    }

    setLoading(true)

    const payload: ReviewInsert = {
      user_id: user.id,
      customer_name: form.customerName.trim(),
      customer_email: null,
      rating,
      comment: trimmedComment,
      status: 'pending',
    }

    try {
      const { error: supabaseError } = await (supabase as any)
        .from('reviews')
        .insert([payload])

      if (supabaseError) {
        console.error('[ReviewForm] Supabase error:', JSON.stringify(supabaseError, null, 2))
        const msg = getErrorMessage(supabaseError?.code, supabaseError?.message)
        setError(msg)
        setLoading(false)
        return
      }

      setSubmitted(true)
    } catch (err) {
      console.error('[ReviewForm] Unexpected error:', err)
      setError('An unexpected error occurred. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white border border-green-200 rounded-base shadow-sm p-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-grey-dark mb-1">
          Thank you for your review!
        </h3>
        <p className="text-small text-grey">
          Your review has been submitted and will appear once approved by our team.
        </p>
      </div>
    )
  }

  if (checkingAuth) {
    return (
      <div className="bg-white border border-grey-medium/10 rounded-base shadow-sm p-6 flex flex-col gap-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-grey-light rounded w-3/4" />
          <div className="h-4 bg-grey-light rounded w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-grey-medium/10 rounded-base shadow-sm p-6 flex flex-col gap-5">
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
          className="form-input"
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
          className="form-input"
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
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-full transition-colors"
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <Star
                size={32}
                className={star <= (hovered || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-grey-medium'}
              />
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
          className="form-textarea"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 font-medium">{error}</p>
      )}

      {!user && (
        <p className="text-sm text-grey text-center">
          Please <Link href="/signin?redirect=/reviews" className="text-primary underline underline-offset-2 hover:text-primary-dark">sign in</Link> to submit your review.
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={loading || !user}
        className={!user ? 'opacity-60 cursor-not-allowed' : ''}
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  )
}
