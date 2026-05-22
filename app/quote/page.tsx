import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ServicesHero } from '@/components/features/ServicesHero'

export default function QuotePage() {
  return (
    <>
      <ServicesHero
        title="Get a Free Quote"
        description="Tell us about your vehicle and the service you need, and we will get back to you with a competitive quote."
      />

      <div className="bg-grey-lightest border-t border-grey-medium/30 px-4 pt-4 pb-5 md:px-20">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb
            segments={[
              { label: 'Home', href: '/' },
              { label: 'Get a Quote' },
            ]}
          />
        </div>
      </div>

      <section className="bg-white px-4 pt-6 pb-24 md:px-20 md:pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="card text-center py-16">
            <p className="text-lg text-grey mb-6">
              Quote form coming soon.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
