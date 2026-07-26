import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { Database } from '@/types/database'
import AdminServiceForm from './AdminServiceForm'
import { PageWrapper } from '@/components/layout/PageWrapper'

type CategoryRow = Database['public']['Tables']['categories']['Row']

export const dynamic = 'force-dynamic'

export default async function NewServicePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const workshopId = (() => {
    try {
      const payload = JSON.parse(atob(session!.access_token.split('.')[1]))
      return payload?.app_metadata?.workshop_id as string
    } catch { return '' }
  })()
  const { data: categories } = await supabase.from('categories').select('*').eq('workshop_id', workshopId).order('display_order', { ascending: true })
  const cats = (categories ?? []) as CategoryRow[]

  return (
    <PageWrapper className="max-w-2xl">
      <div className="mb-6 border-b border-grey-medium/10 pb-4">
        <h1 className="text-2xl font-bold text-grey-dark">Add New Service</h1>
        <p className="text-sm text-grey">Create a new service for your workshop catalog.</p>
      </div>
      <AdminServiceForm categories={cats} />
    </PageWrapper>
  )
}