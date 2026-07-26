export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Hero } from '@/components/features/Hero';
import { TestimonialsCarousel } from '@/components/features/TestimonialsCarousel';
import { FeatureShowcase } from '@/components/features/FeatureShowcase';
import { HowItWorks } from '@/components/features/HowItWorks';
import { ServicesGrid } from '@/components/features/ServicesGrid';
import { BottomCTA } from '@/components/features/BottomCTA';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getMergedSiteConfig } from '@/lib/get-site-config';

export async function generateMetadata(): Promise<Metadata> {
  const config = await getMergedSiteConfig()
  return {
    title: config.seo.defaultTitle,
    description: config.seo.defaultDescription,
    openGraph: {
      title: config.name,
      description: config.tagline,
      images: [config.images.favicon],
    },
  }
}

export default async function Home() {
  const config = await getMergedSiteConfig()
  const supabase = await createSupabaseServerClient()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('workshop_id', config.workshopId as string)
    .eq('status', 'approved')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  const { homePageContent } = config

  return (
    <>
      <Hero
        title={homePageContent.hero.title}
        description={homePageContent.hero.description}
        primaryCTA={{ label: homePageContent.hero.primaryCtaLabel, href: homePageContent.hero.primaryCtaHref }}
        secondaryCTA={
          homePageContent.hero.secondaryCtaLabel
            ? { label: homePageContent.hero.secondaryCtaLabel, href: homePageContent.hero.secondaryCtaHref || '/services' }
            : undefined
        }
        showImage={homePageContent.hero.showImage}
        imageSrc={homePageContent.hero.imageUrl || config.heroImageUrl || '/images/hero-image.webp'}
      />

      {homePageContent.testimonials.enabled && (
        <TestimonialsCarousel
          reviews={reviews ?? []}
          title={homePageContent.testimonials.title}
          subtitle={homePageContent.testimonials.subtitle}
        />
      )}

      {homePageContent.features.enabled && (
        <FeatureShowcase
          title={homePageContent.features.title}
          subtitle={homePageContent.features.subtitle}
          features={homePageContent.features.items}
        />
      )}

      {homePageContent.howItWorks.enabled && (
        <HowItWorks
          title={homePageContent.howItWorks.title}
          subtitle={homePageContent.howItWorks.subtitle}
          steps={homePageContent.howItWorks.steps}
        />
      )}

      {homePageContent.servicesGrid.enabled && (
        <ServicesGrid
          title={homePageContent.servicesGrid.title}
          subtitle={homePageContent.servicesGrid.subtitle}
          ctaLabel={homePageContent.servicesGrid.ctaLabel}
        />
      )}

      {homePageContent.bottomCta.enabled && (
        <BottomCTA
          heading={homePageContent.bottomCta.heading}
          description={homePageContent.bottomCta.description}
          buttonLabel={homePageContent.bottomCta.buttonLabel}
          buttonHref={homePageContent.bottomCta.buttonHref}
        />
      )}
    </>
  );
}
