import Link from 'next/link'
import { SITE_CONFIG } from '@/lib/site-config'

export const metadata = {
  title: `Terms of Service | ${SITE_CONFIG.name}`,
}

export default function TermsPage() {
  return (
    <>
      <section className="bg-grey-light px-4 pt-16 md:px-20 md:pt-20">
        <div className="mx-auto max-w-4xl flex flex-col items-center text-center justify-center min-h-[200px]">
          <h1 className="heading-1 mb-4">Terms of Service</h1>
          <p className="text-white max-w-2xl mb-8">Please read these terms carefully before using our services.</p>
        </div>
      </section>

      <div className="bg-grey-lightest border-t border-grey-medium/10 px-4 py-4 md:px-20">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="text-primary no-underline hover:underline">Home</Link>
          <span className="mx-2 text-grey-medium">&gt;</span>
          <span className="text-grey">Terms of Service</span>
        </div>
      </div>

      <section className="bg-white px-4 pt-8 pb-24 md:px-20">
        <div className="mx-auto max-w-4xl flex flex-col gap-8">
          <div className="card bg-grey-lightest border border-primary/20 p-6 rounded-base flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-primary">1. Acceptance of Terms</h2>
            <p className="text-grey-dark leading-relaxed">By accessing or using the services provided by {SITE_CONFIG.name}, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
          </div>

          <div className="card bg-grey-lightest border border-primary/20 p-6 rounded-base flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-primary">2. Services</h2>
            <p className="text-grey-dark leading-relaxed">{SITE_CONFIG.name} provides mobile and workshop-based automotive mechanical repair, maintenance, and diagnostic services in {SITE_CONFIG.city}, {SITE_CONFIG.region}. All services are subject to availability and scheduling confirmation.</p>
          </div>

          <div className="card bg-grey-lightest border border-primary/20 p-6 rounded-base flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-primary">3. Pricing and Payment</h2>
            <p className="text-grey-dark leading-relaxed">Prices quoted are estimates based on the information provided. Final pricing may vary depending on the actual condition of the vehicle and parts required. Payment is due upon completion of service unless otherwise agreed in writing.</p>
          </div>

          <div className="card bg-grey-lightest border border-primary/20 p-6 rounded-base flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-primary">4. Warranties and Liability</h2>
            <p className="text-grey-dark leading-relaxed">{SITE_CONFIG.name} warrants that all workmanship will be performed to industry standards. Our liability is limited to the cost of the service performed. We are not liable for pre-existing conditions or damage caused by factors outside our control.</p>
          </div>

          <div className="card bg-grey-lightest border border-primary/20 p-6 rounded-base flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-primary">5. Cancellation Policy</h2>
            <p className="text-grey-dark leading-relaxed">Appointments may be cancelled or rescheduled with at least 24 hours notice. Late cancellations may incur a call-out fee.</p>
          </div>

          <div className="card bg-grey-lightest border border-primary/20 p-6 rounded-base flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-primary">6. Contact</h2>
            <p className="text-grey-dark leading-relaxed">For questions about these terms, contact us at <Link href="/quote" className="text-primary no-underline hover:underline">our quote page</Link> or call <a href={`tel:${SITE_CONFIG.phone}`} className="text-primary no-underline hover:underline">{SITE_CONFIG.phone}</a>.</p>
          </div>

          <p className="text-sm text-grey mt-4">Last updated: June 2026</p>
        </div>
      </section>
    </>
  )
}