export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ServicesHero } from '@/components/features/ServicesHero'
import { MobileStickyCTA } from '@/components/ui/MobileStickyCTA'
import { ShieldCheck, Clock, Award, CheckCircle2 } from 'lucide-react'
import type { Database } from '@/types/database'
import { SITE_CONFIG } from '@/lib/site-config'

type ServicesRow = Database['public']['Tables']['services']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']

interface PageProps {
  params: Promise<{ category: string; serviceId: string }>
}

function formatPrice(price: number): string {
  return `R${price.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { category, serviceId } = await params

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .eq('is_active', true)
    .single()

  const service = data as ServicesRow | null

  if (!service || error) {
    notFound()
  }

  const { data: categoryInfo } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', category.toLowerCase())
    .single()

  const categoryTitle = (categoryInfo as CategoryRow | null)?.name ?? 'Services'

  const jsonLdSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'name': service.name,
    'description': service.description,
    'provider': {
      '@type': 'LocalBusiness',
      'name': SITE_CONFIG.name,
'telephone': SITE_CONFIG.phone,
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': SITE_CONFIG.city,
        'addressRegion': SITE_CONFIG.region,
        'addressCountry': SITE_CONFIG.country
      }
    },
    'offers': {
      '@type': 'Offer',
      'price': service.base_price ?? '0',
      'priceCurrency': 'ZAR',
      'availability': 'https://schema.org/InStock'
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      <ServicesHero
        title={service.name}
        description={service.description ?? undefined}
        ctaText="Book Now"
        ctaHref={`/quote?serviceId=${service.id}`}
      />

      <div className="bg-grey-lightest border-t border-grey-medium/10 px-4 py-4 md:px-20">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb
            segments={[
              { label: 'Home', href: '/' },
              { label: 'Services', href: '/services' },
              { label: categoryTitle, href: `/services/${category}` },
              { label: service.name },
            ]}
          />
        </div>
      </div>

      {/* Main Core Layout Grid */}
      <section className="bg-white px-4 pt-8 pb-32 md:px-20">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Structural Breakdown Details */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="card bg-grey-lightest border border-primary/20 p-6 rounded-base shadow-sm flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-primary">Service Overview</h2>
              <p className="text-grey-dark leading-relaxed">{service.description}</p>
              
              <h3 className="text-lg font-semibold text-primary pt-4">What's Included in This Package:</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <li className="flex items-start gap-2 text-grey-dark">
                  <CheckCircle2 className="text-primary shrink-0 mt-1" size={18} />
                  <span className="text-grey-dark">Full transparent diagnostic check-sheet lookup</span>
                </li>
                <li className="flex items-start gap-2 text-grey-dark">
                  <CheckCircle2 className="text-primary shrink-0 mt-1" size={18} />
                  <span className="text-grey-dark">OEM quality parts & fluid alternatives used</span>
                </li>
                <li className="flex items-start gap-2 text-grey-dark">
                  <CheckCircle2 className="text-primary shrink-0 mt-1" size={18} />
                  <span className="text-grey-dark">Workmanship checked by qualified mechanics</span>
                </li>
                <li className="flex items-start gap-2 text-grey-dark">
                  <CheckCircle2 className="text-primary shrink-0 mt-1" size={18} />
                  <span className="text-grey-dark">Digital invoice tracking system receipt</span>
                </li>
              </ul>
            </div>
          </div>

          {/* High Conversion Booking Action Sidebar Menu */}
          <div className="hidden lg:flex card lg:col-span-1 border border-primary/20 p-6 rounded-base sticky top-24 flex-col gap-6 bg-grey-lightest">
            <div>
              <span className="text-xs text-grey uppercase font-semibold tracking-wider">{categoryTitle} Group</span>
              <h3 className="text-xl font-bold text-primary mt-1">{service.name}</h3>
            </div>

            <div className="py-4 border-t border-b border-grey-light/60">
              <span className="text-sm text-grey block">Estimated Base Price From</span>
              <p className="text-4xl font-bold text-primary mt-1">
                {service.base_price != null ? formatPrice(Number(service.base_price)) : 'Contact Us'}
              </p>
              <span className="text-xs text-grey block mt-1">*Final price given upon explicit quote validation</span>
            </div>

            <div className="flex flex-col gap-3 text-sm text-grey-dark">
              <div className="flex items-center gap-3">
                <Award className="text-primary" size={20} />
                <span className="text-grey-dark">Qualified Specialized Mechanical Record</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-primary" size={20} />
                <span className="text-grey-dark">OEM-Level Precision and Performance Guarantee</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="text-primary" size={20} />
                <span className="text-grey-dark">Rapid Joburg Roadside Dispatch Response</span>
              </div>
            </div>

            <Link
              href={`/quote?serviceId=${service.id}`}
              className="btn-primary w-full text-center py-3 text-base font-semibold shadow-md hover:shadow-lg transition-all"
            >
              Request Booking Link
            </Link>
          </div>

        </div>
      </section>

      <MobileStickyCTA
        title={categoryTitle}
        subtitle={service.name}
        buttonText="Book Now"
        href={`/quote?serviceId=${service.id}`}
      />
    </>
  )
}