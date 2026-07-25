import { z } from 'zod'

export const allowedFontFamilies = [
  { value: 'Inter', label: 'Inter (clean, modern)' },
  { value: 'Geist', label: 'Geist (Vercel default)' },
  { value: 'Arial', label: 'Arial / System' },
  { value: 'Oswald', label: 'Oswald (industrial, bold)' },
  { value: 'Roboto', label: 'Roboto (Google classic)' },
] as const

export type FontFamily = (typeof allowedFontFamilies)[number]['value']

export const allowedStepIcons = [
  'MessageSquare', 'Wrench', 'Car', 'Phone', 'Mail', 'Clock', 'Calendar',
  'CheckCircle', 'Shield', 'Zap', 'MapPin', 'Navigation', 'Star',
] as const

export type StepIcon = (typeof allowedStepIcons)[number]

export const DEFAULT_HOME_PAGE_HERO = {
  title: 'Professional Mechanical Care, Wherever You Are',
  description: 'From emergency roadside assistance to expert workshop repairs in {city}.',
  primaryCtaLabel: 'Get a Free Quote',
  primaryCtaHref: '/quote',
  secondaryCtaLabel: 'View Our Services',
  secondaryCtaHref: '/services',
  showImage: true,
  imageUrl: null as string | null,
}

export const DEFAULT_HOME_PAGE_FEATURES = {
  enabled: true,
  title: '',
  subtitle: '',
  items: [
    {
      heading: 'The Ultimate Driveway Workshop',
      text: "You don't need to arrange a tow truck or waste your Saturday sitting in a repair shop. Our mobile units arrive at your home or office fully equipped.",
      imageUrl: 'https://images.pexels.com/photos/4489758/pexels-photo-4489758.jpeg',
    },
    {
      heading: 'Transparent, Upfront Pricing',
      text: 'Once we diagnose the issue, you receive a detailed, digital quote sent straight to your phone. We break down the exact cost of parts and labor. No hidden fees.',
      imageUrl: 'https://images.pexels.com/photos/4116221/pexels-photo-4116221.jpeg',
    },
    {
      heading: 'Certified & Guaranteed Expertise',
      text: 'Your vehicle is handled by qualified professionals with deep diagnostic experience. We back our workmanship with a comprehensive guarantee.',
      imageUrl: 'https://images.pexels.com/photos/8478206/pexels-photo-8478206.jpeg',
    },
  ],
}

export const DEFAULT_HOME_PAGE_HOW_IT_WORKS = {
  enabled: true,
  title: 'How It Works',
  subtitle: 'Getting your car fixed in {city} has never been easier. Here is how we bring the workshop to you.',
  steps: [
    { heading: 'Get a Quote', description: 'Tell us your car and the problem. We give you a transparent price upfront.', iconName: 'MessageSquare' as StepIcon },
    { heading: 'We Come To You', description: 'We arrive at your home or office fully equipped.', iconName: 'Wrench' as StepIcon },
    { heading: 'Drive Happy', description: 'Your car is fixed on-site with zero towing fees or workshop waiting rooms.', iconName: 'Car' as StepIcon },
  ],
}

export const DEFAULT_HOME_PAGE_SERVICES_GRID = {
  enabled: true,
  title: 'Our Services',
  subtitle: 'Professional mobile mechanics bringing expert repairs and servicing right to your doorstep.',
  ctaLabel: 'View All Services',
}

export const DEFAULT_HOME_PAGE_TESTIMONIALS = {
  enabled: true,
  title: 'What Our Customers Say',
  subtitle: 'Trusted by drivers across {city}.',
}

export const DEFAULT_HOME_PAGE_BOTTOM_CTA = {
  enabled: true,
  heading: 'Stop waiting in workshop lobbies.',
  description: 'Get your car fixed today right where you parked.',
  buttonLabel: 'Get a Free Quote',
  buttonHref: '/quote',
}

export const DEFAULT_HOME_PAGE_STICKY_CTA = {
  enabled: true,
  title: 'Need urgent help?',
  subtitle: 'Get a free quote in minutes.',
  buttonLabel: 'Get a Free Quote',
  href: '/quote',
}

export const DEFAULT_HOME_PAGE_CONTENT = {
  hero: DEFAULT_HOME_PAGE_HERO,
  features: DEFAULT_HOME_PAGE_FEATURES,
  howItWorks: DEFAULT_HOME_PAGE_HOW_IT_WORKS,
  servicesGrid: DEFAULT_HOME_PAGE_SERVICES_GRID,
  testimonials: DEFAULT_HOME_PAGE_TESTIMONIALS,
  bottomCta: DEFAULT_HOME_PAGE_BOTTOM_CTA,
  stickyCta: DEFAULT_HOME_PAGE_STICKY_CTA,
}

export const HomePageHeroSchema = z.object({
  title: z.string().max(200),
  description: z.string().max(500),
  primaryCtaLabel: z.string().max(50),
  primaryCtaHref: z.string().max(200),
  secondaryCtaLabel: z.string().max(50).optional(),
  secondaryCtaHref: z.string().max(200).optional(),
  showImage: z.boolean(),
  imageUrl: z.string().max(1000).nullable().optional(),
})

