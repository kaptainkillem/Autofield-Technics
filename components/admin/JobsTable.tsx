'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock, Wrench, CheckCircle, XCircle, Calendar } from 'lucide-react'
import { TableSearch } from '@/components/ui/TableSearch'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Database } from '@/types/database'

type AppointmentRow = Database['public']['Tables']['appointments']['Row']

interface JobsTableProps {
  appointments: AppointmentRow[]
}

const STATUS_FILTERS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

export function JobsTable({ appointments }: JobsTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const pendingCount = appointments.filter((j) => j.status === 'pending').length
  const confirmedCount = appointments.filter((j) => j.status === 'confirmed').length
  const completedCount = appointments.filter((j) => j.status === 'completed').length

  const filtered = appointments.filter((job) => {
    const term = search.toLowerCase()
    const matchesSearch =
      job.service_type.toLowerCase().includes(term) ||
      (job.notes ?? '').toLowerCase().includes(term)

    const matchesFilter = statusFilter === '' || job.status === statusFilter

    return matchesSearch && matchesFilter
  })

  if (appointments.length === 0) {
    return (
      <div className="text-center py-16 text-grey bg-grey-lightest border border-dashed rounded-base">
        <Wrench size={32} className="mx-auto mb-2 text-grey-medium" />
        <p className="font-semibold">No active jobs right now.</p>
        <p className="text-sm text-grey-medium mt-1">Confirmed quote requests will appear here as jobs.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="bg-amber-50 text-amber-600 border border-amber-200 rounded-base px-3 py-1 text-xs font-bold">{pendingCount} Pending</span>
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

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-grey-medium/20 text-grey uppercase tracking-wider text-xs bg-grey-lightest">
              <th className="py-3 px-4 font-bold">Service Type</th>
              <th className="py-3 px-4 font-bold">Scheduled Date</th>
              <th className="py-3 px-4 font-bold">Time</th>
              <th className="py-3 px-4 font-bold">Status</th>
              <th className="py-3 px-4 font-bold">Notes</th>
              <th className="py-3 px-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grey-light">
            {filtered.map((job) => (
              <tr key={job.id} className="hover:bg-grey-lightest/40 transition">
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
                </td>
                <td className="py-4 px-4 text-grey text-xs">{job.scheduled_time}</td>
                <td className="py-4 px-4">
                  <StatusBadge status={job.status ?? 'pending'} />
                </td>
                <td className="py-4 px-4 text-grey text-xs max-w-xs truncate">{job.notes ?? '—'}</td>
                <td className="py-4 px-4 text-right whitespace-nowrap">
                  <Link
                    href={`/dashboard/admin/quotes?highlight=${job.quote_id ?? ''}`}
                    className="inline-flex items-center gap-1.5 bg-primary text-white text-xs px-3 py-2 rounded-base font-bold no-underline hover:bg-primary-dark transition shadow-sm"
                  >
                    View Quote
                    <ArrowRight size={12} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}