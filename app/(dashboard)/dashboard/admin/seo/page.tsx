export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Wrench, Shield, PhoneCall, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LocationPageProps {
  params: Promise<{
    province: string
    city: string
    suburb: string
  }>
}

// 🚀 1. Inject Page Meta Values dynamically directly to Search Engine Crawlers
export async function generateMetadata({ params }: LocationPageProps) {
  const { province, city, suburb } = await params
  
  // Normalize checking format to lowercase path strings
  const targetPath = `/${province}/${city}/${suburb}`.toLowerCase().trim()

  const { data: seoRecord } = await (supabase as any)
    .from('seo_registry')
    .select('meta_title, meta_description, meta_keywords')
    .ilike('path_url', targetPath) 
    .eq('is_active', true)
    .maybeSingle() 

  if (!seoRecord) return {}

  return {
    title: seoRecord.meta_title,
    description: seoRecord.meta_description,
    keywords: seoRecord.meta_keywords,
  }
}

// 🚗 2. The Main Viewport Dynamic Landing Page Engine Layout
export default async function DynamicLocationPage({ params }: LocationPageProps) {
  const { province, city, suburb } = await params
  
  // Reconstruct exact lowcase route string path 
  const targetPath = `/${province}/${city}/${suburb}`.toLowerCase().trim()

  const { data: pageData } = await (supabase as any)
    .from('seo_registry')
    .select('*')
    .ilike('path_url', targetPath)
    .eq('is_active', true)
    .maybeSingle()

  if (!pageData) {
    notFound() // Safely triggers standard 404 handler if path isn't live in DB
  }
  
  // Title text casing formatting helpers (e.g. ferndale -> Ferndale)
  const formatTextCase = (str: string) => str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const displayProvince = formatTextCase(province)
  const displayCity = formatTextCase(city)
  const displaySuburb = formatTextCase(suburb)

  // 🗺️ 100% Free Static Google Map Iframe URL builder string parameters 
  const mapSearchQuery = encodeURIComponent(`Mobile Mechanic in ${displaySuburb}, ${displayCity}, South Africa`)
  const reliableFreeEmbedUrl = `https://maps.google.com/maps?q=${mapSearchQuery}&t=&z=14&ie=UTF8&iwloc=&output=embed`

  return (
    <div className="min-h-screen bg-grey-lightest text-grey-dark font-sans">
      
      {/* 🏁 TOP STRIP: Flash Status Confirmation */}
      <div className="bg-success text-white text-xs font-bold uppercase tracking-widest text-center py-2 px-4 shadow-sm flex items-center justify-center gap-2">
        <CheckCircle size={12} className="fill-white text-success" />
        <span>Mobile Mechanic Fleet Dispatched & Active in {displaySuburb}</span>
      </div>

      {/* 🚀 HERO SPLIT BLOCK WORKSPACE */}
      <section className="bg-white border-b border-grey-medium/10 px-4 py-12 md:py-20 md:px-20 shadow-sm">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* LEFT CONTAINER: High-Conversion Copy Deck */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20 text-xs font-bold uppercase tracking-wider w-fit">
                <MapPin size={12} className="fill-primary" />
                <span>Driveway Servicing Area</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-grey-dark tracking-tight leading-tight mt-1">
                {pageData.h1_heading || `Need a Certified Mobile Mechanic in ${displaySuburb}?`}
              </h1>
            </div>

            <p className="text-sm md:text-base text-grey leading-relaxed">
              Don’t waste your Saturday morning towing your vehicle to a stationary workshop branch or waiting in crowded customer lounges. Our qualified, fully equipped mechanics operate directly across <span className="text-grey-dark font-extrabold">{displaySuburb}</span> and the greater <span className="text-grey-dark font-semibold">{displayCity}</span> zone.
            </p>

            {/* Premium Interactive Step Guidelines Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-b border-grey-light py-5 my-2">
              {[
                { count: '01', title: 'Get Quote', desc: 'Specify service items' },
                { count: '02', title: 'We Come To You', desc: 'Home or workplace driveway' },
                { count: '03', title: 'Job Sorted', desc: 'Premium diagnostic vetting' }
              ].map((step, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <span className="text-xs font-mono font-black text-primary/40 block">{step.count}</span>
                  <strong className="text-xs font-bold text-grey-dark uppercase tracking-wide">{step.title}</strong>
                  <span className="text-[11px] text-grey leading-normal">{step.desc}</span>
                </div>
              ))}
            </div>

            {/* Core Action Call-To-Action Pipeline Controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <Link href="/quote" className="no-underline flex-1 sm:flex-initial">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-white font-black text-sm px-8 py-4 rounded-base shadow-md hover:bg-primary-dark transition-all flex items-center justify-center gap-2 group h-12">
                  <span>Calculate Repair Estimate</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <a href="tel:+27820000000" className="no-underline flex-1 sm:flex-initial">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-grey-medium hover:border-primary text-grey-dark hover:text-primary font-bold text-sm px-6 h-12 rounded-base bg-white transition-all flex items-center justify-center gap-2">
                  <PhoneCall size={14} />
                  <span>Call Booking Desk</span>
                </Button>
              </a>
            </div>
          </div>

          {/* RIGHT CONTAINER: Visual Trust Map Box */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-grey-lightest border border-grey-medium/10 p-4 rounded-base shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-grey tracking-wider">Active Coverage Area Map</span>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success animate-ping" />
                  <span className="text-[10px] font-bold text-success uppercase">Fleet Online</span>
                </div>
              </div>

              {/* Secure Free Map Embedding */}
              <div className="w-full h-[250px] rounded-base overflow-hidden border border-grey-medium/20 relative shadow-inner bg-grey-light">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={reliableFreeEmbedUrl}
                />
              </div>

              <div className="text-[11px] text-grey font-medium leading-relaxed bg-white border border-grey-medium/5 p-3 rounded">
                📍 Our local team is currently servicing assets in <span className="font-bold text-grey-dark">{displaySuburb}</span>, <span className="font-bold text-grey-dark">{displayCity}</span> and surrounding areas in <span className="font-bold text-grey-dark">{displayProvince}</span>.
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 🛡️ BOTTOM TRIPTYCH: Trust Signal Safeguards Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Upfront Transparent Pricing',
              desc: 'No sudden surprise items on final invoices. You view and approve your full itemized parts and diagnostic quote parameters before any mechanical wrench hits your car.',
              icon: '💵'
            },
            {
              title: 'Qualified Diagnostic Fleet',
              desc: 'Our experienced South African field mechanics are fully vetted, background-checked, and highly skilled in major serving, braking overrides, and multi-point fault scans.',
              icon: '🔧'
            },
            {
              title: '12-Month Component Warranty',
              desc: 'Enjoy complete peace of mind. Every routine engine lubrication or major replacement repair task we complete carries our comprehensive platform product guarantee.',
              icon: '🛡️'
            }
          ].map((feature, i) => (
            <div key={i} className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex gap-4 items-start">
              <span className="text-2xl p-2.5 bg-grey-lightest rounded-base border border-grey-medium/5 shrink-0 block">{feature.icon}</span>
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-grey-dark text-sm">{feature.title}</h3>
                <p className="text-xs text-grey leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}