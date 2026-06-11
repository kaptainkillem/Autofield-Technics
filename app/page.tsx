export const dynamic = 'force-dynamic'

import { Hero } from '@/components/features/Hero';

export default function Home() {
  return (
    <Hero 
      title="Professional Mechanical Care, Wherever You Are"
      description="From emergency roadside assistance to expert workshop repairs in Johannesburg."
      primaryCTA={{ label: "Get a Free Quote", href: "/quote" }}
      secondaryCTA={{ label: "View Our Services", href: "/services" }}
      showImage
      imageSrc="/images/hero-image.webp"
    />
  );
}