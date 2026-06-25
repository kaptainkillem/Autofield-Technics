export const dynamic = 'force-dynamic'

import { Hero } from '@/components/features/Hero';
import { ScrollingReviews } from '@/components/features/ScrollingReviews';
import { FeatureShowcase } from '@/components/features/FeatureShowcase';
import { HowItWorks } from '@/components/features/HowItWorks';
import { ServicesGrid } from '@/components/features/ServicesGrid';
import { BottomCTA } from '@/components/features/BottomCTA';
import { SITE_CONFIG, replaceVars } from '@/lib/site-config';

export default function Home() {
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

      <ScrollingReviews />

      <FeatureShowcase />

      <HowItWorks city={SITE_CONFIG.city} />

      <ServicesGrid />

      <BottomCTA />
    </>
  );
}