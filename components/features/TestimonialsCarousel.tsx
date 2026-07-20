'use client'

import { ReviewCard } from '@/components/ReviewCard'
import type { Database } from '@/types/database'
import Link from 'next/link'
import { useSiteConfig } from '@/components/providers/SiteConfigProvider'

 type ReviewRow = Database['public']['Tables']['reviews']['Row']

interface TestimonialsCarouselProps {
  reviews: ReviewRow[]
}

export function TestimonialsCarousel({ reviews }: TestimonialsCarouselProps) {
  const config = useSiteConfig()
  if (reviews.length === 0) {
    return (
      <section className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-grey-dark mb-4">What Our Customers Say</h2>
          <p className="text-body max-w-2xl mx-auto mb-8">
            No reviews yet. Be the first to share your experience with us.
          </p>
          <Link href="/reviews" className="btn-primary inline-block">
            Leave a Review
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-grey-dark mb-4">What Our Customers Say</h2>
          <p className="text-body max-w-2xl mx-auto">
            Trusted by drivers across {config.city}. Here&apos;s what they have to say about our mobile mechanical services.
          </p>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid lg:grid-cols-3 lg:gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="snap-start shrink-0 w-[280px] sm:shrink-0 sm:w-auto"
            >
              <ReviewCard
                id={review.id}
                customerName={review.customer_name}
                rating={review.rating}
                reviewText={review.comment ?? ''}
                date={review.created_at ? new Date(review.created_at).toLocaleDateString() : '—'}
                vehicleServiced={undefined}
              />
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/reviews" className="btn-secondary inline-block">
            Read All Reviews
          </Link>
        </div>
      </div>
    </section>
  )
}

export default TestimonialsCarousel
