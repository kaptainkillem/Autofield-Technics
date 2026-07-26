import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { Database } from '@/types/database'
import { notFound } from 'next/navigation'
import AdminServiceForm from '@/app/(dashboard)/dashboard/admin/services/new/AdminServiceForm'
import { PageWrapper } from '@/components/layout/PageWrapper'

type ServiceRow = Database['public']['Tables']['services']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']

interface PageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function EditServicePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const workshopId = (() => {
    try {
      const payload = JSON.parse(atob(session!.access_token.split('.')[1]))
      return payload?.app_metadata?.workshop_id as string
    } catch { return '' }
  })()

  const [{ data: service }, { data: categories }] = await Promise.all([
    supabase.from('services').select('*').eq('id', id).eq('workshop_id', workshopId).single(),
    supabase.from('categories').select('*').eq('workshop_id', workshopId).order('display_order', { ascending: true }),
  ])

  if (!service) notFound()

  const svc = service as ServiceRow
  const cats = (categories ?? []) as CategoryRow[]

  return (
    <PageWrapper className="max-w-2xl">
      <div className="mb-6 border-b border-grey-medium/10 pb-4">
        <h1 className="text-2xl font-bold text-grey-dark">Edit Service</h1>
        <p className="text-sm text-grey">Update details for <strong>{svc.name}</strong>.</p>
      </div>
      <AdminServiceForm service={svc} categories={cats} />
    </PageWrapper>
  )
}