export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Hero } from '@/components/features/Hero';
import { TestimonialsCarousel } from '@/components/features/TestimonialsCarousel';
import { FeatureShowcase } from '@/components/features/FeatureShowcase';
import { HowItWorks } from '@/components/features/HowItWorks';
import { ServicesGrid } from '@/components/features/ServicesGrid';
import { BottomCTA } from '@/components/features/BottomCTA';
import { supabase } from '@/lib/supabase';
import { SITE_CONFIG } from '@/lib/site-config';
import { getMergedSiteConfig } from '@/lib/get-site-config';

export async function generateMetadata(): Promise<Metadata> {
  const config = await getMergedSiteConfig()
  return {
    title: config.seo.defaultTitle,
    description: config.seo.defaultDescription,
    openGraph: {
      title: config.name,
      description: config.tagline,
      images: [SITE_CONFIG.images.ogImage],
    },
  }
}

export default async function Home() {
  const config = await getMergedSiteConfig()

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
        title={config.hero.title}
        description={config.hero.description}
        primaryCTA={{ label: "Get a Free Quote", href: "/quote" }}
        secondaryCTA={{ label: "View Our Services", href: "/services" }}
        showImage
        imageSrc="/images/hero-image.webp"
      />

      <TestimonialsCarousel reviews={reviews ?? []} />

      <FeatureShowcase />

      <HowItWorks city={config.city} />

      <ServicesGrid />

      <BottomCTA />
    </>
  );
}
