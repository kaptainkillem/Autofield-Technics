import { MetadataRoute } from 'next'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getMergedSiteConfig } from '@/lib/get-site-config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://autofieldstechnics.co.za'

  const supabase = await createSupabaseServerClient()
  const config = await getMergedSiteConfig()
  const workshopId = config.workshopId

  const seoQuery = workshopId
    ? supabase.from('seo_registry').select('path_url').eq('page_type', 'geographic_node').or('workshop_id.eq.' + workshopId + ',workshop_id.is.null')
    : supabase.from('seo_registry').select('path_url').eq('page_type', 'geographic_node')

  const categoriesQuery = workshopId
    ? supabase.from('categories').select('slug').eq('workshop_id', workshopId)
    : supabase.from('categories').select('slug')

  const faqsQuery = workshopId
    ? supabase.from('faqs').select('id').eq('is_active', true).or('workshop_id.eq.' + workshopId + ',workshop_id.is.null')
    : supabase.from('faqs').select('id').eq('is_active', true)

  const servicesQuery = (() => {
    let q = supabase.from('services').select('id').eq('is_active', true)
    if (workshopId) q = q.eq('workshop_id', workshopId)
    return q
  })()

  const [
    { data: services },
    { data: categories },
    { data: geoNodes },
    { data: faqs },
  ] = await Promise.all([
    servicesQuery,
    categoriesQuery,
    seoQuery,
    faqsQuery,
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
      ...(categories as { slug: string }[]).map((c) => ({
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
      ...(services as { id: string }[]).map((s) => ({
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
      ...(geoNodes as { path_url: string }[]).map((g) => ({
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
      ...(faqs as { id: string }[]).map((f) => ({
        url: `${baseUrl}/faq#${f.id}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      }))
    )
  }

  return routes
}
