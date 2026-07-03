export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { FileText, Wrench, User, CheckCircle, Clock, XCircle } from 'lucide-react'
import { QuoteActionButtons } from '@/components/public/QuoteActionButtons'
import { AccountNudgeBanner } from '@/components/public/AccountNudgeBanner'
import type { Json } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

interface ParsedLineItem {
  id: string
  name: string
  qty: number
  unitPrice: number
}

function parseLineItems(value: Json | null): ParsedLineItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null
      const row = item as Record<string, Json>
      return {
        id: String(row.id ?? ''),
        name: String(row.name ?? ''),
        qty: Number(row.qty ?? 1),
        unitPrice: Number(row.unitPrice ?? 0),
      }
    })
    .filter((item): item is ParsedLineItem => Boolean(item?.name))
}

export default async function PublicQuotePage({ params }: PageProps) {
  const { id } = await params
  const supabase = createSupabaseAdminClient()

  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('id, customer_name, customer_email, customer_phone, vehicle_year, vehicle_make, vehicle_model, service_type, description, status, estimated_quote, line_items, subtotal, discount_percent, total, notes, pdf_url, quote_number')
    .eq('id', id)
    .single() as { data: Record<string, any> | null; error: any }

  if (!quote) {
    notFound()
  }

  const { data: existingAppointment } = await supabase
    .from('appointments')
    .select('id, scheduled_date, scheduled_time, status, proposed_date, proposed_time, proposed_notes')
    .eq('quote_id', id)
    .neq('status', 'cancelled')
    .maybeSingle()

  const lineItems = parseLineItems(quote.line_items)
  const subtotal = quote.subtotal ?? lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  const discountPercent = Number(quote.discount_percent ?? 0)
  const discountAmount = subtotal * (discountPercent / 100)
  const total = quote.total ?? Math.max(0, subtotal - discountAmount)

  const formatCurrency = (value: number) =>
    `R ${value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const isSent = quote.status === 'sent'
  const isAccepted = quote.status === 'accepted'

  return (
    <>
      {/* Hero Section */}
      <section className="bg-grey-light px-4 pt-32 pb-12 md:px-20 md:pt-40 md:pb-16">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <FileText size={28} className="text-grey-dark" />
            </div>
            <div>
              <p className="text-xs font-semibold text-grey uppercase tracking-wider mb-1">
                {quote.quote_number ?? `Quote #${id.slice(0, 8).toUpperCase()}`}
              </p>
              <h1 className="heading-1 mb-3">
                {quote.service_type ?? 'Service Quote'}
              </h1>
              <p className="text-grey max-w-xl mx-auto text-sm">
                {[quote.vehicle_year, quote.vehicle_make, quote.vehicle_model].filter(Boolean).join(' ') || 'Vehicle details'} — {quote.customer_name}
              </p>
            </div>

            {/* Status Badge */}
            <div className="mt-2">
              {quote.status === 'pending' && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold">
                  <Clock size={14} />
                  Awaiting Quote
                </span>
              )}
              {quote.status === 'sent' && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/80 border border-primary/20 text-primary text-xs font-bold">
                  <FileText size={14} />
                  Quote Sent — Action Required
                </span>
              )}
              {quote.status === 'accepted' && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-100 border border-green-200 text-green-800 text-xs font-bold">
                  <CheckCircle size={14} />
                  Quote Accepted
                </span>
              )}
              {quote.status === 'declined' && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-100 border border-red-200 text-red-800 text-xs font-bold">
                  <XCircle size={14} />
                  Quote Declined
                </span>
              )}
              {quote.status === 'completed' && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-grey-lightest border border-grey-medium/20 text-grey text-xs font-bold">
                  <CheckCircle size={14} />
                  Completed
                </span>
              )}
              {quote.status === 'draft' && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-grey-lightest border border-grey-medium/20 text-grey text-xs font-bold">
                  <Clock size={14} />
                  Preparing
                </span>
              )}
            </div>

            {/* Quick Stats */}
            {(isSent || isAccepted) && total > 0 && (
              <div className="mt-2 text-3xl font-black text-grey-dark">
                {formatCurrency(total)}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-grey-lightest border-t border-b border-grey-medium/10 px-4 py-4 md:px-20">
        <div className="mx-auto max-w-4xl">
          <Breadcrumb
            segments={[
              { label: 'Home', href: '/' },
              { label: 'Quote Details' },
            ]}
          />
        </div>
      </div>

      <section className="bg-white px-4 py-12 md:px-20 md:py-16">
        <div className="mx-auto max-w-4xl flex flex-col gap-8">

          <AccountNudgeBanner customerEmail={quote.customer_email} quoteId={id} />

          {/* Customer + Vehicle Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4 bg-grey-lightest/50 rounded-base p-5 border border-grey-light/50">
              <h3 className="text-sm font-bold text-grey-dark uppercase tracking-wide">Customer</h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-grey-dark">
                  <User size={14} className="text-primary" />
                  {quote.customer_name}
                </div>
                {quote.customer_email && (
                  <div className="text-xs text-grey">{quote.customer_email}</div>
                )}
                <div className="text-xs text-grey">{quote.customer_phone}</div>
              </div>
            </div>

            <div className="flex flex-col gap-4 bg-grey-lightest/50 rounded-base p-5 border border-grey-light/50">
              <h3 className="text-sm font-bold text-grey-dark uppercase tracking-wide">Vehicle</h3>
              <div className="flex items-center gap-2 text-sm text-grey-dark">
                <Wrench size={14} className="text-primary" />
                {[quote.vehicle_year, quote.vehicle_make, quote.vehicle_model].filter(Boolean).join(' ') || 'Not specified'}
              </div>
            </div>

            <div className="flex flex-col gap-4 bg-grey-lightest/50 rounded-base p-5 border border-grey-light/50 md:col-span-2">
              <h3 className="text-sm font-bold text-grey-dark uppercase tracking-wide">Service Requested</h3>
              <div className="text-sm font-semibold text-grey-dark">
                {quote.service_type ?? 'General Service'}
              </div>
              <p className="text-xs text-grey leading-relaxed">{quote.description}</p>
            </div>
          </div>

          {/* Line Items Table (shown when sent or accepted) */}
          {(isSent || isAccepted) && lineItems.length > 0 && (
            <div className="border rounded-base overflow-hidden">
              <div className="bg-grey-dark text-white px-5 py-3">
                <h3 className="text-sm font-bold uppercase tracking-wide">Quote Breakdown</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-grey-lightest">
                  <tr className="border-b border-grey-medium/10">
                    <th className="text-left px-5 py-3 text-xs font-bold text-grey uppercase tracking-wide">Item</th>
                    <th className="text-center px-3 py-3 text-xs font-bold text-grey uppercase tracking-wide w-20">Qty</th>
                    <th className="text-right px-3 py-3 text-xs font-bold text-grey uppercase tracking-wide w-32">Unit Price</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-grey uppercase tracking-wide w-32">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id} className="border-b border-grey-medium/5">
                      <td className="px-5 py-3 text-grey-dark font-medium">{item.name}</td>
                      <td className="px-3 py-3 text-center text-grey">{item.qty}</td>
                      <td className="px-3 py-3 text-right text-grey">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-5 py-3 text-right text-grey-dark font-semibold">
                        {formatCurrency(item.qty * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-grey-lightest/50">
                    <td colSpan={3} className="px-5 py-3 text-right text-xs font-semibold text-grey uppercase">
                      Subtotal
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-bold text-grey-dark">
                      {formatCurrency(subtotal)}
                    </td>
                  </tr>
                  {discountPercent > 0 && (
                    <tr className="bg-grey-lightest/50">
                      <td colSpan={3} className="px-5 py-3 text-right text-xs font-semibold text-red-600 uppercase">
                        Discount ({discountPercent}%)
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-bold text-red-600">
                        -{formatCurrency(discountAmount)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-primary/5">
                    <td colSpan={3} className="px-5 py-4 text-right text-sm font-black text-grey-dark uppercase">
                      Total
                    </td>
                    <td className="px-5 py-4 text-right text-lg font-black text-primary">
                      {formatCurrency(total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Notes */}
          {quote.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-base p-5">
              <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide mb-2">Additional Notes</h3>
              <p className="text-sm text-amber-700 leading-relaxed">{quote.notes}</p>
            </div>
          )}

          {/* Action Buttons (Accept/Decline/PDF) — client component */}
          <QuoteActionButtons
            quoteId={id}
            status={quote.status}
            pdfUrl={quote.pdf_url ?? null}
            existingAppointment={existingAppointment as any}
          />
        </div>
      </section>
    </>
  )
}
