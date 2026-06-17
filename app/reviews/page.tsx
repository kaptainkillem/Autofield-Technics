export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ServicesHero } from '@/components/features/ServicesHero'
import { ReviewForm } from '@/components/features/ReviewForm'
import { ReviewCard } from '@/components/ReviewCard'
import { SITE_CONFIG, replaceVars } from '@/lib/site-config'

export default async function ReviewsPage() {
  const { data: reviews } = await (supabase as any)
    .from('reviews')
    .select('*')
    .eq('status', 'approved')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <>
      <ServicesHero
        title="Customer Reviews"
        description="See what our customers say about our mechanical services."
      />

      <div className="bg-grey-lightest border-t border-grey-medium/30 px-4 pt-4 pb-5 md:px-20">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb
            segments={[
              { label: 'Home', href: '/' },
              { label: 'Reviews' },
            ]}
          />
        </div>
      </div>

      <section className="bg-white px-4 pt-6 pb-24 md:px-20 md:pb-20">
        <div className="mx-auto max-w-6xl">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            <div>
              <h2 className="text-2xl font-bold text-black mb-1">
                Share Your Experience
              </h2>
              <p className="text-small text-grey mb-6">
                Had your vehicle serviced with us? Let others know how it went.
              </p>
              <ReviewForm />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-black mb-1">
                Recent Reviews
              </h2>
              <p className="text-small text-grey mb-6">
                {replaceVars(SITE_CONFIG.reviews.subtitle, { city: SITE_CONFIG.city, name: SITE_CONFIG.name })}
              </p>
              <div className="flex flex-col gap-4">
                {reviews && reviews.length > 0 ? (
                  reviews.map((review: any) => (
                    <ReviewCard
                      key={review.id}
                      id={review.id}
                      customerName={review.customer_name}
                      rating={review.rating}
                      reviewText={review.review_text}
                      date={new Date(review.created_at).toLocaleDateString()}
                      vehicleServiced={review.vehicle_serviced}
                    />
                  ))
                ) : (
                  <p className="text-grey text-sm italic">No reviews yet. Be the first to share your experience!</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}