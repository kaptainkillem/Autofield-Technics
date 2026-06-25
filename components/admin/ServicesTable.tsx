'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, ArrowRight, Wrench, Tag, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react'
import { TableSearch } from '@/components/ui/TableSearch'
import { Database } from '@/types/database'

type ServiceRow = Database['public']['Tables']['services']['Row']

interface ServicesTableProps {
  services: ServiceRow[]
  categoryMap: Map<string, string>
}

export function ServicesTable({ services, categoryMap }: ServicesTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = services.filter((s) => {
    const term = search.toLowerCase()
    const matchesSearch =
      s.name.toLowerCase().includes(term) ||
      (s.description ?? '').toLowerCase().includes(term) ||
      (s.category ?? '').toLowerCase().includes(term)

    const matchesFilter = statusFilter === '' || (statusFilter === 'active' ? s.is_active : !s.is_active)

    return matchesSearch && matchesFilter
  })

  if (services.length === 0) {
    return (
      <div className="text-center py-16 text-grey bg-white border border-dashed rounded-base">
        <Wrench size={32} className="mx-auto mb-2 text-grey-medium" />
        <p className="font-semibold">No services yet.</p>
        <p className="text-sm text-grey-medium mt-1">Add your first service to get started.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-success/10 text-success border border-success/20 rounded-base px-3 py-1 text-xs font-bold">
            {services.filter((s) => s.is_active).length} Active
          </span>
          <span className="bg-white text-grey border border-grey-medium/20 rounded-base px-3 py-1 text-xs font-bold">
            {services.filter((s) => !s.is_active).length} Inactive
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TableSearch
            placeholder="Search services..."
            value={search}
            onChange={setSearch}
            filters={[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ]}
            filterValue={statusFilter}
            onFilterChange={setStatusFilter}
            filterLabel="Status"
          />
          <Link
            href="/dashboard/admin/services/new"
            className="inline-flex items-center gap-1.5 bg-primary text-white text-xs px-4 py-2 rounded-base font-bold no-underline hover:bg-primary-dark transition shadow-sm whitespace-nowrap"
          >
            <Plus size={14} />
            Add Service
          </Link>
        </div>
      </div>

      <div className="border border-grey-medium/10 rounded-base overflow-hidden">
        <div className="p-4 border-b border-grey-medium/20 bg-white flex items-center justify-between">
          <span className="text-sm font-semibold text-grey-dark">All services</span>
          <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
            {filtered.length} shown
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-grey-medium/20 text-grey uppercase tracking-wider text-xs bg-white">
                <th className="py-3 px-4 font-bold">Service</th>
                <th className="py-3 px-4 font-bold">Category</th>
                <th className="py-3 px-4 font-bold">Base Price</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-light">
              {filtered.map((service) => (
                <tr key={service.id} className="hover:bg-primary/5 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-bold text-grey-dark">{service.name}</div>
                    <div className="text-xs text-grey mt-0.5 line-clamp-1">{service.description || 'No description'}</div>
                  </td>
                  <td className="py-4 px-4 text-grey-dark font-semibold">
                    <span className="inline-flex items-center gap-1">
                      <Tag size={12} className="text-primary" />
                      {(service.category_id && categoryMap.get(service.category_id)) || service.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {service.base_price != null ? (
                      <span className="inline-flex items-center gap-1 font-bold text-grey-dark">
                        <DollarSign size={12} className="text-success" />
                        R{Number(service.base_price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-xs text-grey">Contact Us</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {service.is_active ? (
                      <span className="inline-flex items-center gap-1.5 text-success text-xs font-bold">
                        <ToggleRight size={16} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-grey text-xs font-bold">
                        <ToggleLeft size={16} /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <Link
                      href={`/dashboard/admin/services/${service.id}`}
                      className="inline-flex items-center gap-1.5 bg-primary text-white text-xs px-3 py-2 rounded-base font-bold no-underline hover:bg-primary-dark transition shadow-sm"
                    >
                      Edit
                      <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
