'use client'

import { useEffect, useRef, useState } from 'react'
import { Database } from '@/types/database'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CustomerBookingForm } from '@/components/customer/CustomerBookingForm'
import { useSiteConfig } from '@/components/providers/SiteConfigProvider'
import { replaceVars } from '@/lib/site-config'
import { Loader2 } from 'lucide-react'

type Quote = Database['public']['Tables']['quotes']['Row']

const STATUSES = ['draft', 'pending', 'sent', 'accepted', 'declined', 'completed', 'cancelled'] as const

interface QuoteDetailModalProps {
  quote: Quote
  onClose: () => void
  onStatusChange?: (updatedQuote: Quote) => void
  admin?: boolean
}

interface LineItem {
  id: string
  name: string
  qty: number
  unitPrice: number
}

function parseLineItems(value: unknown): LineItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      return {
        id: String(row.id ?? ''),
        name: String(row.name ?? ''),
        qty: Number(row.qty ?? 1),
        unitPrice: Number(row.unitPrice ?? 0),
      }
    })
    .filter((item): item is LineItem => Boolean(item?.name))
}

function formatCurrency(value: number) {
  return `R${value.toFixed(2)}`
}

export function QuoteDetailModal({ quote: initialQuote, onClose, onStatusChange, admin = false }: QuoteDetailModalProps) {
  const config = useSiteConfig()
  const [quote, setQuote] = useState(initialQuote)
  const [selectedStatus, setSelectedStatus] = useState(quote.status ?? 'pending')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customerAction, setCustomerAction] = useState<'accepting' | 'declining' | null>(null)
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
      setQuote(data.quote as Quote)
      if (onStatusChange) onStatusChange(data.quote as Quote)
      onClose()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCustomerAction(action: 'accept' | 'decline') {
    setCustomerAction(action === 'accept' ? 'accepting' : 'declining')
    setError(null)
    try {
      const res = await fetch(`/api/quotes/${quote.id}/customer-action`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Action failed')
        return
      }
      setQuote(data.quote as Quote)
      if (onStatusChange) onStatusChange(data.quote as Quote)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setCustomerAction(null)
    }
  }

  const isCustomer = !admin
  const showAcceptDecline = isCustomer && quote.status === 'sent'
  const showBooking = isCustomer && quote.status === 'accepted'

  const lineItems = parseLineItems((quote as any).line_items)
  const hasLineItems = lineItems.length > 0
  const subtotal = hasLineItems
    ? lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
    : (quote as any).subtotal ?? 0
  const discountPercent = (quote as any).discount_percent ?? 0
  const discountAmount = subtotal * (Number(discountPercent) / 100)
  const total = (quote as any).total ?? Math.max(0, subtotal - discountAmount)

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
              Created {quote.created_at ? new Date(quote.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
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

          {/* Line Items + Pricing — shown to customer when quote is sent or accepted */}
          {isCustomer && hasLineItems && (quote.status === 'sent' || quote.status === 'accepted') && (
            <div className="flex flex-col gap-3 bg-white border border-grey-medium/10 rounded-base p-4">
              <h3 className="text-xs font-semibold text-grey-medium uppercase tracking-wide">Quote Breakdown</h3>
              <div className="divide-y divide-grey-light">
                {lineItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <span className="font-medium text-grey-dark">{item.name}</span>
                      <span className="text-grey ml-2">×{item.qty}</span>
                    </div>
                    <span className="font-semibold text-grey-dark">{formatCurrency(item.qty * item.unitPrice)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-grey-light pt-3 space-y-1">
                <div className="flex justify-between text-sm text-grey">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-sm text-error">
                    <span>Discount ({discountPercent}%)</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-grey-dark pt-1">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Booking — shown after customer accepts */}
          {showBooking && (
            <div className="flex flex-col gap-3 bg-white border border-primary/20 rounded-base p-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Quote Accepted</span>
              </div>
              <p className="text-sm text-grey">Choose a date and time below to book your appointment.</p>
              <CustomerBookingForm quoteId={quote.id} />
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

          {/* Customer Accept / Decline */}
          {showAcceptDecline && (
            <div className="flex gap-3">
              <button
                onClick={() => handleCustomerAction('decline')}
                disabled={customerAction !== null}
                className="flex-1 btn-secondary text-sm !py-2.5 disabled:opacity-50"
              >
                {customerAction === 'declining' ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Declining...</span>
                ) : 'Decline Quote'}
              </button>
              <button
                onClick={() => handleCustomerAction('accept')}
                disabled={customerAction !== null}
                className="flex-1 bg-green-600 text-white font-semibold rounded-base px-4 py-2.5 hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
              >
                {customerAction === 'accepting' ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Accepting...</span>
                ) : 'Accept Quote'}
              </button>
            </div>
          )}

          {!showBooking && (
            <div className="flex gap-3">
              {isCustomer && (
                  <button
                    onClick={() => {
                      const phone = quote.customer_phone || ''
                      const msg = encodeURIComponent(
                        `${replaceVars(config.serviceDetail.whatsAppMessageTemplate, { customerName: quote.customer_name, name: config.name })}` +
                        `${quote.description ? ` regarding ${quote.description.slice(0, 30)}` : ''}.`
                      )
                      window.open(`https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${msg}`, '_blank')
                    }}
                    className="flex-1 btn-secondary text-sm !py-2.5"
                  >
                    WhatsApp Us
                  </button>
              )}
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
          )}

          {admin && onStatusChange && quote.status !== 'completed' && selectedStatus === quote.status && (
            <button
              onClick={() => setSelectedStatus('completed')}
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
