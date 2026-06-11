import Link from 'next/link'
import { SITE_CONFIG } from '@/lib/site-config'

export const metadata = {
  title: `Privacy Policy | ${SITE_CONFIG.name}`,
}

export default function PrivacyPage() {
  return (
    <>
      <section className="bg-grey-light px-4 pt-16 md:px-20 md:pt-20">
        <div className="mx-auto max-w-4xl flex flex-col items-center text-center justify-center min-h-[200px]">
          <h1 className="heading-1 mb-4">Privacy Policy</h1>
          <p className="text-white max-w-2xl mb-8">How we collect, use, and protect your personal information.</p>
        </div>
      </section>

      <div className="bg-grey-lightest border-t border-grey-medium/10 px-4 py-4 md:px-20">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="text-primary no-underline hover:underline">Home</Link>
          <span className="mx-2 text-grey-medium">&gt;</span>
          <span className="text-grey">Privacy Policy</span>
        </div>
      </div>

      <section className="bg-white px-4 pt-8 pb-24 md:px-20">
        <div className="mx-auto max-w-4xl flex flex-col gap-8">
          <div className="card bg-grey-lightest border border-primary/20 p-6 rounded-base flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-primary">1. Information We Collect</h2>
            <p className="text-grey-dark leading-relaxed">We collect information you provide directly, such as your name, email address, phone number, vehicle details, and service requests. We also collect usage data through cookies and analytics to improve our services.</p>
          </div>

          <div className="card bg-grey-lightest border border-primary/20 p-6 rounded-base flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-primary">2. How We Use Your Information</h2>
            <p className="text-grey-dark leading-relaxed">We use your information to provide and improve our mechanical services, process quotes and bookings, communicate about appointments, and send service reminders. We do not sell your personal information to third parties.</p>
          </div>

          <div className="card bg-grey-lightest border border-primary/20 p-6 rounded-base flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-primary">3. Data Security</h2>
            <p className="text-grey-dark leading-relaxed">We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction. All data is processed within South Africa in compliance with POPIA.</p>
          </div>

          <div className="card bg-grey-lightest border border-primary/20 p-6 rounded-base flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-primary">4. Your Rights</h2>
            <p className="text-grey-dark leading-relaxed">Under the Protection of Personal Information Act (POPIA), you have the right to access, correct, or delete your personal information. You may also object to the processing of your data or withdraw consent at any time.</p>
          </div>

          <div className="card bg-grey-lightest border border-primary/20 p-6 rounded-base flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-primary">5. Cookies</h2>
            <p className="text-grey-dark leading-relaxed">Our website uses cookies to enhance your browsing experience and analyse site traffic. You can manage cookie preferences through your browser settings.</p>
          </div>

          <div className="card bg-grey-lightest border border-primary/20 p-6 rounded-base flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-primary">6. Contact</h2>
            <p className="text-grey-dark leading-relaxed">For privacy-related enquiries, contact us at <a href={`tel:${SITE_CONFIG.phone}`} className="text-primary no-underline hover:underline">{SITE_CONFIG.phone}</a> or visit our <Link href="/quote" className="text-primary no-underline hover:underline">quote page</Link>.</p>
          </div>

          <p className="text-sm text-grey mt-4">Last updated: June 2026</p>
        </div>
      </section>
    </>
  )
}