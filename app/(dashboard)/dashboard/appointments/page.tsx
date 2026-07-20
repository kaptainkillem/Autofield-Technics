import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ClientAppointmentList, type Appointment } from '@/components/user/ClientAppointmentList'

export const dynamic = 'force-dynamic'

export default async function AppointmentsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  const adminClient = await createSupabaseServerClient()

  const { data: appointments } = await adminClient
    .from('appointments')
    .select('id, scheduled_date, scheduled_time, status, service_type, notes, proposed_date, proposed_time, proposed_notes, quote_id, work_orders(*)')
    .eq('user_id', user.id)
    .order('scheduled_date', { ascending: false })
    .order('scheduled_time', { ascending: true })

  return (
    <PageWrapper>
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
        <div className="mb-6 border-b border-grey-light pb-3">
          <h1 className="text-2xl font-bold text-grey-dark">My Appointments</h1>
          <p className="text-sm text-grey">
            View and manage your service appointments. Accept proposed dates or request reschedules.
          </p>
        </div>
        <ClientAppointmentList appointments={(appointments ?? []) as Appointment[]} />
      </div>
    </PageWrapper>
  )
}
