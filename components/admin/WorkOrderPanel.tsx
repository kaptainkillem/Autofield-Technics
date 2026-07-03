'use client'

import { useState, useCallback } from 'react'
import {
  X,
  ClipboardCheck,
  Wrench,
  Package,
  FileQuestion,
  CheckCircle,
  Flag,
  Loader2,
  Save,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AdditionalWorkModal } from '@/components/admin/AdditionalWorkModal'

interface WorkOrderLineItem {
  id: string
  name: string
  qty: number
  unitPrice: number
}

interface WorkOrderEvent {
  id: string
  event_type: string
  old_status?: string | null
  new_status?: string | null
  notes?: string | null
  created_at: string
}

export interface WorkOrder {
  id: string
  quote_id: string
  appointment_id?: string | null
  status: string
  mechanic_notes?: string | null
  client_visible_notes?: string | null
  additional_work_items: WorkOrderLineItem[] | null
  additional_work_total: number
  revision_approved?: boolean | null
  revision_responded_at?: string | null
  started_at?: string | null
  completed_at?: string | null
  created_at: string
  updated_at: string
  work_order_events?: WorkOrderEvent[]
}

interface AppointmentRow {
  id: string
  scheduled_date: string
  scheduled_time?: string | null
  status: string
  service_type?: string
  customer_name?: string
}

interface WorkOrderPanelProps {
  isOpen: boolean
  onClose: () => void
  workOrder: WorkOrder
  appointment: AppointmentRow
  onUpdate: () => void
}

const STATUS_FLOW = [
  { key: 'checked_in', label: 'Checked In', icon: ClipboardCheck },
  { key: 'in_progress', label: 'In Progress', icon: Wrench },
  { key: 'awaiting_parts', label: 'Awaiting Parts', icon: Package },
  { key: 'revision_pending', label: 'Revision Pending', icon: FileQuestion },
  { key: 'ready_for_pickup', label: 'Ready for Pickup', icon: CheckCircle },
  { key: 'completed', label: 'Completed', icon: Flag },
]

function formatCurrency(amount: number): string {
  return `R${amount.toFixed(2)}`
}

