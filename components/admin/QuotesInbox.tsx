'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/database'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { QuoteDetailModal } from '@/components/ui/QuoteDetailModal'
import { TableSearch } from '@/components/ui/TableSearch'
import { MessageCircle, ArrowUpRight, CheckSquare, Square, Loader2, Edit, FileDown } from 'lucide-react'
import { toast } from 'sonner'

type Quote = Database['public']['Tables']['quotes']['Row']
type Status = NonNullable<Quote['status']>

interface QuotesInboxProps {
  quotes: Quote[]
  initialFilter?: string
}

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending', value: 'pending' },
  { label: 'Sent', value: 'sent' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Declined', value: 'declined' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days} days ago`
  if (days < 14) return '1 week ago'
  return `${Math.floor(days / 7)} weeks ago`
}

export function QuotesInbox({ quotes, initialFilter = '' }: QuotesInboxProps) {
  const [filter, setFilter] = useState(initialFilter)
  const [search, setSearch] = useState('')
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [allQuotes, setAllQuotes] = useState(quotes)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const router = useRouter()

  const visible = allQuotes.filter((q) => {
    const matchStatus = filter === '' || q.status === filter
    const term        = search.toLowerCase()
    const matchSearch =
      q.customer_name.toLowerCase().includes(term) ||
      (q.vehicle_make  ?? '').toLowerCase().includes(term) ||
      (q.vehicle_model ?? '').toLowerCase().includes(term) ||
      (q.description ?? '').toLowerCase().includes(term)
    return matchStatus && matchSearch
  })

  const allSelected = visible.length > 0 && visible.every((q) => selectedIds.has(q.id))

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        visible.forEach((q) => next.delete(q.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        visible.forEach((q) => next.add(q.id))
        return next
      })
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleBulkStatusChange(status: Status) {
    if (selectedIds.size === 0) return
    setBulkLoading(true)

    try {
      const res = await fetch('/api/quotes/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), status }),
      })

      if (!res.ok) throw new Error('Bulk update failed')

      setAllQuotes((prev) =>
        prev.map((q) => (selectedIds.has(q.id) ? { ...q, status } : q))
      )
      setSelectedIds(new Set())
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to update quotes. Please try again.')
    } finally {
      setBulkLoading(false)
    }
  }

  function handleStatusChange(updatedQuote: Quote) {
    setAllQuotes((prev) =>
      prev.map((q) => (q.id === updatedQuote.id ? updatedQuote : q))
    )
    router.refresh()
  }

  function triggerWhatsAppQuickReply(e: React.MouseEvent, quote: Quote) {
    e.stopPropagation()
    let cleanPhone = (quote.customer_phone || '').replace(/[^\d]/g, '')
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      cleanPhone = '27' + cleanPhone.substring(1)
    }
    const rawDesc = quote.description || ''
    const serviceTypeMatch = rawDesc.match(/\[Service:\s*([^\]]+)\]/)
    const serviceType = serviceTypeMatch ? serviceTypeMatch[1] : 'Mechanical Service'
    const messageBody = [
      `👋 *Hey ${quote.customer_name}!*`,
      ``,
      `This is *Prince* from *Fixxr*. I received your quote request on our platform for the *${quote.vehicle_make ?? 'Vehicle'} ${quote.vehicle_model ?? ''}* regarding the *${serviceType}*.`,
      ``,
      `I've looked over your vehicle details and put together an estimate breakdown for you. Let me know if you're ready for me to send it over! 🔧`,
    ].join('\n')
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageBody)}`, '_blank', 'noopener,noreferrer')
    toast.success('WhatsApp follow-up opened')
  }

  return (
    <div className="flex flex-col gap-4">
      <TableSearch
        placeholder="Search name, vehicle or service..."
        value={search}
        onChange={setSearch}
        filters={STATUS_FILTERS}
        filterValue={filter}
        onFilterChange={setFilter}
        filterLabel="Status"
      />

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-base px-4 py-2">
          <span className="text-sm font-semibold text-primary">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            {(['pending', 'sent', 'accepted', 'declined', 'completed', 'cancelled'] as Status[]).map((status) => (
              <button
                key={status}
                type="button"
                disabled={bulkLoading}
                aria-disabled={bulkLoading}
                aria-busy={bulkLoading}
                onClick={() => handleBulkStatusChange(status)}
                className="px-3 py-1 text-xs font-bold rounded-base bg-white border border-grey-medium/20 hover:border-primary/40 hover:bg-primary/10 transition-all disabled:opacity-50 capitalize"
              >
                {bulkLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  status
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border border-grey-medium/10 rounded-base overflow-hidden">
        <div className="p-4 border-b border-grey-medium/20 bg-white flex items-center justify-between">
          <span className="text-sm font-semibold text-grey-dark">All quotes</span>
          <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
            {visible.length} shown
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-white border-b border-grey-medium/20 text-grey uppercase tracking-wider text-xs">
                <th className="py-3 px-2 w-10">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    disabled={bulkLoading}
                    aria-disabled={bulkLoading}
                    className="p-1 hover:bg-grey-lightest rounded transition-colors disabled:opacity-50"
                  >
                    {allSelected ? (
                      <CheckSquare size={16} className="text-primary" />
                    ) : (
                      <Square size={16} className="text-grey-medium" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 font-bold">Customer</th>
                <th className="py-3 px-4 font-bold hidden md:table-cell">Vehicle</th>
                <th className="py-3 px-4 font-bold hidden lg:table-cell">Service</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-light">
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
                    onClick={() => setSelectedQuote(quote)}
                    className={`hover:bg-primary/5 transition-colors cursor-pointer ${
                      selectedIds.has(quote.id) ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="py-4 px-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => toggleSelect(quote.id)}
                        disabled={bulkLoading}
                        aria-disabled={bulkLoading}
                        className="p-1 hover:bg-grey-lightest rounded transition-colors disabled:opacity-50"
                      >
                        {selectedIds.has(quote.id) ? (
                          <CheckSquare size={16} className="text-primary" />
                        ) : (
                          <Square size={16} className="text-grey-medium" />
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-grey-dark">{quote.customer_name}</p>
                      <p className="text-xs text-grey-medium">
                        {quote.customer_phone} · {quote.created_at ? timeAgo(quote.created_at) : '—'}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-grey-dark hidden md:table-cell">
                      {[quote.vehicle_make, quote.vehicle_model, quote.vehicle_year]
                        .filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="py-4 px-4 text-grey-dark hidden lg:table-cell">
                      {quote.description?.slice(0, 30) ?? '—'}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={quote.status ?? 'pending'} />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {quote.status === 'draft' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/dashboard/admin/quotes/builder?quoteId=${quote.id}`)
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-primary text-white text-xs font-bold rounded-base hover:bg-primary-dark transition-colors"
                          >
                            <Edit size={13} />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                        )}
                        {(quote.status === 'sent' || quote.status === 'accepted') && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation()
                              try {
                                const res = await fetch(`/api/quotes/${quote.id}/pdf?skipEmail=true`, { method: 'POST' })
                                const data = await res.json()
                                if (res.ok && data.storagePath) {
                                  window.open(`/api/quotes/${quote.id}/pdf/download`, '_blank')
                                  toast.success('PDF ready!')
                                } else {
                                  toast.error(data.error || 'Failed to generate PDF')
                                }
                              } catch {
                                toast.error('Failed to generate PDF')
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1.5 bg-grey-lightest hover:bg-grey-light text-grey-dark text-xs font-semibold rounded-base transition-colors"
                            title="Download PDF"
                          >
                            <FileDown size={13} />
                          </button>
                        )}
                        {quote.status === 'sent' && (
                          <button
                            type="button"
                            onClick={(e) => triggerWhatsAppQuickReply(e, quote)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-base shadow-sm transition-all"
                          >
                            <MessageCircle size={13} className="fill-white" />
                            <span className="hidden sm:inline">Follow-up</span>
                            <ArrowUpRight size={10} className="opacity-70" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedQuote && (
        <QuoteDetailModal
          quote={selectedQuote}
          onClose={() => setSelectedQuote(null)}
          onStatusChange={handleStatusChange}
          admin
        />
      )}
    </div>
  )
}
