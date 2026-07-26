import { unstable_noStore } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { SITE_CONFIG, replaceVars } from './site-config'
import {
  HomePageContent,
  FontFamily,
  parseHomePageContent,
  replaceHomePageVars,
  getFontFamilyStack,
} from './homepage-content'

export interface SocialLink {
  platform: string
  url: string
}

export interface NavLink {
  label: string
  href: string
  external?: boolean
}

export interface MergedSiteConfig {
  workshopId: string | null
  name: string
  nameBold: string
  nameLight: string
  tagline: string
  phone: string
  whatsappNumber: string
  city: string
  region: string
  country: string
  currency: string
  companyName: string | null
  address: string | null
  logoUrl: string | null
  primaryColor: string
  accentColor: string
  primaryTextColor: string
  secondaryTextColor: string
  faviconUrl: string | null
  ogImageUrl: string | null
  heroImageUrl: string | null
  fontFamily: FontFamily
  fontFamilyStack: string
  documentFooter: string | null
  termsConditions: string | null
  vatNumber: string | null
  registrationNumber: string | null
  hourlyRate: number | null
  calloutFee: number | null
  diagnosticFee: number | null
  defaultDepositPercent: number | null
  businessHours: string
  yearsOfExperience: string
  specializations: string[]
  businessType: string
  serviceRadius: string
  experienceTagline: string
  serviceTagline: string
  responseTime: string
  homePageContent: HomePageContent
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
  socialMedia: Record<string, string>
  socialLinks: SocialLink[]
  business: {
    yearsOfExperience: string
    specializations: string[]
    businessType: string
    serviceRadius: string
    mechanicCount: number
    companyRegistration: string | null
    vatNumber: string | null
  }
  experience: string
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
    emergency: string
    bookNow: string
    submitQuote: string
  }
  serviceDetail: {
    whatsAppMessageTemplate: string
  }
  nav: NavLink[]
  footer: {
    showSocial: boolean
    showEmail: boolean
    showCompanyReg: boolean
  }
  images: {
    favicon: string
    heroImage: string
    ogImage: string
  }
  notFound: {
    message: string
  }
  privacy: {
    dataLocation: string
    complianceAct: string
  }
  workshopActive: boolean
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
  } catch (err) {
    console.error('[get-site-config] resolveWorkshopId failed:', err)
    if (process.env.NODE_ENV === 'development') throw err
    return null
  }
}

function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  // If it starts with 0 and looks like a South African number, convert to international
  if (digits.startsWith('0') && digits.length === 10) {
    return '27' + digits.slice(1)
  }
  return digits
}

function formatWhatsAppDisplay(raw: string | null | undefined): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('27')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }
  return raw
}

function parseSocialLinks(raw: unknown): SocialLink[] {
  if (!raw || !Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (typeof item === 'string') {
        try {
          item = JSON.parse(item)
        } catch {
          return null
        }
      }
      if (item && typeof item === 'object' && 'url' in item && 'platform' in item) {
        return { platform: String(item.platform), url: String(item.url) }
      }
      return null
    })
    .filter((item): item is SocialLink => item !== null)
}

function parseNavLinks(raw: unknown): NavLink[] {
  if (!raw || !Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (typeof item === 'string') {
        try {
          item = JSON.parse(item)
        } catch {
          return null
        }
      }
      if (item && typeof item === 'object' && 'label' in item && 'href' in item) {
        return {
          label: String(item.label),
          href: String(item.href),
          external: Boolean(item.external),
        } as NavLink
      }
      return null
    })
    .filter((item): item is NavLink => item !== null)
}

function toArray(value: readonly string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) return [...value]
  if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean)
  return []
}