export function WorkOrderPanel({ isOpen, onClose, workOrder, appointment, onUpdate }: WorkOrderPanelProps) {
  const [mechanicNotes, setMechanicNotes] = useState(workOrder.mechanic_notes ?? '')
  const [clientNotes, setClientNotes] = useState(workOrder.client_visible_notes ?? '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [transitioning, setTransitioning] = useState<string | null>(null)
  const [showRevisionModal, setShowRevisionModal] = useState(false)

  const handleStatusChange = useCallback(async (newStatus: string, clientVisibleNotes?: string) => {
    setTransitioning(newStatus)
    try {
      const res = await fetch(`/api/work-orders/${workOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          mechanic_notes: mechanicNotes,
          client_visible_notes: clientVisibleNotes ?? clientNotes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to update status')
        return
      }

      toast.success(data.message || 'Status updated')
      onUpdate()
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setTransitioning(null)
    }
  }, [workOrder.id, mechanicNotes, clientNotes, onUpdate])

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      const res = await fetch(`/api/work-orders/${workOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: workOrder.status,
          mechanic_notes: mechanicNotes,
          client_visible_notes: clientNotes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to save notes')
        return
      }

      toast.success('Notes saved')
      onUpdate()
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSavingNotes(false)
    }
  }

  const renderActionButtons = () => {
    const status = workOrder.status

    if (status === 'completed') {
      return (
        <p className="text-sm text-grey italic">This job is completed. No further actions available.</p>
      )
    }

    const buttons: { label: string; status?: string; action?: 'revision'; variant: 'primary' | 'secondary' | 'warning' | 'success' }[] = []

    if (status === 'checked_in') {
      buttons.push({ label: 'Begin Work', status: 'in_progress', variant: 'primary' })
    } else if (status === 'in_progress') {
      buttons.push({ label: 'Awaiting Parts', status: 'awaiting_parts', variant: 'warning' })
      buttons.push({ label: 'Ready for Pickup', status: 'ready_for_pickup', variant: 'success' })
      buttons.push({ label: 'Request Additional Work', action: 'revision', variant: 'secondary' })
    } else if (status === 'awaiting_parts') {
      buttons.push({ label: 'Parts Arrived', status: 'in_progress', variant: 'primary' })
    } else if (status === 'ready_for_pickup') {
      buttons.push({ label: 'Complete Job', status: 'completed', variant: 'success' })
      buttons.push({ label: 'Back to Work', status: 'in_progress', variant: 'secondary' })
    } else if (status === 'revision_pending') {
      buttons.push({ label: 'Cancel Revision', status: 'in_progress', variant: 'secondary' })
    }

    const variantClasses = {
      primary: 'bg-primary text-white hover:bg-primary-dark',
      secondary: 'bg-white text-grey-dark border border-grey-medium/20 hover:bg-grey-lightest',
      warning: 'bg-amber-500 text-white hover:bg-amber-600',
      success: 'bg-green-600 text-white hover:bg-green-700',
    }

    return (
      <div className="flex flex-wrap gap-2">
        {buttons.map((btn) => (
          <button
            key={btn.label}
            onClick={() => {
              if (btn.action === 'revision') {
                setShowRevisionModal(true)
              } else if (btn.status) {
                handleStatusChange(btn.status)
              }
            }}
            disabled={transitioning === btn.status}
            className={`px-4 py-2 rounded-base text-sm font-semibold transition-all flex items-center gap-2 ${variantClasses[btn.variant]}`}
          >
            {transitioning === btn.status ? <Loader2 size={14} className="animate-spin" /> : null}
            {btn.label}
          </button>
        ))}
      </div>
    )
  }

  const additionalItems = workOrder.additional_work_items ?? []
  const hasRevision = additionalItems.length > 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-base shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-grey-medium/20">
          <div>
            <h2 className="text-lg font-bold text-grey-dark">Work Order</h2>
            <p className="text-xs text-grey mt-0.5">
              {appointment.customer_name ?? 'Customer'} — {appointment.service_type ?? 'Service'} on {appointment.scheduled_date}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={workOrder.status} />
            <button onClick={onClose} className="text-grey hover:text-grey-dark transition-colors p-1">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-6">
          {/* Status Timeline */}
          <div>
            <h3 className="text-sm font-semibold text-grey-dark mb-3">Job Progress</h3>
            <div className="flex items-start justify-between">
              {STATUS_FLOW.map((step, idx) => {
                const Icon = step.icon
                const currentIdx = STATUS_FLOW.findIndex((s) => s.key === workOrder.status)
                const isActive = idx <= currentIdx
                const isCurrent = idx === currentIdx

                return (
                  <div key={step.key} className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                        isCurrent
                          ? 'bg-primary text-white border-primary'
                          : isActive
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-grey-lightest text-grey border-grey-light'
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <span
                      className={`text-[10px] font-semibold text-center leading-tight ${
                        isCurrent ? 'text-primary' : isActive ? 'text-grey-dark' : 'text-grey'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-grey-lightest rounded-base p-4">
            <h3 className="text-sm font-semibold text-grey-dark mb-3">Actions</h3>
            {renderActionButtons()}
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-grey-dark">Internal Mechanic Notes</label>
              <textarea
                value={mechanicNotes}
                onChange={(e) => setMechanicNotes(e.target.value)}
                placeholder="Notes for the shop floor..."
                rows={4}
                className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-grey-dark">Client-Visible Notes</label>
              <textarea
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="This note will be shown to the customer..."
                rows={4}
                className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="self-start bg-white text-grey-dark border border-grey-medium/20 hover:bg-grey-lightest font-semibold py-2 px-4 rounded-base text-sm flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {savingNotes ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Notes
          </button>

          {/* Additional Work */}
          {hasRevision && (
            <div className="border border-grey-medium/20 rounded-base p-4">
              <h3 className="text-sm font-semibold text-grey-dark mb-3 flex items-center gap-2">
                <Plus size={16} className="text-primary" />
                Additional Work
              </h3>

              <table className="w-full text-sm mb-3">
                <thead className="text-left text-grey border-b border-grey-light">
                  <tr>
                    <th className="py-2 font-medium">Item</th>
                    <th className="py-2 font-medium">Qty</th>
                    <th className="py-2 font-medium text-right">Unit</th>
                    <th className="py-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {additionalItems.map((item) => (
                    <tr key={item.id} className="border-b border-grey-light/50">
                      <td className="py-2 text-grey-dark">{item.name}</td>
                      <td className="py-2 text-grey-dark">{item.qty}</td>
                      <td className="py-2 text-grey text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2 text-grey text-right">{formatCurrency(item.qty * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between text-sm">
                <span className="text-grey">Total additional:</span>
                <span className="font-bold text-grey-dark">{formatCurrency(workOrder.additional_work_total)}</span>
              </div>

              {workOrder.revision_approved === null && (
                <p className="text-xs text-amber-600 mt-2">Waiting for client response.</p>
              )}
              {workOrder.revision_approved === true && (
                <p className="text-xs text-green-600 mt-2">Client accepted — added to quote.</p>
              )}
              {workOrder.revision_approved === false && (
                <p className="text-xs text-red-600 mt-2">Client declined.</p>
              )}
            </div>
          )}

          {/* Audit Events */}
          {workOrder.work_order_events && workOrder.work_order_events.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-grey-dark mb-3">History</h3>
              <ul className="text-sm space-y-2">
                {workOrder.work_order_events.map((event) => (
                  <li key={event.id} className="text-grey">
                    <span className="font-medium text-grey-dark">
                      {event.event_type.replace(/_/g, ' ')}
                    </span>
                    {event.old_status && event.new_status && event.old_status !== event.new_status && (
                      <span className="ml-2">
                        ({event.old_status} → {event.new_status})
                      </span>
                    )}
                    {event.notes && <span className="ml-2 text-grey-medium">— {event.notes}</span>}
                    <span className="ml-2 text-xs text-grey-medium">
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <AdditionalWorkModal
        isOpen={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        workOrder={workOrder}
        onSuccess={() => {
          setShowRevisionModal(false)
          onUpdate()
        }}
      />
    </div>
  )
}
