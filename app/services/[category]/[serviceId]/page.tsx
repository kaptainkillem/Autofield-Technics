import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { categories } from '@/lib/data/categories'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ServicesHero } from '@/components/features/ServicesHero'
import { ShieldCheck, Clock, Award, CheckCircle2 } from 'lucide-react'
import type { Database } from '@/types/database'
import { SITE_CONFIG } from '@/lib/site-config'

type ServicesRow = Database['public']['Tables']['services']['Row']

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

  const categoryInfo = categories.find(
    (c) => c.id.toLowerCase() === service.category?.toLowerCase()
  )
  const categoryTitle = categoryInfo?.title ?? service.category ?? 'Services'

  // SEO: Dynamic JSON-LD Structured Data Schema Markup
  const jsonLdSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'name': service.name,
    'description': service.description,
    'provider': {
      '@type': 'LocalBusiness',
      'name': SITE_CONFIG.name,
      'telephone': '+27784802796',
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': 'Johannesburg',
        'addressRegion': 'Gauteng',
        'addressCountry': 'ZA'
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
      {/* Inject Structured Data into Head for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      <ServicesHero
        title={service.name}
        description={service.description ?? undefined}
        showQuoteButton={false}
      />

      {/* Breadcrumbs for Navigation & SEO Crawl Paths */}
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
      <section className="bg-white px-4 pt-8 pb-24 md:px-20">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Structural Breakdown Details */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="card flex flex-col gap-4">
              <h2 className="heading-2 text-primary">Service Overview</h2>
              <p className="text-body leading-relaxed">{service.description}</p>
              
              <h3 className="heading-3 pt-4">What's Included in This Package:</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <li className="flex items-start gap-2 text-body">
                  <CheckCircle2 className="text-primary shrink-0 mt-1" size={18} />
                  <span>Full transparent diagnostic check-sheet lookup</span>
                </li>
                <li className="flex items-start gap-2 text-body">
                  <CheckCircle2 className="text-primary shrink-0 mt-1" size={18} />
                  <span>OEM quality parts & fluid alternatives used</span>
                </li>
                <li className="flex items-start gap-2 text-body">
                  <CheckCircle2 className="text-primary shrink-0 mt-1" size={18} />
                  <span>Workmanship checked by 15-year specialist master technician</span>
                </li>
                <li className="flex items-start gap-2 text-body">
                  <CheckCircle2 className="text-primary shrink-0 mt-1" size={18} />
                  <span>Digital invoice tracking system receipt</span>
                </li>
              </ul>
            </div>

            {/* Local SEO FAQ Content Expansion Block */}
            <div className="card flex flex-col gap-4">
              <h2 className="heading-2 text-primary">Frequently Asked Questions</h2>
              <div className="border-b border-grey-light pb-3">
                <p className="font-bold text-grey-dark">How long does this repair work take?</p>
                <p className="text-body text-sm mt-1">Most general maintenance and minor repairs take between 1 to 3 hours depending on explicit component accessibility.</p>
              </div>
              <div className="border-b border-grey-light pb-3">
                <p className="font-bold text-grey-dark">Are you fully equipped as a mobile workshop?</p>
                <p className="text-body text-sm mt-1">Yes, our dynamic response units carry complete mobile scanning systems and mechanical tools straight to your location in Johannesburg.</p>
              </div>
            </div>
          </div>

          {/* High Conversion Booking Action Sidebar */}
          <div className="card lg:col-span-1 border border-primary/20 sticky top-24 flex flex-col gap-6 bg-grey-lightest">
            <div>
              <span className="text-xs text-grey uppercase font-semibold tracking-wider">{categoryTitle} Group</span>
              <h3 className="text-xl font-bold text-grey-dark mt-1">{service.name}</h3>
            </div>

            <div className="py-4 border-t border-b border-grey-light/60">
              <span className="text-sm text-grey block">Estimated Base Price From</span>
              <p className="text-4xl font-bold text-primary mt-1">
                {service.base_price != null ? formatPrice(service.base_price) : 'Contact Us'}
              </p>
              <span className="text-xs text-grey block mt-1">*Final price given upon explicit quote validation</span>
            </div>

            {/* Core Trust Indicators Stack */}
            <div className="flex flex-col gap-3 text-sm text-grey-dark">
              <div className="flex items-center gap-3">
                <Award className="text-primary" size={20} />
                <span>15+ Years Qualified Mechanical Record</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-primary" size={20} />
                <span>OEM-Level Suzuki & Hyundai Precision</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="text-primary" size={20} />
                <span>Rapid Joburg Roadside Dispatch Response</span>
              </div>
            </div>

            <Link
              href={`/quote?serviceId=${service.id}`}
              className="btn-primary w-full text-center py-3 text-base shadow-md hover:shadow-lg transition-all"
            >
              Request Booking Link
            </Link>
          </div>

        </div>
      </section>
    </>
  )
}