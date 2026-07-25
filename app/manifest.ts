import type { MetadataRoute } from 'next'
import { getMergedSiteConfig } from '@/lib/get-site-config'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const config = await getMergedSiteConfig()
  return {
    name: config.name,
    short_name: config.nameBold,
    description: config.tagline,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: config.primaryColor,
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
