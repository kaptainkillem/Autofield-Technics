'use client'

import { useEffect, useRef, useState } from 'react'
import { Database } from '@/types/database'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SITE_CONFIG, replaceVars } from '@/lib/site-config'

type Quote = Database['public']['Tables']['quotes']['Row']

const STATUSES = ['pending', 'sent', 'accepted', 'completed', 'cancelled'] as const

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '27000000000'

interface QuoteDetailModalProps {
  quote: Quote
  onClose: () => void
  onStatusChange?: (updatedQuote: Quote) => void
  admin?: boolean
}

export function QuoteDetailModal({ quote, onClose, onStatusChange, admin = false }: QuoteDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState(quote.status ?? 'pending')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose()
  }

  async function handleSaveStatus() {
    if (selectedStatus === quote.status) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update status')
        return
      }
      if (onStatusChange) onStatusChange(data.quote as Quote)
      onClose()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function openWhatsApp() {
    const vehicle = [quote.vehicle_make, quote.vehicle_model, quote.vehicle_year]
      .filter(Boolean).join(' ')
    const msg = encodeURIComponent(
      `${replaceVars(SITE_CONFIG.serviceDetail.whatsAppMessageTemplate, { customerName: quote.customer_name, name: SITE_CONFIG.name })}` +
      `${quote.description ? ` for ${quote.description.slice(0, 30)}` : ''}` +
      `${vehicle ? ` on your ${vehicle}` : ''}.`
    )
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank')
  }

  const vehicle = [quote.vehicle_year, quote.vehicle_make, quote.vehicle_model]
    .filter(Boolean).join(' ') || '—'

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div className="bg-white rounded-base shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-grey-light">
          <div>
            <h2 className="text-lg font-bold text-grey-dark">Quote Details</h2>
            <p className="text-xs text-grey-medium mt-0.5">
              Created {new Date(quote.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-grey-medium hover:text-grey-dark transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 flex flex-col gap-5">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-grey">Status</span>
            {admin && onStatusChange ? (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-input !w-auto !py-1.5 !px-3 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            ) : (
              <StatusBadge status={quote.status ?? 'pending'} />
            )}
          </div>

          {/* Customer */}
          <div className="flex flex-col gap-2 bg-white border border-grey-medium/10 rounded-base p-4">
            <h3 className="text-xs font-semibold text-grey-medium uppercase tracking-wide">Customer</h3>
            <p className="text-sm font-semibold text-grey-dark">{quote.customer_name}</p>
            {quote.customer_email && (
              <a href={`mailto:${quote.customer_email}`} className="text-sm text-primary hover:underline">{quote.customer_email}</a>
            )}
            <a href={`tel:${quote.customer_phone}`} className="text-sm text-primary hover:underline">{quote.customer_phone}</a>
          </div>

          {/* Vehicle */}
          <div className="flex flex-col gap-2 bg-white border border-grey-medium/10 rounded-base p-4">
            <h3 className="text-xs font-semibold text-grey-medium uppercase tracking-wide">Vehicle</h3>
            <p className="text-sm font-semibold text-grey-dark">{vehicle}</p>
          </div>

          {/* Description */}
          {quote.description && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-grey-medium uppercase tracking-wide">Description</h3>
              <p className="text-sm text-grey whitespace-pre-wrap">{quote.description}</p>
            </div>
          )}

          {/* Dates */}
          {quote.updated_at && quote.updated_at !== quote.created_at && (
            <p className="text-xs text-grey-medium">
              Last updated {new Date(quote.updated_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-grey-light flex flex-col gap-2">
          {error && (
            <p className="text-sm text-error text-center">{error}</p>
          )}
          <div className="flex gap-3">
            <button onClick={openWhatsApp} className="flex-1 btn-secondary text-sm !py-2.5">
              💬 WhatsApp Customer
            </button>
            {admin && onStatusChange && selectedStatus !== quote.status && (
              <button
                onClick={handleSaveStatus}
                disabled={saving}
                className="flex-1 btn-primary text-sm !py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Update Status'}
              </button>
            )}
          </div>
          {admin && onStatusChange && quote.status !== 'completed' && selectedStatus === quote.status && (
            <button
              onClick={() => { setSelectedStatus('completed'); }}
              className="w-full bg-green-600 text-white font-semibold rounded-base px-4 py-2.5 hover:bg-green-700 transition-colors text-sm"
            >
              Mark Job Complete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}