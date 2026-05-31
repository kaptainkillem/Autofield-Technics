import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ServicesHero } from '@/components/features/ServicesHero'
import { QuoteForm } from '@/components/QuoteForm'

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

            {/* Left: context / trust signals */}
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-bold text-black mb-2">
                  How it works
                </h2>
                <p className="text-small text-grey">
                  Fill in your vehicle details and describe the issue. We will
                  review your request and send a quote directly to your
                  WhatsApp within 30 minutes.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {[
                  {
                    step: '1',
                    title: 'Fill in your details',
                    desc: 'Tell us your car make, model, year and the service you need.',
                  },
                  {
                    step: '2',
                    title: 'We review your request',
                    desc: 'Our mechanics assess the job and prepare an accurate quote.',
                  },
                  {
                    step: '3',
                    title: 'Receive your quote on WhatsApp',
                    desc: 'We send you a detailed quote. Accept and book your slot.',
                  },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-black">{title}</p>
                      <p className="text-small text-grey mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card bg-grey-lightest border border-grey-medium/30">
                <p className="text-sm font-semibold text-black mb-1">
                  📍 Based in Johannesburg
                </p>
                <p className="text-small text-grey">
                  We serve the greater Joburg area. Roadside assistance and
                  workshop repairs available.
                </p>
              </div>
            </div>

            {/* Right: the form */}
            <div>
              <QuoteForm />
            </div>

          </div>
        </div>
      </section>
    </>
  )
}