import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { Database } from '@/types/database'
import { SITE_CONFIG } from '@/lib/site-config'
import AdminServiceForm from './AdminServiceForm'
import { PageWrapper } from '@/components/layout/PageWrapper'

type CategoryRow = Database['public']['Tables']['categories']['Row']

export const dynamic = 'force-dynamic'

export default async function NewServicePage() {
  const supabase = await createSupabaseServerClient()
  const { data: categories } = await supabase.from('categories').select('*').order('display_order', { ascending: true })
  const cats = (categories ?? []) as CategoryRow[]

  return (
    <PageWrapper className="max-w-2xl">
      <div className="mb-6 border-b border-grey-medium/10 pb-4">
        <h1 className="text-2xl font-bold text-grey-dark">Add New Service</h1>
        <p className="text-sm text-grey">Create a new service for your {SITE_CONFIG.name} catalog.</p>
      </div>
      <AdminServiceForm categories={cats} />
    </PageWrapper>
  )
}