export const HomePageFeatureSchema = z.object({
  heading: z.string().max(200),
  text: z.string().max(1000),
  imageUrl: z.string().max(1000),
})

export const HomePageFeaturesSchema = z.object({
  enabled: z.boolean(),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
  items: z.array(HomePageFeatureSchema).min(1).max(4),
})

export const HomePageStepSchema = z.object({
  heading: z.string().max(200),
  description: z.string().max(500),
  iconName: z.enum(allowedStepIcons),
})

export const HomePageHowItWorksSchema = z.object({
  enabled: z.boolean(),
  title: z.string().max(200),
  subtitle: z.string().max(500),
  steps: z.array(HomePageStepSchema).min(1).max(6),
})

export const HomePageServicesGridSchema = z.object({
  enabled: z.boolean(),
  title: z.string().max(200),
  subtitle: z.string().max(500),
  ctaLabel: z.string().max(100),
})

export const HomePageTestimonialsSchema = z.object({
  enabled: z.boolean(),
  title: z.string().max(200),
  subtitle: z.string().max(500),
})

export const HomePageBottomCtaSchema = z.object({
  enabled: z.boolean(),
  heading: z.string().max(200),
  description: z.string().max(500),
  buttonLabel: z.string().max(100),
  buttonHref: z.string().max(200),
})

export const HomePageStickyCtaSchema = z.object({
  enabled: z.boolean(),
  title: z.string().max(200),
  subtitle: z.string().max(500),
  buttonLabel: z.string().max(100),
  href: z.string().max(200),
})

export const HomePageContentSchema = z.object({
  hero: HomePageHeroSchema,
  features: HomePageFeaturesSchema,
  howItWorks: HomePageHowItWorksSchema,
  servicesGrid: HomePageServicesGridSchema,
  testimonials: HomePageTestimonialsSchema,
  bottomCta: HomePageBottomCtaSchema,
  stickyCta: HomePageStickyCtaSchema,
})

export type HomePageContent = z.infer<typeof HomePageContentSchema>

/**
 * Validate and normalize raw homepage content JSON from the database.
 * Returns a safe, fully-typed object with all defaults applied.
 */
export function parseHomePageContent(raw: unknown): HomePageContent {
  const result = HomePageContentSchema.safeParse(raw)
  if (!result.success) {
    if (raw && typeof raw === 'object') {
      console.warn('Home page content validation failed:', result.error.issues)
    }
    return { ...DEFAULT_HOME_PAGE_CONTENT }
  }
  return result.data
}

/**
 * Build the default homepage content for a new workshop. Includes template
 * variables so the site immediately feels personal when city/name are set.
 */
export function createDefaultHomePageContent(): HomePageContent {
  return { ...DEFAULT_HOME_PAGE_CONTENT }
}

/**
 * Apply template variable replacement to homepage strings. Supported vars:
 * {city}, {name}, {phone}, {whatsapp}, {years}, {specializations}
 */
export function replaceHomePageVars(
  content: HomePageContent,
  vars: {
    city?: string
    name?: string
    phone?: string
    whatsapp?: string
    years?: string
    specializations?: string
  }
): HomePageContent {
  const replace = (text: string): string =>
    text
      .replace(/\{city\}/g, vars.city ?? '')
      .replace(/\{name\}/g, vars.name ?? '')
      .replace(/\{phone\}/g, vars.phone ?? '')
      .replace(/\{whatsapp\}/g, vars.whatsapp ?? '')
      .replace(/\{years\}/g, vars.years ?? '')
      .replace(/\{specializations\}/g, vars.specializations ?? '')

  return {
    ...content,
    hero: {
      ...content.hero,
      title: replace(content.hero.title),
      description: replace(content.hero.description),
    },
    features: {
      ...content.features,
      title: content.features.title ? replace(content.features.title) : content.features.title,
      subtitle: content.features.subtitle ? replace(content.features.subtitle) : content.features.subtitle,
    },
    howItWorks: {
      ...content.howItWorks,
      title: replace(content.howItWorks.title),
      subtitle: replace(content.howItWorks.subtitle),
    },
    servicesGrid: {
      ...content.servicesGrid,
      title: replace(content.servicesGrid.title),
      subtitle: replace(content.servicesGrid.subtitle),
    },
    testimonials: {
      ...content.testimonials,
      title: replace(content.testimonials.title),
      subtitle: replace(content.testimonials.subtitle),
    },
    bottomCta: {
      ...content.bottomCta,
      heading: replace(content.bottomCta.heading),
      description: replace(content.bottomCta.description),
    },
    stickyCta: {
      ...content.stickyCta,
      title: replace(content.stickyCta.title),
      subtitle: replace(content.stickyCta.subtitle),
    },
  }
}

/**
 * Map a font family value to a CSS font-family stack.
 */
export function getFontFamilyStack(fontFamily: FontFamily | string): string {
  switch (fontFamily) {
    case 'Inter':
      return 'Inter, Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    case 'Geist':
      return 'Geist, Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    case 'Oswald':
      return 'Oswald, Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    case 'Roboto':
      return 'Roboto, Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    case 'Arial':
    default:
      return 'Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  }
}
