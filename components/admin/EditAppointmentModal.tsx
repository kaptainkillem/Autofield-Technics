'use client'

import { useState } from 'react'
import { X, Loader2, FileText, CheckCircle, Clock, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'

interface Appointment {
  id: string
  scheduled_date: string
  scheduled_time: string | null
  status: string
  service_type?: string
  notes?: string | null
  duration_minutes?: number
  [key: string]: any
}

interface EditAppointmentModalProps {
  appointment: Appointment | null
  onClose: () => void
  onSuccess: () => void
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'text-amber-700' },
  { value: 'proposed', label: 'Proposed', color: 'text-blue-700' },
  { value: 'confirmed', label: 'Confirmed', color: 'text-primary-dark' },
  { value: 'completed', label: 'Completed', color: 'text-green-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-grey-medium' },
]

export function EditAppointmentModal({ appointment, onClose, onSuccess }: EditAppointmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(appointment?.status ?? 'pending')
  const [notes, setNotes] = useState(appointment?.notes ?? '')

  if (!appointment) return null

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!appointment) return

    setLoading(true)

    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes: notes.trim() || null,
        }),
      })

      const data = await res.json()
      setLoading(false)

      if (!res.ok) {
        toast.error(data.error || 'Failed to update appointment')
        return
      }

      toast.success('Appointment updated!')
      onSuccess()
      onClose()
    } catch {
      setLoading(false)
      toast.error('Network error. Please try again.')
    }
  }

  async function handleDelete() {
    if (!appointment) return
    if (!confirm('Are you sure you want to delete this appointment?')) return

    setLoading(true)

    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      setLoading(false)

      if (!res.ok) {
        toast.error(data.error || 'Failed to delete appointment')
        return
      }

      toast.success('Appointment deleted')
      onSuccess()
      onClose()
    } catch {
      setLoading(false)
      toast.error('Network error. Please try again.')
    }
  }

  const appointmentDate = parseISO(appointment.scheduled_date)
  const dateLabel = format(appointmentDate, 'EEEE, dd MMMM yyyy')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-base shadow-xl w-full max-w-lg flex flex-col gap-5 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-bold text-grey-dark">Edit Appointment</h4>
            <p className="text-xs text-grey flex items-center gap-1 mt-0.5">
              <Calendar size={12} />
              {dateLabel} at {appointment.scheduled_time?.slice(0, 5) ?? '—'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-grey-medium hover:text-grey-dark transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Service Info */}
        <div className="bg-grey-lightest rounded-base p-3 flex items-center gap-3">
          <CheckCircle size={16} className="text-primary" />
          <div>
            <p className="text-sm font-semibold text-grey-dark">{appointment.service_type ?? 'Unnamed Service'}</p>
            <p className="text-xs text-grey">
              Duration: {appointment.duration_minutes ?? 60} minutes
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-grey uppercase tracking-wide flex items-center gap-1">
              <CheckCircle size={12} />
              Status
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={`px-3 py-2 rounded-base text-sm font-semibold border transition-all ${
                    status === option.value
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-grey border-grey-medium/20 hover:bg-grey-lightest'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-grey uppercase tracking-wide flex items-center gap-1">
              <FileText size={12} />
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add or update notes..."
              rows={4}
              className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-grey-light">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              aria-disabled={loading}
              aria-busy={loading}
              className="text-sm text-error font-semibold hover:text-error/80 transition-colors px-2 py-1 disabled:opacity-50"
            >
              Delete
            </button>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={onClose}
                className="bg-white text-grey border border-grey-medium/20 font-semibold py-2 px-4 rounded-base hover:bg-grey-lightest transition-all"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                aria-disabled={loading}
                aria-busy={loading}
                className="bg-primary text-white font-bold py-2 px-4 rounded-base shadow-sm hover:bg-primary-dark transition-all flex items-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>{loading ? 'Saving...' : 'Update Appointment'}</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
