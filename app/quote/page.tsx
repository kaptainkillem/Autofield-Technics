export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ServicesHero } from '@/components/features/ServicesHero'
import { QuoteForm } from '@/components/QuoteForm'
import { HelpCircle, CheckCircle, Smartphone } from 'lucide-react'
import { getMergedSiteConfig } from '@/lib/get-site-config'
import { replaceVars } from '@/lib/site-config'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getMergedSiteConfig()
  return {
    title: `Get a Free Quote | ${config.name}`,
    description: `Request a free repair quote from ${config.name}. Mobile mechanic services in ${config.city}. Fast response via WhatsApp.`,
  }
}

export default async function QuotePage() {
  const config = await getMergedSiteConfig()
  let defaultWorkshopId: string | undefined

  const slug = process.env.NEXT_PUBLIC_DEFAULT_WORKSHOP_SLUG
  if (slug) {
    try {
      const supabase = await createSupabaseServerClient()
      const { data: workshop } = await supabase
        .from('workshops')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()
      defaultWorkshopId = workshop?.id
    } catch {}
  }

  return (
    <>
      <ServicesHero
        title={config.quotes.heroTitle}
        description={config.quotes.heroDescription}
      />

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

      <section className="bg-white px-4 pt-12 pb-24 md:px-20 md:pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

            <div className="lg:col-span-5 flex flex-col gap-8">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-grey-dark mb-2">
                  {config.quotes.howItWorksTitle}
                </h2>
                <p className="text-sm text-grey leading-relaxed">
                  {replaceVars(config.quotes.howItWorksDescription, { responseTimeLabel: replaceVars(config.quotes.responseTimeLabel, { responseTime: config.responseTime }) })}
                </p>
              </div>

              <div className="flex flex-col gap-5">
                {[
                  {
                    icon: <HelpCircle size={16} className="text-white" />,
                    ...config.quotes.steps[0],
                  },
                  {
                    icon: <CheckCircle size={16} className="text-white" />,
                    ...config.quotes.steps[1],
                  },
                  {
                    icon: <Smartphone size={16} className="text-white" />,
                    ...config.quotes.steps[2],
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

              <div className="bg-grey-lightest border border-grey-medium/10 rounded-base p-5 shadow-sm flex flex-col gap-1">
                <p className="text-sm font-bold text-grey-dark flex items-center gap-1.5">
                  <span>📍</span> {replaceVars(config.quotes.locationLabel, { city: config.city })}
                </p>
                <p className="text-xs text-grey leading-relaxed">
                  {replaceVars(config.quotes.serviceAreaLabel, { city: config.city })}
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white border border-grey-medium/10 rounded-base p-6 md:p-8 shadow-sm">
              <QuoteForm workshopId={defaultWorkshopId} />
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
