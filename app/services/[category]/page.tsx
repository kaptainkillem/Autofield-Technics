export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ServiceCard } from '@/components/features/ServiceCard'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ServicesHero } from '@/components/features/ServicesHero'
import { MobileStickyCTA } from '@/components/ui/MobileStickyCTA'
import { EmptyState } from '@/components/ui/EmptyState'
import { SITE_CONFIG } from '@/lib/site-config'
import { Wrench } from 'lucide-react'
import type { Database } from '@/types/database'

type ServicesRow = Database['public']['Tables']['services']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']

interface PageProps {
  params: Promise<{ category: string }>
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params

  const { data: matchedCategoryRaw } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', category.toLowerCase())
    .single()

  const matchedCategory = matchedCategoryRaw as CategoryRow | null

  if (!matchedCategory) {
    notFound()
  }

  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('category_id', matchedCategory.id)
    .eq('is_active', true)
    .order('name')

  const items = (data ?? []) as ServicesRow[]
  const categoryDesc = `Professional on-site ${matchedCategory.name.toLowerCase()} options executed by master mechanics in ${SITE_CONFIG.city}.`

  return (
    <>
      <ServicesHero
        title={matchedCategory.name}
        description={categoryDesc}
        showQuoteButton
      />

      <div className="bg-grey-lightest border-t border-grey-medium/10 px-4 py-4 md:px-20">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb
            segments={[
              { label: 'Home', href: '/' },
              { label: 'Services', href: '/services' },
              { label: matchedCategory.name },
            ]}
          />
        </div>
      </div>

      <section className="bg-white px-4 pt-8 pb-32 md:px-20">
        <div className="mx-auto max-w-6xl">
          {items.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No Services Available"
              description={`No active services are currently listed under this category. Browse all categories or request a custom quote.`}
              actions={[{ label: 'Browse all categories', href: '/services', variant: 'primary' }]}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </div>
      </section>

      <MobileStickyCTA
        title={matchedCategory.name}
        subtitle="Verified & Trusted"
        buttonText="Get a Free Quote"
        href="/quote"
      />
    </>
  )
}