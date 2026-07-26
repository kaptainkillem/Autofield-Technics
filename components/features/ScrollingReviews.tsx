import React from 'react'
import { supabase } from '@/lib/supabase'
import { ReviewCard } from '@/components/ReviewCard'
import { getMergedSiteConfig } from '@/lib/get-site-config'
import type { Database } from '@/types/database'

type ReviewRow = Database['public']['Tables']['reviews']['Row']

export async function ScrollingReviews() {
  const config = await getMergedSiteConfig()
  const { data } = await (supabase as any)
    .from('reviews')
    .select('*')
    .eq('workshop_id', config.workshopId)
    .eq('status', 'approved')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  const reviews = (data ?? []) as ReviewRow[]

  if (reviews.length === 0) {
    return null
  }

  return (
    <section className="bg-grey-lightest py-16 px-4">
      <div className="max-w-6xl mx-auto mb-8">
        <h2 className="text-2xl font-bold text-grey-dark text-center">What our customers say</h2>
      </div>
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
          {reviews.map((review) => (
            <div key={review.id} className="snap-start shrink-0 w-[300px]">
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
      </div>
    </section>
  )
}

export default ScrollingReviews
