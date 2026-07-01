'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Clock, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface WorkingHour {
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

const DAYS = [
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
  { id: 0, label: 'Sunday' },
]

const DEFAULT_HOURS: WorkingHour[] = [
  { day_of_week: 1, start_time: '08:00', end_time: '17:00', is_active: true },
  { day_of_week: 2, start_time: '08:00', end_time: '17:00', is_active: true },
  { day_of_week: 3, start_time: '08:00', end_time: '17:00', is_active: true },
  { day_of_week: 4, start_time: '08:00', end_time: '17:00', is_active: true },
  { day_of_week: 5, start_time: '08:00', end_time: '17:00', is_active: true },
  { day_of_week: 6, start_time: '08:00', end_time: '13:00', is_active: true },
  { day_of_week: 0, start_time: '08:00', end_time: '13:00', is_active: false },
]

export function WorkingHoursForm() {
  const [hours, setHours] = useState<WorkingHour[]>(DEFAULT_HOURS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchWorkingHours() {
      const { data, error } = await (supabase as any)
        .from('working_hours')
        .select('*')
        .order('day_of_week')

      if (error) {
        console.error('Fetch working hours error:', error)
        toast.error('Failed to load working hours')
      } else if (data && data.length > 0) {
        // Merge fetched data with defaults for any missing days
        const merged = DEFAULT_HOURS.map((defaultHour) => {
          const found = data.find((h: WorkingHour) => h.day_of_week === defaultHour.day_of_week)
          return found ? { ...defaultHour, ...found } : defaultHour
        })
        setHours(merged)
      }
      setLoading(false)
    }

    fetchWorkingHours()
  }, [])

  function updateHour(dayOfWeek: number, field: keyof WorkingHour, value: string | boolean) {
    setHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h
      )
    )
  }

  async function handleSave() {
    setSaving(true)

    const invalid = hours.find(
      (h) => h.is_active && h.start_time >= h.end_time
    )
    if (invalid) {
      const dayLabel = DAYS.find((d) => d.id === invalid.day_of_week)?.label
      toast.error(`${dayLabel}: Start time must be before end time`)
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/admin/settings/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'working_hours',
          hours: hours.map((h) => ({
            day_of_week: h.day_of_week,
            start_time: h.start_time,
            end_time: h.end_time,
            is_active: h.is_active,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')

      toast.success('Working hours updated!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save working hours')
    } finally {
      setSaving(false)
    }
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
          <h3 className="text-lg font-bold text-grey-dark">Working Hours</h3>
          <p className="text-xs text-grey">
            Set when your shop is open. Customers can only book during these hours.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          aria-disabled={saving}
          aria-busy={saving}
          className="bg-primary text-white font-bold py-2 px-4 rounded-base shadow-sm hover:bg-primary-dark transition-all flex items-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>{saving ? 'Saving...' : 'Save Hours'}</span>
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {hours.map((hour) => {
          const dayLabel = DAYS.find((d) => d.id === hour.day_of_week)?.label ?? ''
          return (
            <div
              key={hour.day_of_week}
              className={`flex items-center gap-4 p-4 rounded-base border transition-all ${
                hour.is_active
                  ? 'bg-white border-grey-medium/10'
                  : 'bg-grey-light/30 border-grey-light/50'
              }`}
            >
              {/* Day Label */}
              <div className="w-28 shrink-0">
                <span
                  className={`text-sm font-semibold ${
                    hour.is_active ? 'text-grey-dark' : 'text-grey-medium'
                  }`}
                >
                  {dayLabel}
                </span>
              </div>

              {/* Open Toggle */}
              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={hour.is_active}
                  onChange={(e) => updateHour(hour.day_of_week, 'is_active', e.target.checked)}
                  className="w-4 h-4 rounded border-grey-medium text-primary focus:ring-primary"
                />
                <span className="text-sm text-grey">{hour.is_active ? 'Open' : 'Closed'}</span>
              </label>

              {/* Time Inputs */}
              <div className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-grey-medium" />
                  <input
                    type="time"
                    value={hour.start_time}
                    onChange={(e) => updateHour(hour.day_of_week, 'start_time', e.target.value)}
                    disabled={!hour.is_active}
                    className="rounded-base border border-grey-medium/20 py-2 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-grey-light/50 disabled:text-grey-medium"
                  />
                </div>

                <span className="text-grey-medium text-sm">to</span>

                <input
                  type="time"
                  value={hour.end_time}
                  onChange={(e) => updateHour(hour.day_of_week, 'end_time', e.target.value)}
                  disabled={!hour.is_active}
                  className="rounded-base border border-grey-medium/20 py-2 px-3 text-sm text-grey-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-grey-light/50 disabled:text-grey-medium"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
