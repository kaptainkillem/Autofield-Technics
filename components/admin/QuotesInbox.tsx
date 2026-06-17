'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/database'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { QuoteDetailModal } from '@/components/ui/QuoteDetailModal'
import { MessageCircle, ArrowUpRight } from 'lucide-react'

type Quote = Database['public']['Tables']['quotes']['Row']
type Status = NonNullable<Quote['status']>

interface QuotesInboxProps {
  quotes: Quote[]
}

const FILTERS: (Status | 'all')[] = [
  'all', 'pending', 'sent', 'accepted', 'completed', 'cancelled',
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

export function QuotesInbox({ quotes }: QuotesInboxProps) {
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [allQuotes, setAllQuotes] = useState(quotes)
  const router = useRouter()

  const visible = allQuotes.filter((q) => {
    const matchStatus = filter === 'all' || q.status === filter
    const term        = search.toLowerCase()
    const matchSearch =
      q.customer_name.toLowerCase().includes(term) ||
      (q.vehicle_make  ?? '').toLowerCase().includes(term) ||
      (q.vehicle_model ?? '').toLowerCase().includes(term) ||
      (q.description ?? '').toLowerCase().includes(term)
    return matchStatus && matchSearch
  })

  function handleStatusChange(updatedQuote: Quote) {
    setAllQuotes((prev) =>
      prev.map((q) => (q.id === updatedQuote.id ? updatedQuote : q))
    )
    router.refresh()
  }

  // 🚀 WhatsApp Intent Dispatch URL Builder
  function triggerWhatsAppQuickReply(e: React.MouseEvent, quote: Quote) {
    e.stopPropagation() // Prevents opening the QuoteDetailModal layout card concurrently

    // Sanitize phone pattern string rules for clear network routing
    let cleanPhone = (quote.customer_phone || '').replace(/[^\d]/g, '')
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      cleanPhone = '27' + cleanPhone.substring(1)
    }

    // Extract integrated description attributes safely
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
          className="flex-1 form-input"
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
              <th className="text-left px-4 py-3 text-xs font-semibold text-grey uppercase tracking-wide">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-grey uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-grey text-sm">
                  No quotes found.
                </td>
              </tr>
            ) : (
              visible.map((quote) => (
                <tr
                  key={quote.id}
                  onClick={() => setSelectedQuote(quote)}
                  className="border-b border-grey-medium/20 hover:bg-primary/5 cursor-pointer transition-colors"
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
                    {quote.description?.slice(0, 30) ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={quote.status ?? 'pending'} />
                  </td>
                  {/* 🚀 Dynamic Action Follow-up Cell */}
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => triggerWhatsAppQuickReply(e, quote)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba56] text-white text-xs font-bold rounded-base shadow-sm transition-all"
                    >
                      <MessageCircle size={13} className="fill-white" />
                      <span className="hidden sm:inline">Follow-up</span>
                      <ArrowUpRight size={10} className="opacity-70" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-grey-medium/20 text-xs text-grey-medium">
        Showing {visible.length} of {allQuotes.length} quotes
      </div>

      {/* Detail Modal */}
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