import { createSupabaseServerClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import { Wrench, ArrowRight, Calendar, Clock, User } from 'lucide-react'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'

interface UpcomingJob {
  id: string
  scheduled_date: string
  scheduled_time: string | null
  status: string
  service_type: string | null
  notes: string | null
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-primary-light text-primary-dark border-primary/20',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-grey-light text-grey-medium border-grey-light',
}

function formatDateTime(dateStr: string, timeStr: string | null): string {
  const date = parseISO(dateStr)

  let dateLabel: string
  if (isToday(date)) {
    dateLabel = 'Today'
  } else if (isTomorrow(date)) {
    dateLabel = 'Tomorrow'
  } else {
    dateLabel = format(date, 'EEE, dd MMM')
  }

  const timeLabel = timeStr ? timeStr.slice(0, 5) : ''
  return timeLabel ? `${dateLabel} at ${timeLabel}` : dateLabel
}

export async function UpcomingJobsWidget() {
  const supabase = await createSupabaseServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  const workshopId = session ? (() => {
    try {
      const payload = JSON.parse(atob(session.access_token.split('.')[1]))
      return payload?.app_metadata?.workshop_id as string | null
    } catch { return null }
  })() : null

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const { data: jobs } = await supabase
    .from('appointments')
    .select('id, scheduled_date, scheduled_time, status, service_type, notes')
    .eq('workshop_id', workshopId as string)
    .gte('scheduled_date', todayStr)
    .neq('status', 'cancelled')
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true })
    .limit(5)

  const upcomingJobs = (jobs ?? []) as UpcomingJob[]

  return (
    <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-grey-light pb-3">
        <div>
          <h2 className="text-lg font-bold text-grey-dark">Upcoming Jobs</h2>
          <p className="text-xs text-grey">Next 5 scheduled appointments</p>
        </div>
        <Link
          href="/dashboard/admin/jobs"
          className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline no-underline"
        >
          <span>View Calendar</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Jobs List */}
      {upcomingJobs.length === 0 ? (
        <div className="text-center py-8 text-grey">
          <Wrench size={24} className="mx-auto mb-2 text-grey-medium" />
          <p className="text-sm font-medium">No upcoming jobs</p>
          <p className="text-xs text-grey-medium mt-1">Appointments will appear here once scheduled.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {upcomingJobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between p-3 rounded-base border border-grey-light/50 bg-grey-lightest/30 hover:bg-grey-lightest transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Date/Time */}
                <div className="flex flex-col gap-0.5 shrink-0 w-[130px]">
                  <span className="text-xs font-semibold text-grey-dark flex items-center gap-1">
                    <Calendar size={10} className="text-primary" />
                    {formatDateTime(job.scheduled_date, job.scheduled_time)}
                  </span>
                </div>

                {/* Service & Customer */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-semibold text-grey-dark truncate">
                    {job.service_type ?? 'Unnamed Service'}
                  </span>
                  {job.notes && (
                    <span className="text-[10px] text-grey-medium truncate">{job.notes}</span>
                  )}
                </div>
              </div>

              {/* Status Pill */}
              <span
                className={`text-[10px] px-2 py-0.5 rounded border font-semibold capitalize shrink-0 ${
                  STATUS_COLORS[job.status] ?? STATUS_COLORS.pending
                }`}
              >
                {job.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
