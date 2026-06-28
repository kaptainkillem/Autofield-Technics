'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Loader2, Clock, Calendar, User, Wrench, FileText, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface CreateAppointmentModalProps {
  date: Date | null
  onClose: () => void
  onSuccess: () => void
}

export function CreateAppointmentModal({ date, onClose, onSuccess }: CreateAppointmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [fetchingSlots, setFetchingSlots] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [noSlotsMessage, setNoSlotsMessage] = useState('')

  const [form, setForm] = useState({
    scheduled_time: '',
    service_type: '',
    customer_name: '',
    notes: '',
    duration_minutes: 60,
  })

  // Fetch availability when date changes
  useEffect(() => {
    if (!date) return

    async function fetchAvailability() {
      setFetchingSlots(true)
      setNoSlotsMessage('')
      const dateStr = format(date!, 'yyyy-MM-dd')

      try {
        const res = await fetch(`/api/availability?date=${dateStr}`)
        const data = await res.json()

        if (res.ok && data.slots) {
          setAvailableSlots(data.slots)
          if (data.slots.length === 0) {
            setNoSlotsMessage('No available slots on this date.')
          }
          // Pre-select first slot
          if (data.slots.length > 0) {
            setForm((prev) => ({ ...prev, scheduled_time: data.slots[0] }))
          }
        } else {
          setAvailableSlots([])
          setNoSlotsMessage(data.error || 'Unable to load availability.')
        }
      } catch (err) {
        console.error('Availability fetch error:', err)
        setAvailableSlots([])
        setNoSlotsMessage('Network error loading availability.')
      } finally {
        setFetchingSlots(false)
      }
    }

    fetchAvailability()
  }, [date])

  function handleChange(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date) return

    setLoading(true)

    const payload = {
      scheduled_date: format(date, 'yyyy-MM-dd'),
      scheduled_time: form.scheduled_time,
      service_type: form.service_type.trim(),
      customer_name: form.customer_name.trim() || null,
      notes: form.notes.trim() || null,
      duration_minutes: form.duration_minutes,
      status: 'pending',
    }

    const { error } = await (supabase as any)
      .from('appointments')
      .insert(payload)

    setLoading(false)

    if (error) {
      console.error('Create appointment error:', error)
      toast.error('Failed to create appointment')
      return
    }

    toast.success('Appointment created!')
    onSuccess()
    onClose()
  }

  if (!date) return null

  const dateStr = format(date, 'EEEE, dd MMMM yyyy')
  const canSave =
    form.scheduled_time &&
    form.service_type.trim() &&
    availableSlots.length > 0 &&
    !loading

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-base shadow-xl w-full max-w-lg flex flex-col gap-5 p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-bold text-grey-dark">Create Appointment</h4>
            <p className="text-xs text-grey flex items-center gap-1 mt-0.5">
              <Calendar size={12} />
              {dateStr}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-grey-medium hover:text-grey-dark transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Availability status */}
        {fetchingSlots ? (
          <div className="flex items-center gap-2 text-sm text-grey">
            <Loader2 size={14} className="animate-spin" />
            Checking availability...
          </div>
        ) : noSlotsMessage ? (
          <div className="bg-amber-50 border border-amber-200 rounded-base p-3 text-sm text-amber-800">
            {noSlotsMessage}
          </div>
        ) : (
          <div className="text-xs text-grey">
            <span className="font-semibold text-primary">{availableSlots.length}</span> slots available
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Time Slot */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-grey-dark uppercase tracking-wide flex items-center gap-1">
              <Clock size={12} />
              Time Slot
            </label>
            <select
              value={form.scheduled_time}
              onChange={(e) => handleChange('scheduled_time', e.target.value)}
              disabled={fetchingSlots || availableSlots.length === 0}
              className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-grey-light/50"
            >
              {availableSlots.length === 0 ? (
                <option value="">No slots available</option>
              ) : (
                availableSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Service Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-grey-dark uppercase tracking-wide flex items-center gap-1">
              <Wrench size={12} />
              Service Type
            </label>
            <input
              type="text"
              value={form.service_type}
              onChange={(e) => handleChange('service_type', e.target.value)}
              placeholder="e.g., Brake Pad Replacement, Oil Change"
              required
              className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Customer Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-grey-dark uppercase tracking-wide flex items-center gap-1">
              <User size={12} />
              Customer Name
            </label>
            <input
              type="text"
              value={form.customer_name}
              onChange={(e) => handleChange('customer_name', e.target.value)}
              placeholder="Customer name (optional)"
              className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Duration */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-grey-dark uppercase tracking-wide flex items-center gap-1">
              <Timer size={12} />
              Duration (minutes)
            </label>
            <input
              type="number"
              min={30}
              max={480}
              step={30}
              value={form.duration_minutes}
              onChange={(e) => handleChange('duration_minutes', parseInt(e.target.value) || 60)}
              className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-grey-dark uppercase tracking-wide flex items-center gap-1">
              <FileText size={12} />
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any special instructions or notes..."
              rows={3}
              className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-grey-light">
            <Button
              type="button"
              onClick={onClose}
              className="bg-white text-grey border border-grey-medium/20 font-semibold py-2 px-4 rounded-base hover:bg-grey-lightest transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSave}
              className="bg-primary text-white font-bold py-2 px-4 rounded-base shadow-sm hover:bg-primary-dark transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{loading ? 'Creating...' : 'Create Appointment'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
