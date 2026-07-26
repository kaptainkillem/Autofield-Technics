import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { Database } from '@/types/database'
import { ServicesTable } from '@/components/admin/ServicesTable'
import { PageWrapper } from '@/components/layout/PageWrapper'

type ServiceRow = Database['public']['Tables']['services']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']

export const dynamic = 'force-dynamic'

export default async function AdminServicesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const workshopId = (() => {
    try {
      const payload = JSON.parse(atob(session!.access_token.split('.')[1]))
      return payload?.app_metadata?.workshop_id as string
    } catch { return '' }
  })()

  const [{ data: services }, { data: categories }] = await Promise.all([
    supabase.from('services').select('*').eq('workshop_id', workshopId).order('name', { ascending: true }),
    supabase.from('categories').select('*').eq('workshop_id', workshopId).order('display_order', { ascending: true }),
  ])

  const items = (services ?? []) as ServiceRow[]
  const cats = (categories ?? []) as CategoryRow[]
  const categoryMap = new Map(cats.map((c) => [c.id, c.name]))

  return (
    <PageWrapper>
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
        <div className="mb-6 border-b border-grey-light pb-3">
          <h1 className="text-2xl font-bold text-grey-dark">Services Management</h1>
          <p className="text-sm text-grey">Create, edit, and manage your service catalog. Toggle visibility and set pricing.</p>
        </div>
        <ServicesTable services={items} categoryMap={categoryMap} />
      </div>
    </PageWrapper>
  )
}