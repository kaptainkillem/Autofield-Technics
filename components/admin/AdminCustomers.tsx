'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TableSearch } from '@/components/ui/TableSearch'
import { Database } from '@/types/database'
import { MessageCircle, ChevronRight, Plus, UserPlus } from 'lucide-react'
import { AddNewCustomerModal } from './AddNewCustomerModal'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AdminCustomersProps {
  customers: Profile[]
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return 'Recently'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function statusColor(status: string | null) {
  switch (status) {
    case 'vip': return 'bg-yellow-100 text-yellow-700'
    case 'blacklisted': return 'bg-red-100 text-red-700'
    default: return 'bg-green-100 text-green-700'
  }
}

export function AdminCustomers({ customers: initialCustomers }: AdminCustomersProps) {
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [customers, setCustomers] = useState(initialCustomers)

  const filtered = customers.filter((c) => {
    const term = search.toLowerCase()
    return (
      (c.full_name ?? '').toLowerCase().includes(term) ||
      (c.phone ?? '').toLowerCase().includes(term) ||
      (c.id ?? '').toLowerCase().includes(term) ||
      (c.internal_notes ?? '').toLowerCase().includes(term)
    )
  })

  if (customers.length === 0) {
    return (
      <div className="card text-center py-10">
        <p className="text-sm text-grey">No customers yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <TableSearch
            placeholder="Search by name, phone, or notes..."
            value={search}
            onChange={setSearch}
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-base bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors shadow-sm shrink-0"
        >
          <UserPlus size={16} />
          New Customer
        </button>
      </div>
      <div className="border border-grey-medium/10 rounded-base overflow-hidden">
        <div className="p-4 border-b border-grey-medium/20 flex items-center justify-between bg-white">
          <span className="text-sm font-semibold text-grey-dark">All customers</span>
          <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
            {filtered.length} shown
          </span>
        </div>
        <ul className="divide-y divide-grey-medium/20 bg-white">
          {filtered.map((c) => {
            const name = c.full_name ?? 'Unknown'
            const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
            const status = c.client_status ?? 'active'
            const whatsappNumber = c.whatsapp_number || c.phone || c.alternate_phone

            return (
              <li
                key={c.id}
                className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-primary/5 transition-colors group"
              >
                <Link
                  href={`/dashboard/admin/customers/${c.id}`}
                  className="flex items-center gap-3 flex-1 min-w-0 no-underline"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-grey-dark">{name}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase ${statusColor(status)}`}>
                        {status}
                      </span>
                    </div>
                    <p className="text-xs text-grey">{c.phone ?? 'No phone'}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {whatsappNumber && (
                    <a
                      href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-base bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle size={16} />
                    </a>
                  )}
                  <Link
                    href={`/dashboard/admin/customers/${c.id}`}
                    className="p-2 rounded-base text-grey hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {showAddModal && (
        <AddNewCustomerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            // Refresh page data
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}