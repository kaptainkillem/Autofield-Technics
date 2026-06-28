import type { MetadataRoute } from 'next'
import { SITE_CONFIG } from '@/lib/site-config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/', '/auth/'],
    },
    sitemap: `${SITE_CONFIG.seo.ogImage.replace('/images/og-image.webp', '')}/sitemap.xml`,
  }
}
