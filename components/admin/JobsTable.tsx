'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Wrench, CheckCircle, XCircle, Calendar, Loader2, CalendarClock, Play, Settings2 } from 'lucide-react'
import { TableSearch } from '@/components/ui/TableSearch'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProposeDateModal } from '@/components/admin/ProposeDateModal'
import { WorkOrderPanel, type WorkOrder } from '@/components/admin/WorkOrderPanel'
import { toast } from 'sonner'

interface AppointmentRow {
  id: string
  scheduled_date: string
  scheduled_time: string | null
  status: string
  service_type?: string
  notes?: string | null
  customer_name?: string
  proposed_date?: string | null
  proposed_time?: string | null
  proposed_notes?: string | null
  quote_id?: string | null
  work_orders?: WorkOrder[]
}

interface JobsTableProps {
  appointments: AppointmentRow[]
  onUpdate?: () => void
}

const STATUS_FILTERS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Proposed', value: 'proposed' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

export function JobsTable({ appointments, onUpdate }: JobsTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [proposeModalOpen, setProposeModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRow | null>(null)
  const [workOrderPanelOpen, setWorkOrderPanelOpen] = useState(false)
  const [selectedWorkOrderAppointment, setSelectedWorkOrderAppointment] = useState<AppointmentRow | null>(null)

  const pendingCount = appointments.filter((j) => j.status === 'pending').length
  const proposedCount = appointments.filter((j) => j.status === 'proposed').length
  const confirmedCount = appointments.filter((j) => j.status === 'confirmed').length
  const completedCount = appointments.filter((j) => j.status === 'completed').length

  const filtered = appointments.filter((job) => {
    const term = search.toLowerCase()
    const matchesSearch =
      (job.service_type ?? '').toLowerCase().includes(term) ||
      (job.notes ?? '').toLowerCase().includes(term)

    const matchesFilter = statusFilter === '' || job.status === statusFilter

    return matchesSearch && matchesFilter
  })

  async function handleApprove(id: string) {
    setProcessingId(id)
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      })

      const data = await res.json()
      setProcessingId(null)

      if (!res.ok) {
        toast.error(data.error || 'Failed to approve appointment')
        return
      }

      toast.success('Appointment approved!')
      onUpdate?.()
    } catch {
      setProcessingId(null)
      toast.error('Network error. Please try again.')
    }
  }

  async function handleDecline(id: string) {
    if (!confirm('Are you sure you want to decline this appointment?')) return

    setProcessingId(id)
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })

      const data = await res.json()
      setProcessingId(null)

      if (!res.ok) {
        toast.error(data.error || 'Failed to decline appointment')
        return
      }

      toast.success('Appointment declined')
      onUpdate?.()
    } catch {
      setProcessingId(null)
      toast.error('Network error. Please try again.')
    }
  }

  function handlePropose(appointment: AppointmentRow) {
    setSelectedAppointment(appointment)
    setProposeModalOpen(true)
  }

  function handleManageWorkOrder(appointment: AppointmentRow) {
    setSelectedWorkOrderAppointment(appointment)
    setWorkOrderPanelOpen(true)
  }

  async function handleStartJob(appointment: AppointmentRow) {
    setProcessingId(appointment.id)
    try {
      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: appointment.id }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to start work order')
        return
      }

      toast.success('Work order started. Vehicle checked in.')
      onUpdate?.()
      handleManageWorkOrder({ ...appointment, work_orders: [data.workOrder] })
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setProcessingId(null)
    }
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-16 text-grey bg-white border border-dashed rounded-base">
        <Wrench size={32} className="mx-auto mb-2 text-grey-medium" />
        <p className="font-semibold">No active jobs right now.</p>
        <p className="text-sm text-grey-medium mt-1">Confirmed quote requests will appear here as jobs.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="bg-amber-50 text-amber-600 border border-amber-200 rounded-base px-3 py-1 text-xs font-bold">{pendingCount} Pending</span>
            {proposedCount > 0 && (
              <span className="bg-blue-50 text-blue-600 border border-blue-200 rounded-base px-3 py-1 text-xs font-bold">{proposedCount} Proposed</span>
            )}
            <span className="bg-primary/10 text-primary border border-primary/20 rounded-base px-3 py-1 text-xs font-bold">{confirmedCount} Confirmed</span>
            <span className="bg-success/10 text-success border border-success/20 rounded-base px-3 py-1 text-xs font-bold">{completedCount} Completed</span>
          </div>
          <div className="w-full sm:max-w-xs">
            <TableSearch
              placeholder="Search by service type or notes..."
              value={search}
              onChange={setSearch}
              filters={STATUS_FILTERS}
              filterValue={statusFilter}
              onFilterChange={setStatusFilter}
              filterLabel="Status"
            />
          </div>
        </div>

        <div className="border border-grey-medium/10 rounded-base overflow-hidden">
          <div className="p-4 border-b border-grey-medium/20 bg-white flex items-center justify-between">
            <span className="text-sm font-semibold text-grey-dark">All jobs</span>
            <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
              {filtered.length} shown
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-grey-medium/20 text-grey uppercase tracking-wider text-xs bg-white">
                  <th className="py-3 px-4 font-bold">Service Type</th>
                  <th className="py-3 px-4 font-bold">Scheduled Date</th>
                  <th className="py-3 px-4 font-bold">Time</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Workshop</th>
                  <th className="py-3 px-4 font-bold">Notes</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-light">
                {filtered.map((job) => (
                  <tr key={job.id} className="hover:bg-primary/5 transition-colors">
                    <td className="py-4 px-4 font-medium text-grey-dark">
                      <div className="flex items-center gap-2">
                        <Wrench size={14} className="text-primary" />
                        {job.service_type}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-grey-dark text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(job.scheduled_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      {job.status === 'proposed' && job.proposed_date && (
                        <div className="flex items-center gap-1 mt-1 text-blue-600">
                          <CalendarClock size={12} />
                          <span className="font-semibold">
                            Proposed: {new Date(job.proposed_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-grey text-xs">
                      {job.scheduled_time}
                      {job.status === 'proposed' && job.proposed_time && (
                        <div className="text-blue-600 font-semibold mt-1">
                          {job.proposed_time}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={job.status ?? 'pending'} />
                    </td>
                    <td className="py-4 px-4">
                      {job.work_orders && job.work_orders.length > 0 ? (
                        <button
                          onClick={() => handleManageWorkOrder(job)}
                          className="hover:opacity-80 transition-opacity"
                        >
                          <StatusBadge status={job.work_orders[0].status} />
                        </button>
                      ) : job.status === 'confirmed' ? (
                        <span className="text-xs text-grey italic">Not started</span>
                      ) : (
                        <span className="text-xs text-grey">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-grey text-xs max-w-xs truncate">
                      {job.status === 'proposed' && job.proposed_notes ? (
                        <span className="text-blue-600 italic">&ldquo;{job.proposed_notes}&rdquo;</span>
                      ) : job.status === 'pending' && job.notes?.includes('[Client requested reschedule]') ? (
                        <span className="text-amber-600 font-semibold">Reschedule requested</span>
                      ) : (
                        job.notes ?? '—'
                      )}
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      {job.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDecline(job.id)}
                            disabled={processingId === job.id}
                            aria-disabled={processingId === job.id}
                            aria-busy={processingId === job.id}
                            className="inline-flex items-center gap-1 bg-white text-grey border border-grey-medium/20 text-xs px-2.5 py-1.5 rounded-base font-semibold hover:bg-grey-lightest transition disabled:opacity-50"
                          >
                            {processingId === job.id ? <Loader2 size={10} className="animate-spin" /> : <XCircle size={10} />}
                            Decline
                          </button>
                          <button
                            onClick={() => handlePropose(job)}
                            className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs px-2.5 py-1.5 rounded-base font-bold hover:bg-blue-700 transition"
                          >
                            <CalendarClock size={10} />
                            Propose
                          </button>
                          <button
                            onClick={() => handleApprove(job.id)}
                            disabled={processingId === job.id}
                            aria-disabled={processingId === job.id}
                            aria-busy={processingId === job.id}
                            className="inline-flex items-center gap-1 bg-green-600 text-white text-xs px-2.5 py-1.5 rounded-base font-bold hover:bg-green-700 transition disabled:opacity-50"
                          >
                            {processingId === job.id ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={10} />}
                            Approve
                          </button>
                        </div>
                      ) : job.status === 'proposed' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDecline(job.id)}
                            disabled={processingId === job.id}
                            className="inline-flex items-center gap-1 bg-white text-grey border border-grey-medium/20 text-xs px-2.5 py-1.5 rounded-base font-semibold hover:bg-grey-lightest transition disabled:opacity-50"
                          >
                            <XCircle size={10} />
                            Cancel
                          </button>
                          <button
                            onClick={() => handlePropose(job)}
                            className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs px-2.5 py-1.5 rounded-base font-bold hover:bg-blue-700 transition"
                          >
                            <CalendarClock size={10} />
                            New Date
                          </button>
                          <button
                            onClick={() => handleApprove(job.id)}
                            disabled={processingId === job.id}
                            className="inline-flex items-center gap-1 bg-green-600 text-white text-xs px-2.5 py-1.5 rounded-base font-bold hover:bg-green-700 transition disabled:opacity-50"
                          >
                            <CheckCircle size={10} />
                            Approve
                          </button>
                        </div>
                      ) : job.status === 'confirmed' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDecline(job.id)}
                            disabled={processingId === job.id}
                            className="inline-flex items-center gap-1 bg-white text-grey border border-grey-medium/20 text-xs px-2.5 py-1.5 rounded-base font-semibold hover:bg-grey-lightest transition disabled:opacity-50"
                          >
                            <XCircle size={10} />
                            Cancel
                          </button>
                          <button
                            onClick={() => handlePropose(job)}
                            className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs px-2.5 py-1.5 rounded-base font-bold hover:bg-blue-700 transition"
                          >
                            <CalendarClock size={10} />
                            Reschedule
                          </button>
                          {job.work_orders && job.work_orders.length > 0 ? (
                            <button
                              onClick={() => handleManageWorkOrder(job)}
                              className="inline-flex items-center gap-1 bg-primary text-white text-xs px-2.5 py-1.5 rounded-base font-bold hover:bg-primary-dark transition"
                            >
                              <Settings2 size={10} />
                              Manage
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartJob(job)}
                              disabled={processingId === job.id}
                              className="inline-flex items-center gap-1 bg-green-600 text-white text-xs px-2.5 py-1.5 rounded-base font-bold hover:bg-green-700 transition disabled:opacity-50"
                            >
                              {processingId === job.id ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
                              Start Job
                            </button>
                          )}
                          <Link
                            href={`/dashboard/admin/quotes?highlight=${job.quote_id ?? ''}`}
                            className="inline-flex items-center gap-1.5 bg-primary text-white text-xs px-2.5 py-1.5 rounded-base font-bold no-underline hover:bg-primary-dark transition shadow-sm"
                          >
                            View Quote
                            <ArrowRight size={10} />
                          </Link>
                        </div>
                      ) : (
                        <Link
                          href={`/dashboard/admin/quotes?highlight=${job.quote_id ?? ''}`}
                          className="inline-flex items-center gap-1.5 bg-primary text-white text-xs px-3 py-2 rounded-base font-bold no-underline hover:bg-primary-dark transition shadow-sm"
                        >
                          View Quote
                          <ArrowRight size={12} />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Propose Date Modal */}
      {selectedAppointment && (
        <ProposeDateModal
          isOpen={proposeModalOpen}
          onClose={() => {
            setProposeModalOpen(false)
            setSelectedAppointment(null)
          }}
          appointment={selectedAppointment}
          onSuccess={() => {
            setProposeModalOpen(false)
            setSelectedAppointment(null)
            onUpdate?.()
          }}
        />
      )}

      {/* Work Order Panel */}
      {selectedWorkOrderAppointment && selectedWorkOrderAppointment.work_orders && selectedWorkOrderAppointment.work_orders.length > 0 && (
        <WorkOrderPanel
          isOpen={workOrderPanelOpen}
          onClose={() => {
            setWorkOrderPanelOpen(false)
            setSelectedWorkOrderAppointment(null)
          }}
          workOrder={selectedWorkOrderAppointment.work_orders[0]}
          appointment={selectedWorkOrderAppointment}
          onUpdate={() => {
            onUpdate?.()
          }}
        />
      )}
    </>
  )
}
