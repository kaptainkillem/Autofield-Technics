'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import DatePicker from 'react-datepicker'
import { Calendar, Clock, Loader2, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface AppointmentRow {
  id: string
  scheduled_date: string
  scheduled_time: string | null
  status: string
  service_type?: string
  proposed_date?: string | null
  proposed_time?: string | null
  proposed_notes?: string | null
}

interface ProposeDateModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: AppointmentRow
  onSuccess: () => void
}

export function ProposeDateModal({ isOpen, onClose, appointment, onSuccess }: ProposeDateModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [slots, setSlots] = useState<string[]>([])
  const [fetchingSlots, setFetchingSlots] = useState(false)
  const [noSlotsMessage, setNoSlotsMessage] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const prevIsOpen = useRef(false)

  const resetForm = useCallback(() => {
    if (appointment.proposed_date) {
      setSelectedDate(new Date(appointment.proposed_date))
      setSelectedSlot(appointment.proposed_time ?? '')
      setNotes(appointment.proposed_notes ?? '')
    } else {
      setSelectedDate(null)
      setSelectedSlot('')
      setNotes('')
    }
  }, [appointment.proposed_date, appointment.proposed_time, appointment.proposed_notes])

  // Reset form when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      resetForm()
    }
    prevIsOpen.current = isOpen
  }, [isOpen, resetForm])

  async function handleDateChange(date: Date | null) {
    setSelectedDate(date)
    setSelectedSlot('')
    setNoSlotsMessage('')

    if (!date) {
      setSlots([])
      return
    }

    setFetchingSlots(true)
    const dateStr = format(date, 'yyyy-MM-dd')

    try {
      const res = await fetch(`/api/availability?date=${dateStr}`)
      const data = await res.json()

      if (res.ok && data.slots) {
        setSlots(data.slots)
        if (data.slots.length === 0) {
          setNoSlotsMessage('No available times on this date.')
        }
      } else {
        setSlots([])
        setNoSlotsMessage(data.error || 'Unable to check availability.')
      }
    } catch {
      setSlots([])
      setNoSlotsMessage('Network error.')
    } finally {
      setFetchingSlots(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate || !selectedSlot) return

    setSubmitting(true)

    try {
      const res = await fetch(`/api/appointments/${appointment.id}/propose`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposed_date: format(selectedDate, 'yyyy-MM-dd'),
          proposed_time: selectedSlot,
          proposed_notes: notes || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to propose new date')
        setSubmitting(false)
        return
      }

      toast.success('New date proposed! Client will be notified.')
      onSuccess()
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const today = new Date()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-base shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-grey-medium/20">
          <div>
            <h2 className="text-lg font-bold text-grey-dark">Propose New Date</h2>
            <p className="text-xs text-grey mt-0.5">
              Current: {appointment.scheduled_date} at {appointment.scheduled_time ?? 'TBD'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-grey hover:text-grey-dark transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
          {/* Date Picker */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-grey-dark flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              Select a Date
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              minDate={today}
              placeholderText="Click to pick a date"
              className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              wrapperClassName="w-full"
              calendarClassName="!rounded-base !border-grey-medium/10 !shadow-base"
              dateFormat="dd MMMM yyyy"
            />
          </div>

          {/* Slots */}
          {selectedDate && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-grey-dark flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                Available Times
              </label>

              {fetchingSlots ? (
                <div className="flex items-center gap-2 text-sm text-grey py-4">
                  <Loader2 size={14} className="animate-spin" />
                  Checking availability...
                </div>
              ) : noSlotsMessage ? (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-base p-3">
                  <AlertCircle size={14} />
                  {noSlotsMessage}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`px-4 py-2 rounded-base text-sm font-semibold border transition-all ${
                        selectedSlot === slot
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-grey-dark border-grey-medium/20 hover:border-primary/40 hover:bg-primary/5'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-grey-dark">
              Message to Client (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. I'm busy that morning, is afternoon OK?"
              maxLength={500}
              rows={3}
              className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
            <p className="text-xs text-grey text-right">{notes.length}/500</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!selectedDate || !selectedSlot || submitting || fetchingSlots}
            className="bg-primary text-white font-bold py-3 px-6 rounded-base shadow-sm hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            <span>{submitting ? 'Proposing...' : 'Propose New Date'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}