export async function getMergedSiteConfig(): Promise<MergedSiteConfig> {
  unstable_noStore()
  const slug = process.env.NEXT_PUBLIC_DEFAULT_WORKSHOP_SLUG

  if (!slug) {
    const msg = '[get-site-config] NEXT_PUBLIC_DEFAULT_WORKSHOP_SLUG is not set — no workshop will be resolved.'
    console.error(msg)
    if (process.env.NODE_ENV === 'development') throw new Error(msg)
  }

  let dbSettings: Record<string, unknown> | null = null
  let dbWorkshop: { name: string; domain: string | null; status: string } | null = null
  let resolvedWorkshopId: string | null = null

  if (slug) {
    const workshopId = await resolveWorkshopId(slug)
    if (!workshopId) {
      console.error(`[get-site-config] Slug "${slug}" resolved to no workshop — falling back to defaults.`)
    }
    if (workshopId) {
      resolvedWorkshopId = workshopId
      try {
        const supabase = await createSupabaseServerClient()
        const [settingsResult, workshopResult] = await Promise.all([
          supabase
            .from('public_business_settings' as any)
            .select('*')
            .eq('workshop_id', workshopId)
            .maybeSingle(),
          supabase
            .from('workshops')
            .select('name, domain, status')
            .eq('id', workshopId)
            .maybeSingle(),
        ])

        let settingsData: Record<string, unknown> | null = null
        const viewError = (settingsResult as any)?.error as { message?: string } | null

        if (viewError) {
          console.error('[get-site-config] public_business_settings view error:', viewError)
          const { data: baseData, error: baseError } = await supabase
            .from('business_settings')
            .select('*')
            .eq('workshop_id', workshopId)
            .maybeSingle()
          if (baseError) {
            console.error('[get-site-config] business_settings fallback also failed:', baseError)
            if (process.env.NODE_ENV === 'development') throw baseError
          } else {
            console.log('[get-site-config] falling back to business_settings base table — view is missing')
          }
          settingsData = (baseData as Record<string, unknown> | null) ?? null
        } else {
          settingsData = (settingsResult as any)?.data ?? null
        }

        dbSettings = settingsData
        dbWorkshop = workshopResult?.data ?? null
      } catch (err) {
        console.error('[get-site-config] getMergedSiteConfig DB read failed:', err)
        if (process.env.NODE_ENV === 'development') throw err
        dbSettings = null
        dbWorkshop = null
      }
    }
  }

  const get = <T>(dbField: string, fallback: T): T => {
    if (dbSettings && dbSettings[dbField] !== undefined && dbSettings[dbField] !== null) {
      return dbSettings[dbField] as T
    }
    return fallback
  }

  const city = get('city', SITE_CONFIG.city)
  const name = get('site_name', dbWorkshop?.name ?? SITE_CONFIG.name)
  const phone = get('phone', SITE_CONFIG.phone)
  const whatsappNumber = get('whatsapp_number', phone)
  const normalizedWhatsApp = normalizePhone(whatsappNumber)
  const region = get('region', SITE_CONFIG.region)
  const country = get('country', SITE_CONFIG.country)
  const currency = get('currency', SITE_CONFIG.currency)
  const address = get('address', SITE_CONFIG.address.street)
  const fullAddress = address
    ? `${address}, ${SITE_CONFIG.address.area}, ${city}, ${SITE_CONFIG.address.countryFull}`
    : `${SITE_CONFIG.address.street}, ${SITE_CONFIG.address.area}, ${city}, ${SITE_CONFIG.address.countryFull}`

  const yearsOfExperience = get('years_experience', SITE_CONFIG.business.yearsOfExperience)
  const specializations = toArray(
    get<readonly string[]>('specializations', SITE_CONFIG.business.specializations as readonly string[])
  )
  const businessType = get('business_type', SITE_CONFIG.business.businessType)
  const serviceRadius = get('service_radius', SITE_CONFIG.business.serviceRadius)
  const serviceTagline = get('service_tagline', SITE_CONFIG.serviceTagline)
  const responseTime = get('response_time', SITE_CONFIG.responseTime)
  const experienceTagline = get(
    'experience_tagline',
    replaceVars(SITE_CONFIG.experience, {
      years: yearsOfExperience,
      specializations: specializations.join(', '),
      city,
    })
  )

  const socialLinks = parseSocialLinks(get('social_links', null))
  const socialMedia: Record<string, string> = {}
  for (const link of socialLinks) {
    socialMedia[link.platform.toLowerCase()] = link.url
  }
  // Fallback to hardcoded social media if no DB links are set
  if (socialLinks.length === 0) {
    Object.entries(SITE_CONFIG.socialMedia).forEach(([key, value]) => {
      if (value) socialMedia[key] = value
    })
  }

  const navLinks = parseNavLinks(get('nav_links', null))
  const nav: NavLink[] = navLinks.length > 0
    ? navLinks
    : SITE_CONFIG.navigation.header.map((link) => ({ ...link }))

  const contactEmail = get('contact_email', SITE_CONFIG.contact.email)
  const businessHours = get('business_hours', SITE_CONFIG.contact.businessHours)
  const whatsappDisplay = formatWhatsAppDisplay(whatsappNumber)

  const heroDescription = replaceVars(
    get('hero_description', SITE_CONFIG.hero.description),
    { city }
  )

  const footerShowSocial = get('footer_show_social', SITE_CONFIG.footer.showSocial)
  const footerShowEmail = get('footer_show_email', SITE_CONFIG.footer.showEmail)
  const footerShowCompanyReg = get(
    'footer_show_company_reg',
    SITE_CONFIG.footer.showCompanyReg
  )

  const companyRegistration = get('registration_number', SITE_CONFIG.business.companyRegistration)
  const vatNumber = get('vat_number', SITE_CONFIG.business.vatNumber)

  const heroTitle = get('hero_title', SITE_CONFIG.hero.title)

  const rawHomePageContent = get('home_page_content', null)
  const parsedHomePageContent = replaceHomePageVars(
    parseHomePageContent(rawHomePageContent),
    {
      city,
      name,
      phone,
      whatsapp: formatWhatsAppDisplay(whatsappNumber),
      years: yearsOfExperience,
      specializations: specializations.join(', '),
    }
  )

  const fontFamily = (get('font_family', 'Inter') as FontFamily) || 'Inter'

  return {
    workshopId: resolvedWorkshopId,
    name,
    nameBold: dbSettings?.site_name ? name.split(' ').slice(0, -1).join(' ') || name : SITE_CONFIG.nameBold,
    nameLight: dbSettings?.site_name ? name.split(' ').slice(-1).join(' ') || '' : SITE_CONFIG.nameLight,
    tagline: SITE_CONFIG.tagline,
    phone,
    whatsappNumber: normalizedWhatsApp || phone.replace(/\D/g, ''),
    city,
    region,
    country,
    currency,
    companyName: get('company_name', name),
    address: fullAddress,
    logoUrl: get('logo_url', null),
    primaryColor: get('primary_color', '#3B82F6'),
    accentColor: get('accent_color', '#10B981'),
    primaryTextColor: get('primary_text_color', '#111827'),
    secondaryTextColor: get('secondary_text_color', '#595959'),
    faviconUrl: get('favicon_url', null),
    ogImageUrl: get('og_image_url', SITE_CONFIG.seo.ogImage),
    heroImageUrl: get('hero_image_url', SITE_CONFIG.images.heroImage),
    fontFamily,
    fontFamilyStack: getFontFamilyStack(fontFamily),
    documentFooter: get('document_footer', null),
    termsConditions: get('terms_conditions', null),
    vatNumber,
    registrationNumber: companyRegistration,
    hourlyRate: get('hourly_rate', null),
    calloutFee: get('callout_fee', null),
    diagnosticFee: get('diagnostic_fee', null),
    defaultDepositPercent: get('default_deposit_percent', null),
    businessHours,
    yearsOfExperience,
    specializations,
    businessType,
    serviceRadius,
    experienceTagline,
    serviceTagline,
    responseTime,
    homePageContent: parsedHomePageContent,
    contact: {
      email: contactEmail,
      whatsappDisplay: whatsappDisplay || SITE_CONFIG.contact.whatsappDisplay,
      businessHours,
    },
    hero: {
      title: heroTitle,
      description: heroDescription,
    },
    seo: {
      defaultTitle: replaceVars(SITE_CONFIG.seo.defaultTitle, { name, tagline: SITE_CONFIG.tagline }),
      defaultDescription: replaceVars(SITE_CONFIG.seo.defaultDescription, { name, tagline: SITE_CONFIG.tagline }),
    },
    socialMedia,
    socialLinks,
    business: {
      yearsOfExperience,
      specializations,
      businessType,
      serviceRadius,
      mechanicCount: SITE_CONFIG.business.mechanicCount,
      companyRegistration,
      vatNumber,
    },
    experience: experienceTagline,
    quotes: {
      heroTitle: SITE_CONFIG.quotes.heroTitle,
      heroDescription: SITE_CONFIG.quotes.heroDescription,
      howItWorksTitle: SITE_CONFIG.quotes.howItWorksTitle,
      howItWorksDescription: SITE_CONFIG.quotes.howItWorksDescription,
      whatsAppPrefix: SITE_CONFIG.quotes.whatsAppPrefix,
      responseTimeLabel: replaceVars(SITE_CONFIG.quotes.responseTimeLabel, { responseTime }),
      locationLabel: SITE_CONFIG.quotes.locationLabel,
      serviceAreaLabel: SITE_CONFIG.quotes.serviceAreaLabel,
      steps: SITE_CONFIG.quotes.steps.map((s) => ({ ...s })),
    },
    services: {
      title: SITE_CONFIG.services.heroTitle,
      description: SITE_CONFIG.services.heroDescription,
    },
    reviews: {
      title: 'Customer Reviews',
      description: replaceVars(SITE_CONFIG.reviews.subtitle, { city, name }),
      testimonialTitle: SITE_CONFIG.reviews.subtitle,
    },
    contactForm: {
      title: SITE_CONFIG.contactForm.title,
      description: SITE_CONFIG.contactForm.description,
    },
    cta: { ...SITE_CONFIG.cta },
    serviceDetail: { ...SITE_CONFIG.serviceDetail },
    nav,
    footer: {
      showSocial: footerShowSocial,
      showEmail: footerShowEmail,
      showCompanyReg: footerShowCompanyReg,
    },
    images: {
      favicon: get('favicon_url', SITE_CONFIG.images.favicon) || '/favicon.ico',
      heroImage: get('hero_image_url', SITE_CONFIG.images.heroImage),
      ogImage: get('og_image_url', SITE_CONFIG.seo.ogImage),
    },
    notFound: { ...SITE_CONFIG.notFound },
    privacy: { ...SITE_CONFIG.privacy },
    workshopActive: dbWorkshop ? dbWorkshop.status === 'active' : true,
  }
}
