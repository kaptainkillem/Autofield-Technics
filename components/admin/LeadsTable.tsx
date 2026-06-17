'use client'

import { useState } from 'react'
import { Phone, Clock, AlertTriangle, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { TableSearch } from '@/components/ui/TableSearch'
import { Database } from '@/types/database'

type Lead = Database['public']['Tables']['leads']['Row']

interface LeadsTableProps {
  leads: Lead[]
}

const STATUS_FILTERS = [
  { label: 'All', value: '' },
]

export function LeadsTable({ leads }: LeadsTableProps) {
  const [search, setSearch] = useState('')

  const filtered = leads.filter((lead) => {
    const term = search.toLowerCase()
    return (
      (lead.name ?? '').toLowerCase().includes(term) ||
      (lead.vehicle_details ?? '').toLowerCase().includes(term) ||
      (lead.notes ?? '').toLowerCase().includes(term)
    )
  })

  if (leads.length === 0) {
    return (
      <div className="text-center py-16 text-grey bg-grey-lightest border border-dashed rounded-base">
        <ShieldAlert size={32} className="mx-auto mb-2 text-grey-medium" />
        <p className="font-semibold">All clear! No pending service requests.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="bg-primary/5 border border-primary/25 rounded-base px-4 py-2 text-sm text-primary font-bold self-start">
          Pending Review: {leads.length} Requests
        </div>
        <div className="w-full sm:max-w-xs">
          <TableSearch
            placeholder="Search by name, vehicle, or notes..."
            value={search}
            onChange={setSearch}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-grey-medium/20 text-grey uppercase tracking-wider text-xs bg-grey-lightest">
              <th className="py-3 px-4 font-bold">Car Owner Details</th>
              <th className="py-3 px-4 font-bold">Vehicle Model</th>
              <th className="py-3 px-4 font-bold">Reported Issue</th>
              <th className="py-3 px-4 font-bold">Submitted</th>
              <th className="py-3 px-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grey-light">
            {filtered.map((request) => (
              <tr key={request.id} className="hover:bg-grey-lightest/40 transition">
                <td className="py-4 px-4 font-medium text-grey-dark">
                  <div className="font-bold">{request.name || 'Unknown Driver'}</div>
                  <div className="text-xs text-grey flex items-center gap-1 mt-1">
                    <Phone size={12} className="text-primary" /> {request.phone || 'No phone provided'}
                  </div>
                </td>
                <td className="py-4 px-4 text-grey-dark font-semibold">
                  {request.vehicle_details || 'Vehicle Data Unspecified'}
                </td>
                <td className="py-4 px-4 text-grey-dark max-w-sm">
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle size={14} className="text-amber shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed font-medium text-grey-dark">{request.notes || 'Client requested diagnostic assessment.'}</p>
                  </div>
                </td>
                <td className="py-4 px-4 text-grey text-xs whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(request.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="py-4 px-4 text-right whitespace-nowrap">
                  <Link
                    href={`/dashboard/admin/quotes/maker?requestId=${request.id}`}
                    className="inline-flex items-center gap-1.5 bg-primary text-white text-xs px-3 py-2 rounded-base font-bold no-underline hover:bg-primary-dark transition shadow-md"
                  >
                    Launch Quote Maker
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