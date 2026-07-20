import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { SITE_CONFIG, replaceVars } from './site-config'

export interface MergedSiteConfig {
  name: string
  nameBold: string
  nameLight: string
  tagline: string
  phone: string
  city: string
  region: string
  country: string
  currency: string
  companyName: string | null
  address: string | null
  logoUrl: string | null
  primaryColor: string
  accentColor: string
  faviconUrl: string | null
  documentFooter: string | null
  termsConditions: string | null
  vatNumber: string | null
  registrationNumber: string | null
  hourlyRate: number | null
  calloutFee: number | null
  diagnosticFee: number | null
  defaultDepositPercent: number | null
  contact: {
    email: string
    whatsappDisplay: string
    businessHours: string
  }
  hero: {
    title: string
    description: string
  }
  seo: {
    defaultTitle: string
    defaultDescription: string
  }
  socialMedia: {
    facebook: string
    instagram: string
  }
  business: {
    yearsOfExperience: string
    specializations: string[]
    businessType: string
    serviceRadius: string
    mechanicCount: number
  }
  experience: string
  responseTime: string
  serviceTagline: string
  quotes: {
    heroTitle: string
    heroDescription: string
    howItWorksTitle: string
    howItWorksDescription: string
    whatsAppPrefix: string
    responseTimeLabel: string
    locationLabel: string
    serviceAreaLabel: string
    steps: { title: string; description: string }[]
  }
  services: {
    title: string
    description: string
  }
  reviews: {
    title: string
    description: string
    testimonialTitle: string
  }
  contactForm: {
    title: string
    description: string
  }
  cta: {
    primary: string
    secondary: string
  }
  nav: { label: string; href: string; external?: boolean }[]
  images: {
    favicon: string
  }
}

async function resolveWorkshopId(slug: string): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('workshops')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    return data?.id ?? null
  } catch {
    return null
  }
}

export async function getMergedSiteConfig(): Promise<MergedSiteConfig> {
  const slug = process.env.NEXT_PUBLIC_DEFAULT_WORKSHOP_SLUG
  let dbSettings: Record<string, any> | null = null

  if (slug) {
    const workshopId = await resolveWorkshopId(slug)
    if (workshopId) {
      try {
        const supabase = await createSupabaseServerClient()
        const { data } = await supabase
          .from('business_settings')
          .select('*')
          .eq('workshop_id', workshopId)
          .maybeSingle()
        dbSettings = data ?? null
      } catch {
        dbSettings = null
      }
    }
  }

  const get = (dbField: string, fallback: any) => {
    if (dbSettings && dbSettings[dbField] !== undefined && dbSettings[dbField] !== null) {
      return dbSettings[dbField]
    }
    return fallback
  }

  const city = get('city', SITE_CONFIG.city)
  const name = get('site_name', SITE_CONFIG.name)

  return {
    name,
    nameBold: SITE_CONFIG.nameBold,
    nameLight: SITE_CONFIG.nameLight,
    tagline: SITE_CONFIG.tagline,
    phone: get('phone', SITE_CONFIG.phone),
    city,
    region: SITE_CONFIG.region,
    country: SITE_CONFIG.country,
    currency: SITE_CONFIG.currency,
    companyName: get('company_name', SITE_CONFIG.name),
    address: get('address', SITE_CONFIG.address.street),
    logoUrl: get('logo_url', null),
    primaryColor: get('primary_color', '#3B82F6'),
    accentColor: get('accent_color', '#10B981'),
    faviconUrl: get('favicon_url', null),
    documentFooter: get('document_footer', null),
    termsConditions: get('terms_conditions', null),
    vatNumber: get('vat_number', null),
    registrationNumber: get('registration_number', null),
    hourlyRate: get('hourly_rate', null),
    calloutFee: get('callout_fee', null),
    diagnosticFee: get('diagnostic_fee', null),
    defaultDepositPercent: get('default_deposit_percent', null),
    contact: {
      email: get('contact_email', SITE_CONFIG.contact.email),
      whatsappDisplay: SITE_CONFIG.contact.whatsappDisplay,
      businessHours: SITE_CONFIG.contact.businessHours,
    },
    hero: {
      title: get('hero_title', SITE_CONFIG.hero.title),
      description: replaceVars(get('hero_description', SITE_CONFIG.hero.description), { city }),
    },
    seo: {
      defaultTitle: replaceVars(SITE_CONFIG.seo.defaultTitle, { name, tagline: SITE_CONFIG.tagline }),
      defaultDescription: replaceVars(SITE_CONFIG.seo.defaultDescription, { name, tagline: SITE_CONFIG.tagline }),
    },
    socialMedia: { ...SITE_CONFIG.socialMedia },
    business: {
      yearsOfExperience: SITE_CONFIG.business.yearsOfExperience,
      specializations: [...SITE_CONFIG.business.specializations],
      businessType: SITE_CONFIG.business.businessType,
      serviceRadius: SITE_CONFIG.business.serviceRadius,
      mechanicCount: SITE_CONFIG.business.mechanicCount,
    },
    experience: SITE_CONFIG.experience,
    responseTime: SITE_CONFIG.responseTime,
    serviceTagline: SITE_CONFIG.serviceTagline,
    quotes: {
      heroTitle: SITE_CONFIG.quotes.heroTitle,
      heroDescription: SITE_CONFIG.quotes.heroDescription,
      howItWorksTitle: SITE_CONFIG.quotes.howItWorksTitle,
      howItWorksDescription: SITE_CONFIG.quotes.howItWorksDescription,
      whatsAppPrefix: SITE_CONFIG.quotes.whatsAppPrefix,
      responseTimeLabel: SITE_CONFIG.quotes.responseTimeLabel,
      locationLabel: SITE_CONFIG.quotes.locationLabel,
      serviceAreaLabel: SITE_CONFIG.quotes.serviceAreaLabel,
      steps: SITE_CONFIG.quotes.steps.map(s => ({ ...s })),
    },
    services: {
      title: (SITE_CONFIG as any).services?.heroTitle || 'Our Services',
      description: (SITE_CONFIG as any).services?.heroDescription || '',
    },
    reviews: {
      title: (SITE_CONFIG as any).reviews?.title || 'Customer Reviews',
      description: (SITE_CONFIG as any).reviews?.description || '',
      testimonialTitle: (SITE_CONFIG as any).reviews?.subtitle || 'What drivers are saying',
    },
    contactForm: {
      title: (SITE_CONFIG as any).contactForm?.title || 'Contact Us',
      description: (SITE_CONFIG as any).contactForm?.description || '',
    },
    cta: { ...SITE_CONFIG.cta },
    nav: (SITE_CONFIG as any).navigation?.header || [],
    images: { favicon: (SITE_CONFIG as any).images?.favicon || '/favicon.ico' },
  }
}
