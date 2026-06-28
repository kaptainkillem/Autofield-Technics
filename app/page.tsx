export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Hero } from '@/components/features/Hero';
import { TestimonialsCarousel } from '@/components/features/TestimonialsCarousel';
import { FeatureShowcase } from '@/components/features/FeatureShowcase';
import { HowItWorks } from '@/components/features/HowItWorks';
import { ServicesGrid } from '@/components/features/ServicesGrid';
import { BottomCTA } from '@/components/features/BottomCTA';
import { supabase } from '@/lib/supabase';
import { SITE_CONFIG, replaceVars } from '@/lib/site-config';

export const metadata: Metadata = {
  title: replaceVars(SITE_CONFIG.seo.defaultTitle, { name: SITE_CONFIG.name, tagline: SITE_CONFIG.tagline }),
  description: replaceVars(SITE_CONFIG.seo.defaultDescription, { name: SITE_CONFIG.name, tagline: SITE_CONFIG.tagline }),
  openGraph: {
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.tagline,
    images: [SITE_CONFIG.images.ogImage],
  },
}

export default async function Home() {
  const { data: reviews } = await (supabase as any)
    .from('reviews')
    .select('*')
    .eq('status', 'approved')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <>
      <Hero
        title={SITE_CONFIG.hero.title}
        description={replaceVars(SITE_CONFIG.hero.description, { city: SITE_CONFIG.city })}
        primaryCTA={{ label: "Get a Free Quote", href: "/quote" }}
        secondaryCTA={{ label: "View Our Services", href: "/services" }}
        showImage
        imageSrc="/images/hero-image.webp"
      />

      <TestimonialsCarousel reviews={reviews ?? []} />

      <FeatureShowcase />

      <HowItWorks city={SITE_CONFIG.city} />

      <ServicesGrid />

      <BottomCTA />
    </>
  );
}