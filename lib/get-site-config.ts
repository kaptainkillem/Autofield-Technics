import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { SITE_CONFIG, replaceVars } from './site-config'

export interface MergedSiteConfig {
  name: string
  tagline: string
  phone: string
  city: string
  region: string
  country: string
  currency: string
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
}

export async function getMergedSiteConfig(): Promise<MergedSiteConfig> {
  try {
    const supabase = createSupabaseAdminClient()
    const { data } = await supabase
      .from('business_settings')
      .select('site_name, phone, city, hero_title, hero_description, contact_email')
      .eq('id', 'config')
      .single()

    if (data) {
      const city = data.city || SITE_CONFIG.city
      const name = data.site_name || SITE_CONFIG.name
      const tagline = SITE_CONFIG.tagline

      return {
        name,
        tagline,
        phone: data.phone || SITE_CONFIG.phone,
        city,
        region: SITE_CONFIG.region,
        country: SITE_CONFIG.country,
        currency: SITE_CONFIG.currency,
        contact: {
          email: data.contact_email || SITE_CONFIG.contact.email,
          whatsappDisplay: SITE_CONFIG.contact.whatsappDisplay,
          businessHours: SITE_CONFIG.contact.businessHours,
        },
        hero: {
          title: data.hero_title || SITE_CONFIG.hero.title,
          description: replaceVars(
            data.hero_description || SITE_CONFIG.hero.description,
            { city }
          ),
        },
        seo: {
          defaultTitle: replaceVars(SITE_CONFIG.seo.defaultTitle, { name, tagline }),
          defaultDescription: replaceVars(SITE_CONFIG.seo.defaultDescription, { name, tagline }),
        },
      }
    }
  } catch {
    // Fallback to hardcoded config if DB is unreachable
  }

  return {
    name: SITE_CONFIG.name,
    tagline: SITE_CONFIG.tagline,
    phone: SITE_CONFIG.phone,
    city: SITE_CONFIG.city,
    region: SITE_CONFIG.region,
    country: SITE_CONFIG.country,
    currency: SITE_CONFIG.currency,
    contact: { ...SITE_CONFIG.contact },
    hero: {
      title: SITE_CONFIG.hero.title,
      description: replaceVars(SITE_CONFIG.hero.description, { city: SITE_CONFIG.city }),
    },
    seo: {
      defaultTitle: replaceVars(SITE_CONFIG.seo.defaultTitle, { name: SITE_CONFIG.name, tagline: SITE_CONFIG.tagline }),
      defaultDescription: replaceVars(SITE_CONFIG.seo.defaultDescription, { name: SITE_CONFIG.name, tagline: SITE_CONFIG.tagline }),
    },
  }
}
