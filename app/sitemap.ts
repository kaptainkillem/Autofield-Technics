import { MetadataRoute } from 'next'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://autofieldstechnics.co.za'

  const supabase = await createSupabaseServerClient()

  // Fetch dynamic routes
  const [
    { data: services },
    { data: categories },
    { data: geoNodes },
    { data: faqs },
  ] = await Promise.all([
    supabase.from('services').select('id').eq('is_active', true),
    supabase.from('categories').select('slug'),
    supabase.from('seo_registry').select('path_url').eq('page_type', 'geographic_node'),
    supabase.from('faqs').select('id').eq('is_active', true),
  ])

  const staticRoutes = [
    '',
    '/services',
    '/quote',
    '/reviews',
    '/contact',
    '/faq',
    '/terms',
    '/privacy',
    '/locations',
    '/signin',
    '/signup',
  ]

  const routes: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1.0 : 0.8,
  }))

  // Service category pages
  if (categories) {
    routes.push(
      ...categories.map((c) => ({
        url: `${baseUrl}/services/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    )
  }

  // Individual service pages
  if (services) {
    routes.push(
      ...services.map((s) => ({
        url: `${baseUrl}/services/category/${s.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    )
  }

  // Geographic landing pages
  if (geoNodes) {
    routes.push(
      ...geoNodes.map((g) => ({
        url: `${baseUrl}${g.path_url}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    )
  }

  // FAQ pages
  if (faqs) {
    routes.push(
      ...faqs.map((f) => ({
        url: `${baseUrl}/faq#${f.id}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      }))
    )
  }

  return routes
}
