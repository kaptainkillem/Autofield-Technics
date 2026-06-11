import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ServicesHero } from '@/components/features/ServicesHero'
<<<<<<< Updated upstream
=======
import { ReviewForm } from '@/components/features/ReviewForm'
import { ReviewCard } from '@/components/ReviewCard'
import { createClient } from '@supabase/supabase-js'

// Server-side fetch — runs at request time, no mock data
async function getApprovedReviews() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('reviews')
    .select('id, customer_name, vehicle_serviced, rating, review_text, created_at')
    .eq('status', 'approved')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch reviews:', error)
      console.log('Error message:', error.message)
  console.log('Error details:', error.details)
  console.log('Error hint:', error.hint)
  console.log('Error code:', error.code)
    return []
  }

  return data ?? []
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 14) return '1 week ago'
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 60) return '1 month ago'
  return `${Math.floor(days / 30)} months ago`
}

export default async function ReviewsPage() {
  const reviews = await getApprovedReviews()
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
          <div className="card text-center py-16">
            <p className="text-lg text-grey mb-6">
              Reviews coming soon.
            </p>
=======
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* Left: Submit a review */}
            <div>
              <h2 className="text-2xl font-bold text-black mb-1">Share Your Experience</h2>
              <p className="text-small text-grey mb-6">
                Had your vehicle serviced with us? Let others know how it went.
              </p>
              <ReviewForm />
            </div>

            {/* Right: Live reviews from Supabase */}
            <div>
              <h2 className="text-2xl font-bold text-black mb-1">Recent Reviews</h2>
              <p className="text-small text-grey mb-6">
                What Joburg drivers are saying about Autofield Technics.
              </p>

              {reviews.length === 0 ? (
                <div className="card text-center py-10">
                  <p className="text-grey text-sm">
                    No reviews yet — be the first to leave one!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {reviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      id={review.id}
                      customerName={review.customer_name}
                      rating={review.rating}
                      reviewText={review.review_text}
                      vehicleServiced={review.vehicle_serviced}
                      date={timeAgo(review.created_at)}
                    />
                  ))}
                </div>
              )}
            </div>

>>>>>>> Stashed changes
          </div>
        </div>
      </section>
    </>
  )
}
