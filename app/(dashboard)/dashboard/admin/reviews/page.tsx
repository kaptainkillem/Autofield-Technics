'use client'

import { useEffect, useState } from 'react'
import { Star, ArrowLeft, CheckCircle, XCircle, Trash2, Loader2, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { SITE_CONFIG } from '@/lib/site-config'

type Review = {
  id: string
  rating: number
  comment: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  profiles: {
    full_name: string | null
    phone: string | null
  } | null
}

export default function AdminReviewsPage() {
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [actioningId, setActioningId] = useState<string | null>(null)

  async function fetchAllReviews() {
    try {
      const res = await fetch('/api/admin/reviews')
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to load reviews')
        setReviews([])
      } else {
        setReviews(data.reviews || [])
      }
    } catch {
      toast.error('Network error loading reviews')
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllReviews()
  }, [])

  async function updateReviewStatus(id: string, nextStatus: 'approved' | 'rejected') {
    setActioningId(id)
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to update review status')
      } else {
        setReviews(prev =>
          prev.map(r => (r.id === id ? { ...r, status: nextStatus } : r))
        )
        toast.success(`Review ${nextStatus === 'approved' ? 'approved' : 'rejected'}`)
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setActioningId(null)
    }
  }

  async function handleDeleteReview(id: string) {
    if (!confirm('Are you sure you want to remove this review from the workspace?')) return

    setActioningId(id)
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to delete review')
      } else {
        setReviews(prev => prev.filter(r => r.id !== id))
        toast.success('Review deleted')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setActioningId(null)
    }
  }

  const filteredReviews = reviews.filter(r => {
    if (filterStatus === 'all') return true
    return r.status === filterStatus
  })

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <Star className="h-8 w-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <PageWrapper className="max-w-[1400px] gap-6">
      {/* Header Block */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin" className="p-2 bg-white rounded-base border border-grey-medium/10 text-grey hover:text-primary transition-all shadow-sm">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-grey-dark tracking-tight">{SITE_CONFIG.dashboard.pageTitles.reviews}</h1>
          <p className="text-xs text-grey">Review and moderate customer testimonials before they go live.</p>
        </div>
      </div>

      {/* Filter Status Tabs */}
      <div className="flex gap-2 border-b border-grey-light pb-px overflow-x-auto whitespace-nowrap">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => {
          const count = reviews.filter(r => status === 'all' || r.status === status).length
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                filterStatus === status
                  ? 'border-primary text-primary font-black'
                  : 'border-transparent text-grey hover:text-grey-dark'
              }`}
            >
              <span>{status}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                filterStatus === status ? 'bg-primary/10 text-primary' : 'bg-grey-light text-grey'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {filteredReviews.length === 0 ? (
          <div className="col-span-full bg-white border border-grey-medium/10 rounded-base p-12 text-center text-grey text-sm shadow-sm flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-white text-grey rounded-full border border-grey-medium/10">
              <MessageSquare className="h-8 w-8 opacity-60" />
            </div>
            <div className="flex flex-col gap-1 max-w-xs">
              <p className="font-bold text-grey-dark text-base">No Reviews Found</p>
              <p className="text-xs text-grey leading-normal">
                There are currently no customer testimonials matching the &quot;{filterStatus}&quot; filter.
              </p>
            </div>
            <Link href="/reviews" className="no-underline mt-2">
              <Button size="sm" className="bg-primary text-white font-bold px-4 py-2 rounded-base shadow-sm hover:bg-primary-dark transition-colors flex items-center gap-1.5">
                <Star size={14} className="fill-white" />
                <span>View Live Reviews</span>
              </Button>
            </Link>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white border rounded-base p-5 shadow-sm flex flex-col justify-between gap-4 transition-all ${
                review.status === 'pending' ? 'border-primary/20 bg-primary/[0.01]' : 'border-grey-medium/10'
              }`}
            >
              <div className="flex flex-col gap-2">
                {/* Review Meta Header */}
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-grey-dark text-sm">
                      {review.profiles?.full_name || 'Anonymous Client'}
                    </span>
                    <span className="text-[11px] text-grey font-mono">
                      {review.profiles?.phone || 'No phone synced'}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    review.status === 'pending' ? 'bg-[#FF9800]/10 text-[#FF9800]' :
                    review.status === 'approved' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                  }`}>
                    {review.status}
                  </span>
                </div>

                {/* Star Rating */}
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      className={star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-grey-light'}
                    />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-xs text-grey-dark leading-relaxed italic bg-white p-3 rounded-base border border-grey-medium/10 mt-1">
                  &ldquo;{review.comment}&rdquo;
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between border-t border-grey-light pt-3 mt-1">
                <span className="text-[10px] font-semibold text-grey">
                  {new Date(review.created_at).toLocaleDateString('en-ZA', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </span>

                <div className="flex items-center gap-1.5">
                  {review.status !== 'approved' && (
                    <Button
                      size="sm"
                      onClick={() => updateReviewStatus(review.id, 'approved')}
                      disabled={actioningId === review.id}
                      className="bg-success text-white text-[11px] font-bold px-2.5 h-7 flex items-center gap-1 shadow-sm hover:bg-success/90"
                    >
                      <CheckCircle size={12} />
                      <span>Approve</span>
                    </Button>
                  )}

                  {review.status !== 'rejected' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateReviewStatus(review.id, 'rejected')}
                      disabled={actioningId === review.id}
                      className="border-error/30 text-error hover:bg-error/5 text-[11px] font-bold px-2.5 h-7 flex items-center gap-1"
                    >
                      <XCircle size={12} />
                      <span>Reject</span>
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteReview(review.id)}
                    disabled={actioningId === review.id}
                    className="text-grey hover:text-error p-1.5 h-7"
                    aria-label="Delete review"
                  >
                    {actioningId === review.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </PageWrapper>
  )
}
