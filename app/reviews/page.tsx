export const dynamic = 'force-dynamic'

import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ServicesHero } from '@/components/features/ServicesHero'

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
          <div className="card text-center py-16">
            <p className="text-lg text-grey mb-6">
              Reviews coming soon.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
