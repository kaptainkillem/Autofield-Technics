export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ServicesHero } from '@/components/features/ServicesHero'
import { QuoteForm } from '@/components/QuoteForm'
import { HelpCircle, CheckCircle, Smartphone } from 'lucide-react'
import { SITE_CONFIG, replaceVars } from '@/lib/site-config'

export const metadata: Metadata = {
  title: `Get a Free Quote | ${SITE_CONFIG.name}`,
  description: `Request a free repair quote from ${SITE_CONFIG.name}. Mobile mechanic services in ${SITE_CONFIG.city}. Fast response via WhatsApp.`,
}

export default function QuotePage() {
  return (
    <>
      {/* Dynamic Services Hero Section */}
      <ServicesHero
        title={SITE_CONFIG.quotes.heroTitle}
        description={SITE_CONFIG.quotes.heroDescription}
      />

      {/* Breadcrumb Navigation Strip */}
      <div className="bg-grey-lightest border-t border-b border-grey-medium/10 px-4 py-4 md:px-20">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb
            segments={[
              { label: 'Home', href: '/' },
              { label: 'Get a Quote' },
            ]}
          />
        </div>
      </div>

      {/* Main Form Interaction Section */}
      <section className="bg-white px-4 pt-12 pb-24 md:px-20 md:pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

            {/* Left: 5-Column Context & Trust Signals Column */}
            <div className="lg:col-span-5 flex flex-col gap-8">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-grey-dark mb-2">
                  {SITE_CONFIG.quotes.howItWorksTitle}
                </h2>
                <p className="text-sm text-grey leading-relaxed">
                  {replaceVars(SITE_CONFIG.quotes.howItWorksDescription, { responseTimeLabel: replaceVars(SITE_CONFIG.quotes.responseTimeLabel, { responseTime: SITE_CONFIG.responseTime }) })}
                </p>
              </div>

              {/* 📋 Enhanced Step Process Pipeline */}
              <div className="flex flex-col gap-5">
                {[
                  {
                    icon: <HelpCircle size={16} className="text-white" />,
                    ...SITE_CONFIG.quotes.steps[0],
                  },
                  {
                    icon: <CheckCircle size={16} className="text-white" />,
                    ...SITE_CONFIG.quotes.steps[1],
                  },
                  {
                    icon: <Smartphone size={16} className="text-white" />,
                    ...SITE_CONFIG.quotes.steps[2],
                  },
                ].map(({ icon, title, description }, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      {icon}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-bold text-grey-dark">{title}</p>
                      <p className="text-xs text-grey leading-relaxed">{description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Location Badge Component */}
              <div className="bg-grey-lightest border border-grey-medium/10 rounded-base p-5 shadow-sm flex flex-col gap-1">
                <p className="text-sm font-bold text-grey-dark flex items-center gap-1.5">
                  <span>📍</span> {replaceVars(SITE_CONFIG.quotes.locationLabel, { city: SITE_CONFIG.city })}
                </p>
                <p className="text-xs text-grey leading-relaxed">
                  {replaceVars(SITE_CONFIG.quotes.serviceAreaLabel, { city: SITE_CONFIG.city })}
                </p>
              </div>
            </div>

            {/* Right: 7-Column Form Container Workspace */}
            <div className="lg:col-span-7 bg-white border border-grey-medium/10 rounded-base p-6 md:p-8 shadow-sm">
              <QuoteForm />
            </div>

          </div>
        </div>
      </section>
    </>
  )
}