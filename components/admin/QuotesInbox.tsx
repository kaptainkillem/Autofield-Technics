'use client'

import { useState } from 'react'
import { Database } from '@/types/database'

type Quote  = Database['public']['Tables']['quotes']['Row']
type Status = Quote['status']

interface QuotesInboxProps {
  quotes: Quote[]
}

const STATUS_STYLES: Record<Status, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  sent:      'bg-blue-100   text-blue-800',
  accepted:  'bg-green-100  text-green-800',
  rejected:  'bg-red-100    text-red-800',
  completed: 'bg-green-100  text-green-800',
  cancelled: 'bg-red-100    text-red-800',
}

const FILTERS: (Status | 'all')[] = [
  'all', 'pending', 'sent', 'accepted', 'completed', 'cancelled',
]

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '27000000000'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days} days ago`
  if (days < 14) return '1 week ago'
  return `${Math.floor(days / 7)} weeks ago`
}

export function QuotesInbox({ quotes }: QuotesInboxProps) {
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const [search, setSearch] = useState('')

  const visible = quotes.filter((q) => {
    const matchStatus = filter === 'all' || q.status === filter
    const term        = search.toLowerCase()
    const matchSearch =
      q.customer_name.toLowerCase().includes(term) ||
      (q.vehicle_make  ?? '').toLowerCase().includes(term) ||
      (q.vehicle_model ?? '').toLowerCase().includes(term) ||
      (q.service_type  ?? '').toLowerCase().includes(term)
    return matchStatus && matchSearch
  })

  function openWhatsApp(quote: Quote) {
    const vehicle = [quote.vehicle_make, quote.vehicle_model, quote.vehicle_year]
      .filter(Boolean).join(' ')
    const msg = encodeURIComponent(
      `Hi ${quote.customer_name}, this is Autofield Technics regarding your quote request` +
      `${quote.service_type ? ` for ${quote.service_type}` : ''}` +
      `${vehicle ? ` on your ${vehicle}` : ''}.`
    )
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank')
  }

  return (
    <div className="card p-0 overflow-hidden">

      {/* Filter bar */}
      <div className="p-4 border-b border-grey-medium/30 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search name, vehicle or service..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-grey-medium rounded-base px-4 py-2 text-sm text-grey focus:outline-none focus:border-primary transition-colors"
        />
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-base text-xs font-semibold transition-colors border capitalize ${
                filter === f
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-grey border-grey-medium hover:border-primary hover:text-primary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-grey-lightest border-b border-grey-medium/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-grey uppercase tracking-wide">Customer</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-grey uppercase tracking-wide hidden md:table-cell">Vehicle</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-grey uppercase tracking-wide hidden lg:table-cell">Service</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-grey uppercase tracking-wide hidden lg:table-cell">Quote</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-grey uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-grey uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-grey text-sm">
                  No quotes found.
                </td>
              </tr>
            ) : (
              visible.map((quote) => (
                <tr
                  key={quote.id}
                  className="border-b border-grey-medium/20 hover:bg-grey-lightest transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-black">{quote.customer_name}</p>
                    <p className="text-xs text-grey-medium">
                      {quote.customer_phone} · {timeAgo(quote.created_at)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-grey hidden md:table-cell">
                    {[quote.vehicle_make, quote.vehicle_model, quote.vehicle_year]
                      .filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-grey hidden lg:table-cell">
                    {quote.service_type ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-black hidden lg:table-cell">
                    {quote.estimated_quote
                      ? `R ${quote.estimated_quote.toLocaleString('en-ZA')}`
                      : 'TBD'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[quote.status]}`}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openWhatsApp(quote)}
                      className="text-xs font-semibold text-primary hover:underline whitespace-nowrap"
                    >
                      💬 WhatsApp
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-grey-medium/20 text-xs text-grey-medium">
        Showing {visible.length} of {quotes.length} quotes
      </div>
    </div>
  )
}