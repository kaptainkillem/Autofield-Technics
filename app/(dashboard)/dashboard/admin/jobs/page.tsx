import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { Database } from '@/types/database'
import { JobsTable } from '@/components/admin/JobsTable'

type AppointmentRow = Database['public']['Tables']['appointments']['Row']

export const dynamic = 'force-dynamic'

export default async function AdminJobsPage() {
  const supabase = createSupabaseAdminClient()

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .order('scheduled_date', { ascending: true })

  const items = (appointments ?? []) as AppointmentRow[]

  return (
    <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm max-w-[1600px] mx-auto w-full mt-4">
      <div className="mb-6 border-b border-grey-light pb-3">
        <h1 className="text-2xl font-bold text-grey-dark">Active Mechanical Jobs</h1>
        <p className="text-sm text-grey">Track and manage repair jobs, assign mechanics, and update job statuses.</p>
      </div>
      <JobsTable appointments={items} />
    </div>
  )
}