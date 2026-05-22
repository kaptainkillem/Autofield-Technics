import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { categories } from '@/lib/data/categories'
import { ServiceCard } from '@/components/features/ServiceCard'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ServicesHero } from '@/components/features/ServicesHero'
import { StickyServiceSidebar } from '@/components/features/StickyServiceSidebar'
import type { Database } from '@/types/database'

type ServicesRow = Database['public']['Tables']['services']['Row']

interface PageProps {
  params: Promise<{ category: string }>
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params

  const matchedCategory = categories.find(
    (c) => c.id.toLowerCase() === category.toLowerCase()
  )

  if (!matchedCategory) {
    notFound()
  }

  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('category', matchedCategory.id)
    .eq('is_active', true)
    .order('name')

  const items = (data ?? []) as ServicesRow[]

  return (
    <>
      <ServicesHero
        title={matchedCategory.title}
        description={matchedCategory.description}
        showQuoteButton
      />

      <div className="bg-grey-lightest border-t border-grey-medium/10 px-4 py-4 md:px-20">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb
            segments={[
              { label: 'Home', href: '/' },
              { label: 'Services', href: '/services' },
              { label: matchedCategory.title },
            ]}
          />
        </div>
      </div>

      <section className="bg-white px-4 pt-8 pb-24 md:px-20">
        <div className="mx-auto max-w-6xl">
          {items.length === 0 ? (
            <div className="card text-center py-16">
              <p className="text-lg text-grey mb-6">
                No active services found in this category right now.
              </p>
              <Link href="/services" className="btn-primary inline-block">
                Browse all categories
              </Link>
            </div>
          ) : (
            // Layout mapping with strict data columns handled safely
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </div>
      </section>

      <StickyServiceSidebar categoryName={matchedCategory.title} />
    </>
  )
}