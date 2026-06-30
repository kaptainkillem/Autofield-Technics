'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileDown, Loader2, Plus, Save, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface DocumentLineItem {
  id: string
  name: string
  qty: number
  unitPrice: number
}

interface QuoteBuilderProps {
  mode: 'quote' | 'invoice'
  acceptedQuotes?: AcceptedQuote[]
}

export interface AcceptedQuote {
  id: string
  quoteNumber: string | null
  customerName: string
  customerEmail: string | null
  customerPhone: string
  vehicleYear: number | null
  vehicleMake: string | null
  vehicleModel: string | null
  serviceType: string | null
  description: string
  lineItems: DocumentLineItem[]
  discountPercent: number
}

type PaymentMethod = 'Cash' | 'Card' | null

const emptyLine = (): DocumentLineItem => ({
  id: `line-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name: '',
  qty: 1,
  unitPrice: 0,
})

function formatCurrency(value: number) {
  return `R${value.toFixed(2)}`
}

function clampPercent(value: string) {
  const next = Number.parseFloat(value)
  if (Number.isNaN(next)) return 0
  return Math.min(100, Math.max(0, next))
}

export function QuoteBuilder({ mode, acceptedQuotes = [] }: QuoteBuilderProps) {
  const router = useRouter()
  const isInvoice = mode === 'invoice'
  const [selectedQuoteId, setSelectedQuoteId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [vehicleYear, setVehicleYear] = useState('')
  const [vehicleMake, setVehicleMake] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState<DocumentLineItem[]>([emptyLine()])
  const [discountPercent, setDiscountPercent] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)
  const [status, setStatus] = useState(isInvoice ? 'draft' : 'draft')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const subtotal = useMemo(
    () => rows.reduce((sum, row) => sum + row.qty * row.unitPrice, 0),
    [rows],
  )
  const discountAmount = subtotal * (discountPercent / 100)
  const total = Math.max(0, subtotal - discountAmount)

  function updateRow(id: string, patch: Partial<DocumentLineItem>) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length === 1 ? [emptyLine()] : prev.filter((row) => row.id !== id)))
  }

  function applyAcceptedQuote(id: string) {
    setSelectedQuoteId(id)
    const quote = acceptedQuotes.find((item) => item.id === id)
    if (!quote) return

    setCustomerName(quote.customerName)
    setCustomerEmail(quote.customerEmail ?? '')
    setCustomerPhone(quote.customerPhone)
    setVehicleYear(quote.vehicleYear ? String(quote.vehicleYear) : '')
    setVehicleMake(quote.vehicleMake ?? '')
    setVehicleModel(quote.vehicleModel ?? '')
    setServiceType(quote.serviceType ?? '')
    setDescription(quote.description)
    setRows(quote.lineItems.length ? quote.lineItems : [emptyLine()])
    setDiscountPercent(quote.discountPercent)
  }

  async function saveDocument(nextStatus: string) {
    const cleanRows = rows
      .map((row) => ({
        ...row,
        name: row.name.trim(),
        qty: Math.max(1, Number(row.qty) || 1),
        unitPrice: Math.max(0, Number(row.unitPrice) || 0),
      }))
      .filter((row) => row.name)

    if (!customerName.trim() || cleanRows.length === 0) {
      setMessage('Add a customer name and at least one line item.')
      return
    }

    setSaving(true)
    setMessage('')

    const endpoint = isInvoice ? '/api/admin/invoices' : '/api/admin/quotes'
    const payload = {
      quoteId: isInvoice ? selectedQuoteId || null : undefined,
      customerName,
      customerEmail,
      customerPhone,
      vehicleYear: vehicleYear ? Number(vehicleYear) : null,
      vehicleMake,
      vehicleModel,
      serviceType,
      description,
      notes,
      status: nextStatus,
      paymentMethod: isInvoice ? paymentMethod : undefined,
      discountPercent,
      lineItems: cleanRows,
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Save failed')

      setStatus(nextStatus)
      const label = isInvoice ? result.invoice?.invoice_number : result.quote?.quote_number
      setMessage(`${isInvoice ? 'Invoice' : 'Quote'} saved${label ? ` (${label})` : ''}.`)
      if (nextStatus === 'sent' && customerPhone.trim()) {
        openWhatsApp(label ?? (isInvoice ? 'Invoice' : 'Quote'), cleanRows)
      }
      router.refresh()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function printInvoice() {
    window.print()
  }

  function openWhatsApp(documentNumber: string, cleanRows: DocumentLineItem[]) {
    const phone = customerPhone.replace(/[^\d]/g, '').replace(/^0(\d{9})$/, '27$1')
    const cleanSubtotal = cleanRows.reduce((sum, row) => sum + row.qty * row.unitPrice, 0)
    const cleanDiscountAmount = cleanSubtotal * (discountPercent / 100)
    const cleanTotal = Math.max(0, cleanSubtotal - cleanDiscountAmount)
    const lines = [
      '*Autofield Technics*',
      `${isInvoice ? 'Invoice' : 'Quote'}: ${documentNumber}`,
      '',
      ...cleanRows.map((row) => `${row.name} x${row.qty} - ${formatCurrency(row.qty * row.unitPrice)}`),
      '',
      `Subtotal: ${formatCurrency(cleanSubtotal)}`,
    ]

    if (cleanDiscountAmount > 0) {
      lines.push(`Discount (-${discountPercent}%): -${formatCurrency(cleanDiscountAmount)}`)
    }

    lines.push(`Total: ${formatCurrency(cleanTotal)}`)

    if (isInvoice && paymentMethod) {
      lines.push(`Paid via: ${paymentMethod}`)
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm print:hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-grey-dark tracking-tight">
              Create {isInvoice ? 'Invoice' : 'Quote'}
            </h1>
            <p className="text-xs text-grey">
              Type prices manually for each job. Nothing here uses preset service pricing.
            </p>
          </div>
          <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase text-primary">
            {status}
          </span>
        </div>

        {isInvoice && (
          <div className="mt-5">
            <label htmlFor="acceptedQuote">Pull from accepted quote</label>
            <select
              id="acceptedQuote"
              value={selectedQuoteId}
              onChange={(event) => applyAcceptedQuote(event.target.value)}
              className="form-select"
            >
              <option value="">Start blank</option>
              {acceptedQuotes.map((quote) => (
                <option key={quote.id} value={quote.id}>
                  {(quote.quoteNumber ?? 'Accepted quote')} - {quote.customerName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="customerName">Customer name</label>
            <input id="customerName" className="form-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="customerPhone">Customer phone</label>
            <input id="customerPhone" className="form-input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          </div>
          <div>
            <label htmlFor="customerEmail">Customer email</label>
            <input id="customerEmail" className="form-input" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="serviceType">Service type</label>
            <input id="serviceType" className="form-input" value={serviceType} onChange={(e) => setServiceType(e.target.value)} />
          </div>
          <div>
            <label htmlFor="vehicleYear">Vehicle year</label>
            <input id="vehicleYear" className="form-input" type="number" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="vehicleMake">Make</label>
              <input id="vehicleMake" className="form-input" value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} />
            </div>
            <div>
              <label htmlFor="vehicleModel">Model</label>
              <input id="vehicleModel" className="form-input" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="description">Job description</label>
          <textarea id="description" className="form-textarea min-h-24" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      {isInvoice ? (
        <InvoicePaper
          customerName={customerName}
          rows={rows}
          subtotal={subtotal}
          discountPercent={discountPercent}
          discountAmount={discountAmount}
          total={total}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          updateRow={updateRow}
          removeRow={removeRow}
        />
      ) : (
        <QuoteTable
          rows={rows}
          subtotal={subtotal}
          discountPercent={discountPercent}
          discountAmount={discountAmount}
          total={total}
          updateRow={updateRow}
          removeRow={removeRow}
        />
      )}

      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm print:hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" className="form-textarea min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="w-full md:w-48">
            <label htmlFor="discount">Discount</label>
            <div className="flex items-center gap-2">
              <input
                id="discount"
                className="form-input"
                type="number"
                min={0}
                max={100}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(clampPercent(e.target.value))}
              />
              <span className="text-sm font-semibold text-grey">%</span>
            </div>
          </div>
        </div>

        {message && <p className="mt-4 text-sm font-semibold text-primary">{message}</p>}

        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => setRows((prev) => [...prev, emptyLine()])} className="flex items-center gap-2">
            <Plus size={16} />
            Add line item
          </Button>
          <Button type="button" variant="outline" disabled={saving} onClick={() => saveDocument('draft')} className="flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Draft
          </Button>
          <Button type="button" disabled={saving} onClick={() => saveDocument(isInvoice ? 'sent' : 'sent')} className="flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Send {isInvoice ? 'Invoice' : 'Quote'}
          </Button>
          {isInvoice && (
            <Button type="button" variant="secondary" onClick={printInvoice} className="flex items-center gap-2">
              <FileDown size={16} />
              Save PDF
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function QuoteTable({
  rows,
  subtotal,
  discountPercent,
  discountAmount,
  total,
  updateRow,
  removeRow,
}: {
  rows: DocumentLineItem[]
  subtotal: number
  discountPercent: number
  discountAmount: number
  total: number
  updateRow: (id: string, patch: Partial<DocumentLineItem>) => void
  removeRow: (id: string) => void
}) {
  return (
    <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-grey-dark">Quote Items</h2>
        <span className="text-sm font-semibold text-grey">Total {formatCurrency(total)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-grey-medium/20 text-xs uppercase tracking-wider text-grey">
              <th className="py-3 pr-3 font-bold">Item</th>
              <th className="py-3 px-3 font-bold">Qty</th>
              <th className="py-3 px-3 font-bold">Unit Price</th>
              <th className="py-3 px-3 font-bold">Total</th>
              <th className="py-3 pl-3 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grey-light">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="py-3 pr-3 min-w-56">
                  <input className="form-input" value={row.name} onChange={(e) => updateRow(row.id, { name: e.target.value })} placeholder="e.g. Brake pads" />
                </td>
                <td className="py-3 px-3">
                  <input className="form-input w-20" type="number" min={1} value={row.qty} onChange={(e) => updateRow(row.id, { qty: Number(e.target.value) || 1 })} />
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1">
                    <span className="text-grey">R</span>
                    <input className="form-input w-28" type="number" min={0} value={row.unitPrice} onChange={(e) => updateRow(row.id, { unitPrice: Number(e.target.value) || 0 })} />
                  </div>
                </td>
                <td className="py-3 px-3 font-semibold text-grey-dark">{formatCurrency(row.qty * row.unitPrice)}</td>
                <td className="py-3 pl-3 text-right">
                  <button type="button" onClick={() => removeRow(row.id)} className="p-2 text-error hover:bg-error/10" aria-label="Remove item">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Totals subtotal={subtotal} discountPercent={discountPercent} discountAmount={discountAmount} total={total} label="Quote Total" />
    </div>
  )
}

function InvoicePaper({
  customerName,
  rows,
  subtotal,
  discountPercent,
  discountAmount,
  total,
  paymentMethod,
  setPaymentMethod,
  updateRow,
  removeRow,
}: {
  customerName: string
  rows: DocumentLineItem[]
  subtotal: number
  discountPercent: number
  discountAmount: number
  total: number
  paymentMethod: PaymentMethod
  setPaymentMethod: (method: PaymentMethod) => void
  updateRow: (id: string, patch: Partial<DocumentLineItem>) => void
  removeRow: (id: string) => void
}) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="invoice-paper relative drop-shadow-lg print:drop-shadow-none">
        <div className="invoice-torn-edge h-3 relative top-px" />
        <div className="invoice-body px-6 py-6 font-mono text-[13px] text-grey-dark">
          <div className="text-center mb-4">
            <div className="text-base font-bold tracking-wide text-grey-dark">AUTOFIELD TECHNICS</div>
            <div className="mt-1 text-[11px] text-grey">INVOICE</div>
            <div className="text-[11px] text-grey">{new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
            {customerName && <div className="mt-2 text-[11px] text-grey">Bill to: {customerName}</div>}
          </div>

          <div className="my-3 border-t border-dashed border-grey-medium" />

          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <input
                    className="w-full border-0 border-b border-transparent bg-transparent p-0 text-[13px] focus:border-primary focus:shadow-none print:border-transparent"
                    value={row.name}
                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                    placeholder="Line item"
                  />
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-grey">
                    <span className="flex items-center">
                      R
                      <input
                        type="number"
                        value={row.unitPrice}
                        onChange={(e) => updateRow(row.id, { unitPrice: Number(e.target.value) || 0 })}
                        className="ml-0.5 w-20 border-0 border-b border-grey-medium bg-transparent p-0 text-grey focus:border-primary focus:shadow-none"
                      />
                    </span>
                    <span>x</span>
                    <input
                      type="number"
                      min={1}
                      value={row.qty}
                      onChange={(e) => updateRow(row.id, { qty: Number(e.target.value) || 1 })}
                      className="w-14 border border-grey-medium bg-white px-2 py-1 text-center text-xs"
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-semibold">{formatCurrency(row.qty * row.unitPrice)}</div>
                  <button type="button" onClick={() => removeRow(row.id)} className="px-0 py-1 text-[11px] text-error hover:underline print:hidden">
                    remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="my-3 border-t border-dashed border-grey-medium" />
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-error">
                <span>Discount (-{discountPercent}%)</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 text-base font-bold">
              <span>TOTAL</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="my-3 border-t border-dashed border-grey-medium" />
          <div className="flex items-center justify-between">
            <span className="text-grey">Payment method</span>
            <div className="flex gap-2 print:hidden">
              {(['Cash', 'Card'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`px-2.5 py-1 text-xs ${paymentMethod === method ? 'bg-primary text-white' : 'bg-white text-grey border border-grey-medium'}`}
                >
                  {method}
                </button>
              ))}
            </div>
            <span className="hidden print:inline">{paymentMethod ?? 'Not set'}</span>
          </div>
          <div className="mt-5 text-center text-[11px] text-grey">Thank you for your business</div>
        </div>
        <div className="invoice-torn-edge h-3 relative bottom-px scale-y-[-1]" />
      </div>
    </div>
  )
}

function Totals({
  subtotal,
  discountPercent,
  discountAmount,
  total,
  label,
}: {
  subtotal: number
  discountPercent: number
  discountAmount: number
  total: number
  label: string
}) {
  return (
    <div className="mt-6 ml-auto w-full max-w-sm text-right">
      <div className="text-sm text-grey">Subtotal: {formatCurrency(subtotal)}</div>
      {discountAmount > 0 && (
        <div className="text-sm text-error">Discount (-{discountPercent}%): -{formatCurrency(discountAmount)}</div>
      )}
      <div className="mt-1 text-lg font-bold text-grey-dark">{label}: {formatCurrency(total)}</div>
    </div>
  )
}
