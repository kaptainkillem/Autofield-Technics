'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { sanitizeText } from '@/lib/input-sanitizer'
import { Plus, Trash2, X, Loader2, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import DatePicker from 'react-datepicker'

interface BlockedSlot {
  id: string
  start_datetime: string
  end_datetime: string
  reason: string | null
  created_at: string
}

export function BlockedSlotsForm() {
  const [slots, setSlots] = useState<BlockedSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    fetchBlockedSlots()
  }, [])

  async function fetchBlockedSlots() {
    setLoading(true)
    const { data, error } = await (supabase as any)
      .from('blocked_slots')
      .select('*')
      .order('start_datetime', { ascending: false })

    if (error) {
      console.error('Fetch blocked slots error:', error)
      toast.error('Failed to load blocked slots')
    } else {
      setSlots(data ?? [])
    }
    setLoading(false)
  }

  async function handleAddSlot() {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates')
      return
    }

    if (startDate >= endDate) {
      toast.error('End date must be after start date')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/admin/settings/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'blocked_slot_add',
          start_datetime: startDate.toISOString(),
          end_datetime: endDate.toISOString(),
          reason: sanitizeText(reason) || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add')

      toast.success('Blocked slot added')
      setShowModal(false)
      setStartDate(null)
      setEndDate(null)
      setReason('')
      fetchBlockedSlots()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add blocked slot')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteSlot(id: string) {
    if (!window.confirm('Are you sure you want to remove this blocked slot?')) return

    setDeletingId(id)
    try {
      const res = await fetch('/api/admin/settings/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'blocked_slot_delete', id }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')

      toast.success('Blocked slot removed')
      setSlots((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete blocked slot')
    } finally {
      setDeletingId(null)
    }
  }

  function formatDateTime(isoString: string): string {
    const date = new Date(isoString)
    return date.toLocaleString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatDateTimeShort(isoString: string): string {
    const date = new Date(isoString)
    return date.toLocaleString('en-ZA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-grey-dark">Blocked Slots</h3>
          <p className="text-xs text-grey">
            Mark time off, lunch breaks, or holidays. These times will not appear as bookable.
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-primary text-white font-bold py-2 px-4 rounded-base shadow-sm hover:bg-primary-dark transition-all flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Block Time</span>
        </Button>
      </div>

      {/* Slots Table */}
      {slots.length === 0 ? (
        <div className="text-center py-12 bg-grey-lightest rounded-base border border-grey-light/50">
          <Calendar className="h-8 w-8 text-grey-medium mx-auto mb-2" />
          <p className="text-sm text-grey-medium">No blocked slots yet.</p>
          <p className="text-xs text-grey mt-1">Click "Block Time" to add lunch breaks, holidays, or time off.</p>
        </div>
      ) : (
        <div className="bg-white border border-grey-medium/10 rounded-base overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-grey-lightest border-b border-grey-light">
                <th className="py-3 px-4 font-semibold text-grey-dark text-xs uppercase tracking-wide">From</th>
                <th className="py-3 px-4 font-semibold text-grey-dark text-xs uppercase tracking-wide">To</th>
                <th className="py-3 px-4 font-semibold text-grey-dark text-xs uppercase tracking-wide hidden sm:table-cell">Reason</th>
                <th className="py-3 px-4 font-semibold text-grey-dark text-xs uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-light">
              {slots.map((slot) => (
                <tr key={slot.id} className="hover:bg-grey-lightest transition-colors">
                  <td className="py-3 px-4 text-grey-dark">
                    <span className="text-xs">{formatDateTime(slot.start_datetime)}</span>
                  </td>
                  <td className="py-3 px-4 text-grey-dark">
                    <span className="text-xs">{formatDateTimeShort(slot.end_datetime)}</span>
                  </td>
                  <td className="py-3 px-4 text-grey hidden sm:table-cell">
                    <span className="text-xs">{slot.reason ?? '—'}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      disabled={deletingId === slot.id}
                      aria-disabled={deletingId === slot.id}
                      aria-busy={deletingId === slot.id}
                      className="text-grey-medium hover:text-error transition-colors p-1 disabled:opacity-50"
                      title="Delete blocked slot"
                    >
                      {deletingId === slot.id ? (
                        <Loader2 size={14} className="animate-spin text-error" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-base shadow-xl w-full max-w-lg flex flex-col gap-5 p-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-grey-dark">Block Time Slot</h4>
              <button
                onClick={() => setShowModal(false)}
                className="text-grey-medium hover:text-grey-dark transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Start DateTime */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-grey uppercase tracking-wide">Start Date & Time</label>
                  <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => setStartDate(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={60}
                  dateFormat="dd MMM yyyy HH:mm"
                  placeholderText="Select start date and time"
                  className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  wrapperClassName="w-full"
                  calendarClassName="!rounded-base !border-grey-medium/10 !shadow-base"
                />
              </div>

              {/* End DateTime */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-grey uppercase tracking-wide">End Date & Time</label>
                  <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={60}
                  dateFormat="dd MMM yyyy HH:mm"
                  placeholderText="Select end date and time"
                  className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  wrapperClassName="w-full"
                  calendarClassName="!rounded-base !border-grey-medium/10 !shadow-base"
                />
              </div>

              {/* Reason */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-grey uppercase tracking-wide">Reason (optional)</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Lunch break, Public holiday, Annual leave"
                  className="w-full rounded-base border border-grey-medium/20 py-2.5 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                onClick={() => setShowModal(false)}
                className="bg-white text-grey border border-grey-medium/20 font-semibold py-2 px-4 rounded-base hover:bg-grey-lightest transition-all"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddSlot}
                disabled={saving}
                aria-disabled={saving}
                aria-busy={saving}
                className="bg-primary text-white font-bold py-2 px-4 rounded-base shadow-sm hover:bg-primary-dark transition-all flex items-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>{saving ? 'Saving...' : 'Block Slot'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
