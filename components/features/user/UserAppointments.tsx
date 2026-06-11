import { createSupabaseServerClient } from '@/lib/supabaseServer'

interface Props { userId: string }

type Appointment = {
  id: string
  service_type: string
  scheduled_date: string
  scheduled_time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes: string | null
}

const statusColors: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export async function UserAppointments({ userId }: Props) {
  const supabase = await createSupabaseServerClient()

  const today = new Date().toISOString().split('T')[0] // 'YYYY-MM-DD'

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, service_type, scheduled_date, scheduled_time, status, notes')
    .eq('user_id', userId)
    .in('status', ['pending', 'confirmed'])
    .gte('scheduled_date', today)
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true })
    .limit(5) as { data: Appointment[] | null }

  if (!appointments?.length) {
    return (
      <div className="bg-white rounded-base shadow-base px-6 py-10 text-center text-grey text-sm">
        No upcoming appointments.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-base shadow-base divide-y divide-grey-medium/20">
      {appointments.map((a) => {
        const date = new Date(`${a.scheduled_date}T${a.scheduled_time}`)
        return (
          <div key={a.id} className="px-6 py-4 flex gap-4 items-start">
            {/* Date badge */}
            <div className="flex-shrink-0 text-center bg-grey-lightest rounded-base px-3 py-2 min-w-[52px]">
              <p className="text-xs text-grey uppercase font-semibold tracking-wide">
                {date.toLocaleDateString('en-ZA', { month: 'short' })}
              </p>
              <p className="text-xl font-bold text-black leading-tight">
                {date.getDate()}
              </p>
            </div>

            {/* Details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm text-black">{a.service_type}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[a.status]}`}>
                  {a.status}
                </span>
              </div>
              <p className="text-xs text-grey mt-0.5">
                {date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                {a.notes ? ` · ${a.notes}` : ''}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}