import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ServicesHero } from '@/components/features/ServicesHero'
import { ReviewForm } from '@/components/features/ReviewForm'
import { ReviewCard } from '@/components/ReviewCard'

const mockReviews = [
  {
    id: '1',
    customerName: 'Michael Smith',
    rating: 5,
    reviewText:
      'Amazing service. The team fixed my brake issue quickly and kept me updated throughout the process.',
    date: '2 days ago',
  },
  {
    id: '2',
    customerName: 'Sarah Johnson',
    rating: 4,
    reviewText:
      'Very professional workshop. Pricing was fair and the staff were friendly.',
    date: '1 week ago',
  },
]

export default function ReviewsPage() {
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

          {/* Two-column layout on desktop: form left, reviews right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* Left: Submit a review */}
            <div>
              <h2 className="text-2xl font-bold text-black mb-1">
                Share Your Experience
              </h2>
              <p className="text-small text-grey mb-6">
                Had your vehicle serviced with us? Let others know how it went.
              </p>
              <ReviewForm />
            </div>

            {/* Right: Existing reviews */}
            <div>
              <h2 className="text-2xl font-bold text-black mb-1">
                Recent Reviews
              </h2>
              <p className="text-small text-grey mb-6">
                What Joburg drivers are saying about Autofield Technics.
              </p>
              <div className="flex flex-col gap-4">
                {mockReviews.map((review) => (
                  <ReviewCard key={review.id} {...review} />
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}