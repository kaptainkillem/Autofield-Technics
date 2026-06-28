'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar as CalendarIcon, List, Loader2 } from 'lucide-react'
import { CalendarGrid } from '@/components/admin/CalendarGrid'
import { JobsTable } from '@/components/admin/JobsTable'
import { CreateAppointmentModal } from '@/components/admin/CreateAppointmentModal'
import { EditAppointmentModal } from '@/components/admin/EditAppointmentModal'

type Appointment = {
  id: string
  scheduled_date: string
  scheduled_time: string | null
  status: string
  service_type?: string
  notes?: string | null
  customer_name?: string
}

type BlockedSlot = {
  id: string
  start_datetime: string
  end_datetime: string
  reason: string | null
}

export default function AdminJobsPage() {
  const [view, setView] = useState<'list' | 'calendar'>('calendar')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  async function fetchData() {
    setLoading(true)

    const [apptsRes, blockedRes] = await Promise.all([
      (supabase as any)
        .from('appointments')
        .select('id, scheduled_date, scheduled_time, status, service_type, notes, duration_minutes')
        .order('scheduled_date', { ascending: true }),
      (supabase as any)
        .from('blocked_slots')
        .select('id, start_datetime, end_datetime, reason')
        .order('start_datetime', { ascending: true }),
    ])

    if (apptsRes.error) {
      console.error('Fetch appointments error:', apptsRes.error)
    } else {
      setAppointments(apptsRes.data ?? [])
    }

    if (blockedRes.error) {
      console.error('Fetch blocked slots error:', blockedRes.error)
    } else {
      setBlockedSlots(blockedRes.data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  function handleDateClick(date: Date) {
    setSelectedDate(date)
  }

  function handleAppointmentClick(appt: any) {
    setSelectedAppointment(appt)
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-[1600px] mx-auto w-full mt-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-grey-dark">Active Mechanical Jobs</h1>
          <p className="text-sm text-grey">
            {view === 'calendar'
              ? 'View and manage appointments on the calendar.'
              : 'Track and manage repair jobs, assign mechanics, and update job statuses.'}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-white border border-grey-medium/10 rounded-base p-1 shadow-sm">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-base text-sm font-semibold transition-all cursor-pointer ${
              view === 'list'
                ? 'bg-primary text-white shadow-sm'
                : 'text-grey hover:bg-primary/5 hover:text-grey-dark'
            }`}
          >
            <List size={16} />
            List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-base text-sm font-semibold transition-all cursor-pointer ${
              view === 'calendar'
                ? 'bg-primary text-white shadow-sm'
                : 'text-grey hover:bg-primary/5 hover:text-grey-dark'
            }`}
          >
            <CalendarIcon size={16} />
            Calendar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
        {view === 'list' ? (
          <JobsTable appointments={appointments} />
        ) : (
          <CalendarGrid
            appointments={appointments}
            blockedSlots={blockedSlots}
            view="month"
            onDateClick={handleDateClick}
            onAppointmentClick={handleAppointmentClick}
          />
        )}
      </div>

      {/* Modals */}
      <CreateAppointmentModal
        date={selectedDate}
        onClose={() => setSelectedDate(null)}
        onSuccess={fetchData}
      />
      <EditAppointmentModal
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onSuccess={fetchData}
      />
    </div>
  )
}
