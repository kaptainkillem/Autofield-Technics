'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DatePicker from 'react-datepicker'
import { Calendar, Clock, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface CustomerBookingFormProps {
  quoteId: string
}

export function CustomerBookingForm({ quoteId }: CustomerBookingFormProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [slots, setSlots] = useState<string[]>([])
  const [fetchingSlots, setFetchingSlots] = useState(false)
  const [noSlotsMessage, setNoSlotsMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

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
          setNoSlotsMessage('No available times on this date. Please try another day.')
        }
      } else {
        setSlots([])
        setNoSlotsMessage(data.error || 'Unable to check availability.')
      }
    } catch (err) {
      console.error('Availability fetch error:', err)
      setSlots([])
      setNoSlotsMessage('Network error. Please try again.')
    } finally {
      setFetchingSlots(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate || !selectedSlot) return

    setSubmitting(true)

    try {
      const res = await fetch(`/api/quotes/${quoteId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
          scheduled_time: selectedSlot,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to book appointment')
        setSubmitting(false)
        return
      }

      toast.success('Appointment requested!')
      setConfirmed(true)
      // Refresh the page so the parent re-fetches the appointment
      router.refresh()
    } catch (err) {
      console.error('Booking error:', err)
      toast.error('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmed) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle size={48} className="text-green-500" />
        <h3 className="text-xl font-bold text-grey-dark">Appointment Requested!</h3>
        <p className="text-sm text-grey max-w-sm">
          Your appointment for{' '}
          <strong>
            {selectedDate ? format(selectedDate, 'EEEE, dd MMMM yyyy') : ''} at {selectedSlot}
          </strong>{' '}
          has been submitted. The mechanic will review and confirm shortly.
        </p>
      </div>
    )
  }

  const today = new Date()

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

      {/* Submit */}
      <Button
        type="submit"
        disabled={!selectedDate || !selectedSlot || submitting || fetchingSlots}
        className="bg-primary text-white font-bold py-3 px-6 rounded-base shadow-sm hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
        <span>{submitting ? 'Requesting...' : 'Request Appointment'}</span>
      </Button>
    </form>
  )
}
