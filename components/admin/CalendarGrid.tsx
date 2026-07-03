'use client'

import { useState, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfDay,
  parseISO,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List } from 'lucide-react'

interface CalendarAppointment {
  id: string
  scheduled_date: string
  scheduled_time: string | null
  status: string
  customer_name?: string
  service_type?: string
  notes?: string | null
  [key: string]: any
}

interface BlockedSlot {
  id: string
  start_datetime: string
  end_datetime: string
  reason: string | null
}

interface CalendarGridProps {
  appointments: CalendarAppointment[]
  blockedSlots: BlockedSlot[]
  view: 'month' | 'week'
  onDateClick: (date: Date) => void
  onAppointmentClick: (appointment: CalendarAppointment) => void
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  proposed: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-primary-light text-primary-dark border-primary/20',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-grey-light text-grey-medium border-grey-light',
}

export function CalendarGrid({ appointments, blockedSlots, view, onDateClick, onAppointmentClick }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const days = useMemo(() => {
    if (view === 'month') {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

      const daysArray: Date[] = []
      let day = calendarStart
      while (day <= calendarEnd) {
        daysArray.push(day)
        day = addDays(day, 1)
      }
      return daysArray
    } else {
      // Week view
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
      const daysArray: Date[] = []
      for (let i = 0; i < 7; i++) {
        daysArray.push(addDays(weekStart, i))
      }
      return daysArray
    }
  }, [currentDate, view])

  function goToToday() {
    setCurrentDate(new Date())
  }

  function goToPrev() {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1))
    } else {
      setCurrentDate(addDays(currentDate, -7))
    }
  }

  function goToNext() {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1))
    } else {
      setCurrentDate(addDays(currentDate, 7))
    }
  }

  function getAppointmentsForDate(date: Date): CalendarAppointment[] {
    const dateStr = format(date, 'yyyy-MM-dd')
    return appointments.filter((a) => a.scheduled_date === dateStr)
  }

  function getBlockedSlotsForDate(date: Date): BlockedSlot[] {
    const dateStr = format(date, 'yyyy-MM-dd')
    return blockedSlots.filter((b) => {
      const start = new Date(b.start_datetime)
      const end = new Date(b.end_datetime)
      const startStr = format(start, 'yyyy-MM-dd')
      const endStr = format(end, 'yyyy-MM-dd')
      return dateStr >= startStr && dateStr <= endStr
    })
  }

  const today = new Date()
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrev}
            className="p-2 rounded-base border border-grey-medium/10 bg-white hover:bg-grey-lightest transition-colors"
          >
            <ChevronLeft size={18} className="text-grey-dark" />
          </button>
          <h2 className="text-lg font-bold text-grey-dark min-w-[200px] text-center">
            {view === 'month'
              ? format(currentDate, 'MMMM yyyy')
              : `${format(days[0], 'dd MMM')} – ${format(days[6], 'dd MMM yyyy')}`}
          </h2>
          <button
            onClick={goToNext}
            className="p-2 rounded-base border border-grey-medium/10 bg-white hover:bg-grey-lightest transition-colors"
          >
            <ChevronRight size={18} className="text-grey-dark" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-2 rounded-base border border-grey-medium/10 bg-white text-sm font-semibold text-grey-dark hover:bg-grey-lightest transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center py-2 text-xs font-bold text-grey uppercase tracking-wide">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isToday = isSameDay(day, today)
          const dayAppointments = getAppointmentsForDate(day)
          const dayBlocked = getBlockedSlotsForDate(day)
          const isBlocked = dayBlocked.length > 0

          return (
            <div
              key={index}
              onClick={() => onDateClick(day)}
              className={`min-h-[100px] p-2 rounded-base border cursor-pointer transition-all hover:shadow-sm relative ${
                isCurrentMonth
                  ? isBlocked
                    ? 'bg-grey-lightest/80 border-grey-medium/20'
                    : 'bg-white border-grey-medium/10'
                  : 'bg-grey-lightest/30 border-grey-light/20'
              } ${isToday ? 'ring-2 ring-primary/30' : ''}`}
            >
              {/* Blocked overlay indicator */}
              {isBlocked && (
                <div className="absolute inset-0 bg-grey-light/20 rounded-base pointer-events-none" />
              )}

              <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-primary' : isBlocked ? 'text-grey-medium' : 'text-grey-dark'}`}>
                {format(day, 'd')}
              </div>

              {/* Blocked reason */}
              {isBlocked && (
                <div className="text-[9px] text-grey-medium mb-1 truncate">
                  {dayBlocked[0].reason ?? 'Blocked'}
                </div>
              )}

              {/* Appointments */}
              <div className="flex flex-col gap-1">
                {dayAppointments.slice(0, 3).map((appt) => (
                  <div
                    key={appt.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onAppointmentClick(appt)
                    }}
                    className={`text-[10px] px-1.5 py-0.5 rounded border truncate cursor-pointer ${
                      STATUS_COLORS[appt.status] ?? STATUS_COLORS.pending
                    }`}
                    title={`${appt.scheduled_time ?? ''} — ${appt.service_type ?? 'Appointment'}`}
                  >
                    {appt.scheduled_time?.slice(0, 5)} {appt.service_type ?? 'Job'}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <span className="text-[10px] text-grey-medium px-1">+{dayAppointments.length - 3} more</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 flex-wrap">
        <span className="text-xs font-semibold text-grey">Status:</span>
        {Object.entries(STATUS_COLORS).map(([status, classes]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm border ${classes.split(' ')[0]}`} />
            <span className="text-xs text-grey capitalize">{status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
