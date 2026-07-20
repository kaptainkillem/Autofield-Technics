export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ServicesHero } from '@/components/features/ServicesHero'
import { DynamicIcon } from '@/components/common/DynamicIcon'
import { EmptyState } from '@/components/ui/EmptyState'
import { MobileStickyCTA } from '@/components/ui/MobileStickyCTA'
import { getMergedSiteConfig } from '@/lib/get-site-config'
import { replaceVars } from '@/lib/site-config'
import { Wrench } from 'lucide-react'
import type { Database } from '@/types/database'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getMergedSiteConfig()
  return {
    title: `Our Services | ${config.name}`,
    description: `Explore professional mechanical services in ${config.city}. Mobile mechanic, workshop repairs, diagnostics, and more.`,
  }
}

type CategoryRow = Database['public']['Tables']['categories']['Row']

export default async function ServicesPage() {
  const config = await getMergedSiteConfig()
  const { data: dbCategories, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })

  // Production Error Handling: Log internally, show user a clean recovery UI
  if (error) {
    console.error('Failed to fetch categories:', error.message)
    return (
      <>
        <ServicesHero
          title={config.services.title}
          description={config.services.description}
          showQuoteButton={false}
        />
        <section className="bg-white px-4 py-16 md:px-20">
          <EmptyState
            icon={Wrench}
            title="System Maintenance Notice"
            description="We are currently updating our digital workshop catalog parameters. You can still book your service or request a custom validation link directly."
            actions={[{ label: 'Request Custom Quote', href: '/quote', variant: 'primary' }]}
          />
        </section>
      </>
    )
  }

  const items = (dbCategories ?? []) as CategoryRow[]

  return (
    <>
      <ServicesHero
        title={config.services.title}
        description={config.services.description}
        showQuoteButton
      />

      <div className="bg-grey-lightest border-t border-grey-medium/10 px-4 py-4 md:px-20">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb segments={[{ label: 'Home', href: '/' }, { label: 'Services' }]} />
        </div>
      </div>

      <section className="bg-white px-4 pt-6 pb-32 md:px-20">
        <div className="mx-auto max-w-6xl">
          {items.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="Custom Mechanical Bookings"
              description={replaceVars('Our dynamic response units handle everything from precision brake overhauls to deep computerized diagnostics directly at your location in {city}.', { city: config.city })}
              actions={[
                { label: 'Get a Custom Quote', href: '/quote', variant: 'primary' },
                { label: 'Return Home', href: '/', variant: 'secondary' },
              ]}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {items.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/services/${cat.slug}`}
                  className="bg-primary text-white rounded-base shadow-base p-6 flex flex-col items-center text-center gap-4 no-underline transition-all duration-200 hover:shadow-md hover:-translate-y-1"
                >
                  <div className="text-white">
                    <DynamicIcon name={cat.icon_name ?? 'Wrench'} size={40} />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{cat.name}</h3>
                  <p className="text-white/80 text-sm">
                    Premium mobile {cat.name.toLowerCase()} diagnostics, repairs, and scheduled servicing setups.
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <MobileStickyCTA
        title="Our Services"
        subtitle={`Professional mechanics in ${config.city}`}
        buttonText="Get a Free Quote"
        href="/quote"
      />
    </>
  )
}