export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { QuoteForm } from '@/components/QuoteForm'
import { ReviewCard } from '@/components/ReviewCard'
import { ServicesHero } from '@/components/features/ServicesHero'
import { Button } from '@/components/ui/button'
import { CheckCircle, MapPin, PhoneCall, ArrowRight } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/site-config'

interface LocationPageProps {
  params: Promise<{ province: string; city: string; suburb: string }>
}

export async function generateMetadata({ params }: LocationPageProps) {
  const { province, city, suburb } = await params
  const targetPath = `/${province}/${city}/${suburb}`.toLowerCase().trim()

  const { data: seoRecord } = await (supabase as any)
    .from('seo_registry')
    .select('meta_title, meta_description, meta_keywords')
    .eq('path_url', targetPath)
    .eq('is_active', true)
    .maybeSingle()

  return seoRecord ? {
    title: seoRecord.meta_title,
    description: seoRecord.meta_description,
    keywords: seoRecord.meta_keywords,
  } : {}
}

export default async function DynamicLocationPage({ params }: LocationPageProps) {
  const { province, city, suburb } = await params
  const targetPath = `/${province}/${city}/${suburb}`.toLowerCase().trim()

  const [seoResult, reviewsResult] = await Promise.all([
    (supabase as any).from('seo_registry').select('*').eq('path_url', targetPath).eq('is_active', true).maybeSingle(),
    (supabase as any).from('reviews').select('*').eq('status', 'approved').is('deleted_at', null).order('created_at', { ascending: false }).limit(5),
  ])

  if (seoResult.error || !seoResult.data) notFound()

  const pageData = seoResult.data
  const reviews = reviewsResult.data

  const formatTextCase = (str: string) => str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const displayProvince = formatTextCase(province)
  const displayCity = formatTextCase(city)
  const displaySuburb = formatTextCase(suburb)

  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(`Mobile Mechanic in ${displaySuburb}, ${displayCity}, South Africa`)}&t=&z=14&ie=UTF8&iwloc=&output=embed`

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <ServicesHero
        title={pageData.h1_heading || `Need a Certified Mobile Mechanic in ${displaySuburb}?`}
        description={`Professional, trusted mechanical repairs delivered directly to your driveway in ${displaySuburb}, ${displayCity}.`}
      />

      {/* Main Content Flow */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb segments={[
            { label: 'Home', href: '/' },
            { label: displayProvince, href: `/locations?province=${province}` },
            { label: displayCity },
            { label: displaySuburb },
          ]} />
        </div>

        {/* Unified Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT: Main Content & Forms */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20 text-xs font-bold uppercase tracking-wider w-fit">
              <MapPin size={12} className="fill-primary" />
              <span>Driveway Servicing Area</span>
            </div>

            <p className="text-sm md:text-base text-grey leading-relaxed">
              Don&apos;t waste your Saturday morning towing your vehicle to a stationary workshop branch or waiting in crowded customer lounges. Our qualified, fully equipped mechanics operate directly across <span className="text-grey-dark font-extrabold">{displaySuburb}</span> and the greater <span className="text-grey-dark font-semibold">{displayCity}</span> zone.
            </p>

            {/* Step Guidelines */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-b border-grey-light py-5">
              {[
                { count: '01', title: 'Get Quote', desc: 'Specify service items' },
                { count: '02', title: 'We Come To You', desc: 'Home or workplace driveway' },
                { count: '03', title: 'Job Sorted', desc: 'Premium diagnostic vetting' },
              ].map((step) => (
                <div key={step.count} className="flex flex-col gap-1">
                  <span className="text-xs font-mono font-black text-primary/40 block">{step.count}</span>
                  <strong className="text-xs font-bold text-grey-dark uppercase tracking-wide">{step.title}</strong>
                  <span className="text-[11px] text-grey leading-normal">{step.desc}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/quote" className="no-underline flex-1 sm:flex-initial">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-white font-black text-sm px-8 py-4 rounded-base shadow-md hover:bg-primary-dark transition-all flex items-center justify-center gap-2 group h-12">
                  <span>Calculate Repair Estimate</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href={`tel:${SITE_CONFIG.phone}`} className="no-underline flex-1 sm:flex-initial">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-grey-medium hover:border-primary text-grey-dark hover:text-primary font-bold text-sm px-6 h-12 rounded-base bg-white transition-all flex items-center justify-center gap-2">
                  <PhoneCall size={14} />
                  <span>Call Booking Desk</span>
                </Button>
              </a>
            </div>

            {/* Authority Section */}
            <div className="p-8 bg-grey-lightest rounded-base border border-grey-medium/10 shadow-sm">
              <h3 className="font-bold text-lg text-grey-dark mb-4">Why residents in {displaySuburb} choose us</h3>
              <ul className="space-y-4">
                {[
                  `Fully equipped mobile workshops covering all ${displayCity} suburbs.`,
                  'Certified mechanics with 12-month component warranties.',
                  'Upfront itemized quotes — approve before any work begins.',
                  `Trusted by 500+ residents across ${displayProvince}.`,
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-grey text-sm">
                    <CheckCircle className="text-success shrink-0" size={20} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-grey-dark">Schedule Your Service</h2>
            <QuoteForm />
          </div>

          {/* RIGHT: Map & Reviews */}
          <div className="lg:col-span-5 flex flex-col gap-10">
            <div className="bg-grey-lightest border border-grey-medium/10 p-4 rounded-base shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase font-black text-grey tracking-wider">Active Coverage Area Map</span>
              </div>
              <iframe
  width="100%"
  height="100%"
  style={{ border: 0 }}
  loading="lazy"
  referrerPolicy="no-referrer-when-downgrade"
  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3581.428457002012!2d28.0566!3d-26.1072!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1e95730a840e698d%3A0x6b8d4f40f3b4c10c!2sSandton%2C%20Johannesburg!5e0!3m2!1sen!2sza!4v1620000000000!5m2!1sen!2sza"
/><div className="mt-3 text-[11px] text-grey font-medium p-3 bg-white rounded border border-grey-medium/5">
                📍 Currently servicing {displaySuburb}, {displayCity} and {displayProvince}.
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-grey-dark mb-1">Recent Customer Reviews</h2>
              <p className="text-small text-grey mb-6">What {displayCity} drivers are saying about {SITE_CONFIG.name}.</p>
              <div className="flex flex-col gap-4">
                {reviews?.length ? reviews.map((review: any) => (
                  <ReviewCard 
                    key={review.id} 
                    id={review.id}
                    customerName={review.customer_name} 
                    rating={review.rating} 
                    reviewText={review.comment} 
                    date={new Date(review.created_at).toLocaleDateString()}
                    vehicleServiced={undefined}
                  />
                )) : <p className="text-grey text-sm italic">No recent reviews.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Triptych */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 pb-8">
          {[
            { title: 'Upfront Transparent Pricing', desc: 'No surprise items on final invoices.', icon: '💵' },
            { title: 'Qualified Diagnostic Fleet', desc: 'Vetted mechanics with professional tools.', icon: '🔧' },
            { title: '12-Month Component Warranty', desc: 'Comprehensive platform product guarantee.', icon: '🛡️' },
          ].map((f) => (
            <div key={f.title} className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex gap-4 items-start">
              <span className="text-2xl p-2.5 bg-grey-lightest rounded-base border border-grey-medium/5 shrink-0">{f.icon}</span>
              <div>
                <h3 className="font-bold text-grey-dark text-sm">{f.title}</h3>
                <p className="text-xs text-grey mt-1">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}