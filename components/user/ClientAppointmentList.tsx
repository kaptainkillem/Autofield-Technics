'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  CalendarClock,
  ArrowRight,
  Wrench,
  History,
  Flag,
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { toast } from 'sonner'
import { WorkshopTracker } from '@/components/user/WorkshopTracker'
import { RevisionCard } from '@/components/user/RevisionCard'
import type { WorkOrder } from '@/components/admin/WorkOrderPanel'

export interface Appointment {
  id: string
  scheduled_date: string
  scheduled_time: string | null
  status: string
  service_type: string | null
  notes: string | null
  proposed_date: string | null
  proposed_time: string | null
  proposed_notes: string | null
  quote_id: string | null
  work_orders?: WorkOrder[]
}

interface ClientAppointmentListProps {
  appointments: Appointment[]
}

const ACTIVE_STATUSES = ['pending', 'proposed', 'confirmed']
const HISTORY_STATUSES = ['completed', 'cancelled']

export function ClientAppointmentList({ appointments }: ClientAppointmentListProps) {
  const [filter, setFilter] = useState<string>('active')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [proposalResponses, setProposalResponses] = useState<Record<string, 'accepted' | 'declined'>>({})
  const [rescheduleRequests, setRescheduleRequests] = useState<Set<string>>(new Set())

  const activeAppointments = appointments.filter((a) => ACTIVE_STATUSES.includes(a.status))
  const historyAppointments = appointments.filter((a) => HISTORY_STATUSES.includes(a.status))

  const displayed = filter === 'active'
    ? activeAppointments
    : filter === 'history'
    ? historyAppointments
    : appointments

  async function handleProposalResponse(appointmentId: string, action: 'accept' | 'decline') {
    setProcessingId(appointmentId)
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')

      const response = action === 'accept' ? 'accepted' : 'declined'
      setProposalResponses((prev) => ({ ...prev, [appointmentId]: response }))
      if (action === 'accept') {
        toast.success('New date accepted! Your appointment is confirmed.')
      } else {
        toast.success('Proposal declined. The mechanic will suggest another time.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReschedule(appointmentId: string) {
    if (!confirm('Request a reschedule? The mechanic will propose a new time.')) return

    setProcessingId(appointmentId)
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/reschedule`, {
        method: 'PATCH',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')

      setRescheduleRequests((prev) => new Set(prev).add(appointmentId))
      toast.success('Reschedule requested! The mechanic will propose a new time.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setProcessingId(null)
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  function renderAppointment(appt: Appointment) {
    const proposalResponse = proposalResponses[appt.id]
    const isRescheduleRequested = rescheduleRequests.has(appt.id) || (appt.notes?.includes('[Client requested reschedule]') ?? false)
    const isProposed = appt.status === 'proposed'
    const isConfirmed = appt.status === 'confirmed'
    const isCancelled = appt.status === 'cancelled'

    // Proposal response UI
    if (isProposed && proposalResponse === 'accepted') {
      return (
        <div key={appt.id} className="bg-green-50 border border-green-200 rounded-base p-5">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600" />
            <div>
              <p className="text-sm font-bold text-grey-dark">Appointment Confirmed</p>
              <p className="text-xs text-grey">
                {appt.proposed_date} at {appt.proposed_time?.slice(0, 5)} — We look forward to seeing you!
              </p>
            </div>
          </div>
        </div>
      )
    }

    if (isProposed && proposalResponse === 'declined') {
      return (
        <div key={appt.id} className="bg-amber-50 border border-amber-200 rounded-base p-5">
          <div className="flex items-center gap-3">
            <CalendarClock size={20} className="text-amber-600" />
            <div>
              <p className="text-sm font-bold text-grey-dark">Proposal Declined</p>
              <p className="text-xs text-grey">The mechanic will suggest another time.</p>
            </div>
          </div>
        </div>
      )
    }

    // Reschedule requested UI
    if (isRescheduleRequested) {
      return (
        <div key={appt.id} className="bg-blue-50 border border-blue-200 rounded-base p-5">
          <div className="flex items-center gap-3">
            <CalendarClock size={20} className="text-blue-600" />
            <div>
              <p className="text-sm font-bold text-grey-dark">Reschedule Requested</p>
              <p className="text-xs text-grey">The mechanic will propose a new time.</p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        key={appt.id}
        className={`border rounded-base p-5 ${
          isProposed
            ? 'bg-blue-50 border-blue-200'
            : isConfirmed
            ? 'bg-green-50 border-green-200'
            : isCancelled
            ? 'bg-grey-lightest border-grey-light'
            : 'bg-white border-grey-medium/10'
        }`}
      >
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isProposed ? 'bg-blue-100' : isConfirmed ? 'bg-green-100' : 'bg-grey-lightest'
              }`}>
                {isProposed ? (
                  <CalendarClock size={20} className="text-blue-600" />
                ) : isConfirmed ? (
                  <CheckCircle size={20} className="text-green-600" />
                ) : (
                  <Wrench size={20} className="text-grey" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-grey-dark">
                  {appt.service_type ?? 'General Service'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Calendar size={12} className="text-grey" />
                  <span className="text-xs text-grey">{formatDate(appt.scheduled_date)}</span>
                  {appt.scheduled_time && (
                    <>
                      <Clock size={12} className="text-grey ml-1" />
                      <span className="text-xs text-grey">{appt.scheduled_time.slice(0, 5)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <StatusBadge status={appt.status} />
          </div>

          {/* Workshop tracker / revision / completion */}
          {appt.work_orders && appt.work_orders.length > 0 && (
            <div className="mt-1">
              {appt.work_orders[0].status === 'revision_pending' ? (
                <>
                  <WorkshopTracker workOrder={appt.work_orders[0]} />
                  <div className="mt-3">
                    <RevisionCard workOrder={appt.work_orders[0]} />
                  </div>
                </>
              ) : appt.status === 'completed' ? (
                <div className="bg-green-50 border border-green-200 rounded-base p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                    <Flag size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-grey-dark">Job Completed</p>
                    <p className="text-xs text-grey">
                      This job is closed and recorded in your digital service history.
                    </p>
                  </div>
                </div>
              ) : (
                <WorkshopTracker workOrder={appt.work_orders[0]} />
              )}
            </div>
          )}

          {/* Notes */}
          {appt.notes && (
            <p className="text-xs text-grey italic border-t border-grey-light pt-2">
              {appt.notes}
            </p>
          )}

          {/* Proposed date UI */}
          {isProposed && (
            <div className="bg-white rounded-base border border-blue-100 p-4 mt-1">
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-2">
                Proposed New Date
              </p>
              <div className="flex items-center gap-4">
                <div className="text-center flex-1">
                  <p className="text-xs text-grey">Original</p>
                  <p className="text-sm text-grey line-through">{formatDate(appt.scheduled_date)}</p>
                </div>
                <ArrowRight size={16} className="text-grey-medium" />
                <div className="text-center flex-1">
                  <p className="text-xs text-blue-600 font-bold">New Date</p>
                  <p className="text-lg font-bold text-grey-dark">{appt.proposed_date}</p>
                  <p className="text-sm text-grey">{appt.proposed_time?.slice(0, 5)}</p>
                </div>
              </div>
              {appt.proposed_notes && (
                <p className="text-xs text-grey mt-3 pt-3 border-t border-grey-light text-center italic">
                  &ldquo;{appt.proposed_notes}&rdquo;
                </p>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleProposalResponse(appt.id, 'accept')}
                  disabled={processingId === appt.id}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-base transition-all disabled:opacity-50"
                >
                  {processingId === appt.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <CheckCircle size={12} />
                  )}
                  Accept New Date
                </button>
                <button
                  onClick={() => handleProposalResponse(appt.id, 'decline')}
                  disabled={processingId === appt.id}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-base transition-all disabled:opacity-50"
                >
                  <XCircle size={12} />
                  Decline
                </button>
              </div>
            </div>
          )}

          {/* Actions row */}
          <div className="flex items-center gap-2 pt-1">
            {isConfirmed && (
              <button
                onClick={() => handleReschedule(appt.id)}
                disabled={processingId === appt.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-grey-medium/20 text-grey-dark hover:bg-grey-lightest text-xs font-semibold rounded-base transition-all disabled:opacity-50"
              >
                {processingId === appt.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <CalendarClock size={12} />
                )}
                Reschedule
              </button>
            )}
            {appt.quote_id && (
              <Link
                href={`/quote/${appt.quote_id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-grey-medium/20 text-grey-dark hover:bg-grey-lightest text-xs font-semibold rounded-base transition-all no-underline"
              >
                View Quote
                <ArrowRight size={12} />
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  const pendingCount = activeAppointments.filter((a) => a.status === 'pending').length
  const proposedCount = activeAppointments.filter((a) => a.status === 'proposed').length
  const confirmedCount = activeAppointments.filter((a) => a.status === 'confirmed').length

  return (
    <div className="flex flex-col gap-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1.5 rounded-base text-xs font-semibold transition-all ${
            filter === 'active'
              ? 'bg-primary text-white'
              : 'bg-white text-grey border border-grey-medium/20 hover:bg-grey-lightest'
          }`}
        >
          Active ({activeAppointments.length})
        </button>
        <button
          onClick={() => setFilter('history')}
          className={`px-3 py-1.5 rounded-base text-xs font-semibold transition-all ${
            filter === 'history'
              ? 'bg-primary text-white'
              : 'bg-white text-grey border border-grey-medium/20 hover:bg-grey-lightest'
          }`}
        >
          <span className="inline-flex items-center gap-1">
            <History size={12} />
            History ({historyAppointments.length})
          </span>
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-base text-xs font-semibold transition-all ${
            filter === 'all'
              ? 'bg-primary text-white'
              : 'bg-white text-grey border border-grey-medium/20 hover:bg-grey-lightest'
          }`}
        >
          All ({appointments.length})
        </button>

        {/* Quick stats */}
        <div className="ml-auto flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
              {pendingCount} pending
            </span>
          )}
          {proposedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
              {proposedCount} proposed
            </span>
          )}
          {confirmedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
              {confirmedCount} confirmed
            </span>
          )}
        </div>
      </div>

      {/* Appointment list */}
      {displayed.length === 0 ? (
        <div className="text-center py-12 text-grey bg-white border border-dashed rounded-base">
          <Calendar size={32} className="mx-auto mb-2 text-grey-medium" />
          <p className="font-semibold text-sm">
            {filter === 'active' ? 'No active appointments.' : filter === 'history' ? 'No past appointments.' : 'No appointments found.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {displayed.map((appt) => renderAppointment(appt))}
        </div>
      )}
    </div>
  )
}
