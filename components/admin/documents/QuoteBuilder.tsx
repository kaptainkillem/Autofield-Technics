'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileDown, Loader2, Plus, Save, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { supabase, getWorkshopIdFromSession } from '@/lib/supabase'

export interface DocumentLineItem {
  id: string
  name: string
  qty: number
  unitPrice: number
}

export interface QuoteData {
  customerName: string
  customerEmail: string | null
  customerPhone: string
  vehicleYear: number | null
  vehicleMake: string | null
  vehicleModel: string | null
  serviceType: string | null
  description: string | null
  notes: string | null
  lineItems: DocumentLineItem[]
  discountPercent: number
  depositPercent: number
  depositAmount: number | null
  expiryDate: string | null
  status: string
}

interface QuoteBuilderProps {
  mode: 'quote' | 'invoice'
  acceptedQuotes?: AcceptedQuote[]
  quoteId?: string
  initialData?: QuoteData
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

export function QuoteBuilder({ mode, acceptedQuotes = [], quoteId, initialData }: QuoteBuilderProps) {
  const router = useRouter()
  const isInvoice = mode === 'invoice'
  const isEdit = Boolean(quoteId && initialData)
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
  const [depositPercent, setDepositPercent] = useState(0)
  const [depositAmount, setDepositAmount] = useState('')
  const [expiryDays, setExpiryDays] = useState(0)
  const [applyCalloutFee, setApplyCalloutFee] = useState(false)
  const [calloutFeeAmount, setCalloutFeeAmount] = useState(0)
  const [applyDiagnosticFee, setApplyDiagnosticFee] = useState(false)
  const [diagnosticFeeAmount, setDiagnosticFeeAmount] = useState(0)
  const [whatsappAutoReply, setWhatsappAutoReply] = useState('')
  const [workshopName, setWorkshopName] = useState('')
  const [workshopPhone, setWorkshopPhone] = useState('')
  const [workshopEmail, setWorkshopEmail] = useState('')
  const [workshopAddress, setWorkshopAddress] = useState('')
  const [workshopLogo, setWorkshopLogo] = useState('')
  const [workshopPrimaryColor, setWorkshopPrimaryColor] = useState('#5B9BD5')
  const [workshopBanking, setWorkshopBanking] = useState<{ bankName: string; accountHolder: string; accountNumber: string; branchCode: string } | null>(null)
  const [workshopTerms, setWorkshopTerms] = useState('')
  const [workshopFooter, setWorkshopFooter] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)
  const [status, setStatus] = useState(isInvoice ? 'draft' : 'draft')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [savedDocId, setSavedDocId] = useState<string | null>(null)

  useEffect(() => {
    if (isEdit) return
    async function loadDefaults() {
      const { data: { session } } = await supabase.auth.getSession()
      const workshopId = getWorkshopIdFromSession(session)
      if (!workshopId) return
      const { data } = await (supabase as any)
        .from('public_business_settings')
        .select('default_deposit_percent, callout_fee, diagnostic_fee, whatsapp_auto_reply, site_name, company_name, phone, contact_email, address, logo_url, primary_color, bank_name, account_holder, account_number, branch_code, terms_conditions, document_footer')
        .eq('workshop_id', workshopId)
        .maybeSingle()
      if (data?.default_deposit_percent) {
        setDepositPercent(Number(data.default_deposit_percent))
      }
      if (data?.callout_fee) {
        setCalloutFeeAmount(Number(data.callout_fee))
      }
      if (data?.diagnostic_fee) {
        setDiagnosticFeeAmount(Number(data.diagnostic_fee))
      }
      if (data?.whatsapp_auto_reply) {
        setWhatsappAutoReply(data.whatsapp_auto_reply)
      }
      setWorkshopName(data?.company_name || data?.site_name || '')
      setWorkshopPhone(data?.phone || '')
      setWorkshopEmail(data?.contact_email || '')
      setWorkshopAddress(data?.address || '')
      setWorkshopLogo(data?.logo_url || '')
      setWorkshopPrimaryColor(data?.primary_color || '#5B9BD5')
      if (data?.bank_name || data?.account_number) {
        setWorkshopBanking({
          bankName: data?.bank_name || '',
          accountHolder: data?.account_holder || '',
          accountNumber: data?.account_number || '',
          branchCode: data?.branch_code || '',
        })
      }
      setWorkshopTerms(data?.terms_conditions || '')
      setWorkshopFooter(data?.document_footer || '')
    }
    loadDefaults()
  }, [isEdit])

  useEffect(() => {
    if (!initialData) return
    setCustomerName(initialData.customerName)
    setCustomerEmail(initialData.customerEmail ?? '')
    setCustomerPhone(initialData.customerPhone)
    setVehicleYear(initialData.vehicleYear ? String(initialData.vehicleYear) : '')
    setVehicleMake(initialData.vehicleMake ?? '')
    setVehicleModel(initialData.vehicleModel ?? '')
    setServiceType(initialData.serviceType ?? '')
    setDescription(initialData.description ?? '')
    setNotes(initialData.notes ?? '')
    setRows(initialData.lineItems.length ? initialData.lineItems : [emptyLine()])
    setDiscountPercent(initialData.discountPercent)
    setDepositPercent(initialData.depositPercent ?? 0)
      setDepositAmount(initialData.depositAmount ? String(initialData.depositAmount) : '')
      if (initialData.expiryDate) {
        const diffDays = Math.ceil((new Date(initialData.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        setExpiryDays([7, 14, 30].includes(diffDays) ? diffDays : 0)
      }
      setStatus(initialData.status)
  }, [initialData])

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
    if (id === 'fee-callout' || id === 'fee-diagnostic') return
    setRows((prev) => (prev.length === 1 ? [emptyLine()] : prev.filter((row) => row.id !== id)))
  }

  function toggleCalloutFee(checked: boolean) {
    setApplyCalloutFee(checked)
    if (checked) {
      setRows((prev) => [...prev, { id: 'fee-callout', name: 'Callout Fee (Mobile Service)', qty: 1, unitPrice: calloutFeeAmount }])
    } else {
      setRows((prev) => prev.filter((row) => row.id !== 'fee-callout'))
    }
  }

  function toggleDiagnosticFee(checked: boolean) {
    setApplyDiagnosticFee(checked)
    if (checked) {
      setRows((prev) => [...prev, { id: 'fee-diagnostic', name: 'Diagnostic Fee', qty: 1, unitPrice: diagnosticFeeAmount }])
    } else {
      setRows((prev) => prev.filter((row) => row.id !== 'fee-diagnostic'))
    }
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

    const endpoint = isInvoice
      ? '/api/admin/invoices'
      : isEdit
        ? `/api/admin/quotes/${quoteId}`
        : '/api/admin/quotes'
    const method = isEdit ? 'PATCH' : 'POST'
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
      depositPercent,
      depositAmount: depositAmount ? Number(depositAmount) : null,
      expiryDate: expiryDays > 0 ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
      lineItems: cleanRows,
    }

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Save failed')

      setStatus(nextStatus)
      const label = isInvoice ? result.invoice?.invoice_number : result.quote?.quote_number
      const docId = isInvoice ? result.invoice?.id : result.quote?.id
      if (docId) setSavedDocId(docId)
      setMessage(`${isInvoice ? 'Invoice' : 'Quote'} saved${label ? ` (${label})` : ''}.`)
      toast.success(isInvoice ? 'Invoice saved!' : 'Quote saved!')
      if (nextStatus === 'sent' && docId) {
        try {
          const pdfEndpoint = isInvoice ? `/api/invoices/${docId}/pdf` : `/api/quotes/${docId}/pdf`
          const pdfRes = await fetch(pdfEndpoint, { method: 'POST' })
          const pdfData = await pdfRes.json()
          if (pdfRes.ok && pdfData.storagePath) {
            toast.success('PDF generated & email sent')
          }
        } catch { /* PDF generation is best-effort */ }
      }
      if (nextStatus === 'sent' && customerPhone.trim()) {
        const quoteToken = !isInvoice ? result.quote?.quote_token : undefined
        openWhatsApp(label ?? (isInvoice ? 'Invoice' : 'Quote'), cleanRows, docId, quoteToken)
        toast.success('WhatsApp opened')
      }
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed'
      setMessage(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  async function downloadPDF() {
    if (!savedDocId) return
    setSaving(true)
    try {
      const pdfEndpoint = isInvoice
        ? `/api/invoices/${savedDocId}/pdf?skipEmail=true`
        : `/api/quotes/${savedDocId}/pdf?skipEmail=true`
      const res = await fetch(pdfEndpoint, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'PDF generation failed')
      const downloadEndpoint = isInvoice
        ? `/api/invoices/${savedDocId}/pdf/download`
        : `/api/quotes/${savedDocId}/pdf/download`
      window.open(downloadEndpoint, '_blank')
      setMessage('PDF generated successfully.')
      toast.success('PDF generated!')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PDF generation failed'
      setMessage(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  function openWhatsApp(documentNumber: string, cleanRows: DocumentLineItem[], docId?: string, quoteToken?: string) {
    const phone = customerPhone.replace(/[^\d]/g, '').replace(/^0(\d{9})$/, '27$1')
    const cleanSubtotal = cleanRows.reduce((sum, row) => sum + row.qty * row.unitPrice, 0)
    const cleanDiscountAmount = cleanSubtotal * (discountPercent / 100)
    const cleanTotal = Math.max(0, cleanSubtotal - cleanDiscountAmount)
    const lines = [
      whatsappAutoReply || '*Workshop Quote*',
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

    if (docId) {
      const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const tokenParam = quoteToken ? `?token=${quoteToken}` : ''
      lines.push('')
      lines.push(`View full details & accept online: ${siteUrl}/quote/${docId}${tokenParam}`)
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Form Column */}
        <div className="lg:col-span-7 flex flex-col gap-6">
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm print:hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-grey-dark tracking-tight">
              {isEdit ? 'Edit' : 'Create'} {isInvoice ? 'Invoice' : 'Quote'}
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
          onAddLine={() => setRows((prev) => [...prev, emptyLine()])}
        />
      )}

      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm print:hidden">
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" className="form-textarea min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
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

            {!isInvoice && (
              <div>
                <label htmlFor="depositPercent">Deposit %</label>
                <div className="flex items-center gap-2">
                  <input
                    id="depositPercent"
                    className="form-input"
                    type="number"
                    min={0}
                    max={100}
                    value={depositPercent}
                    onChange={(e) => setDepositPercent(clampPercent(e.target.value))}
                  />
                  <span className="text-sm font-semibold text-grey">%</span>
                </div>
              </div>
            )}

            {!isInvoice && (
              <div>
                <label htmlFor="depositAmount">Deposit Amount (R)</label>
                <input
                  id="depositAmount"
                  className="form-input"
                  type="number"
                  min={0}
                  step="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}

            {!isInvoice && (
              <div>
                <label htmlFor="expiryDays">Expiry</label>
                <select
                  id="expiryDays"
                  className="form-select"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                >
                  <option value={0}>No expiry</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>
            )}

            {!isInvoice && calloutFeeAmount > 0 && (
              <div className="flex items-end pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyCalloutFee}
                    onChange={(e) => toggleCalloutFee(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-semibold text-grey">
                    Callout Fee (R {calloutFeeAmount.toFixed(2)})
                  </span>
                </label>
              </div>
            )}

            {!isInvoice && diagnosticFeeAmount > 0 && (
              <div className="flex items-end pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyDiagnosticFee}
                    onChange={(e) => toggleDiagnosticFee(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-semibold text-grey">
                    Diagnostic Fee (R {diagnosticFeeAmount.toFixed(2)})
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        {message && <p className="mt-4 text-sm font-semibold text-primary">{message}</p>}

        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="button" variant="outline" disabled={saving} onClick={() => saveDocument('draft')} className="flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Draft
          </Button>
          <Button type="button" disabled={saving} onClick={() => saveDocument(isInvoice ? 'sent' : 'sent')} className="flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Send {isInvoice ? 'Invoice' : 'Quote'}
          </Button>
          {savedDocId && (
            <Button type="button" variant="secondary" disabled={saving} onClick={downloadPDF} className="flex items-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
              Download PDF
            </Button>
          )}
        </div>
      </div>
        </div>
        {/* END LEFT COLUMN */}

        {/* RIGHT: Live Preview */}
        {!isInvoice && (
          <div className="lg:col-span-5 hidden lg:block">
            <div className="sticky top-20 bg-white border border-grey-medium/10 rounded-base shadow-sm overflow-hidden">
              <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: workshopPrimaryColor }}>
                <span className="text-sm font-bold uppercase tracking-wide text-white">Quote Preview</span>
                <span className="text-xs text-white/60">{customerName || 'Customer'}</span>
              </div>

              <div className="p-5 flex flex-col gap-3 text-sm">
                <div className="text-center pb-3 border-b border-grey-light">
                  {workshopLogo && (
                    <img src={workshopLogo} alt="" className="h-10 mx-auto mb-2 object-contain" />
                  )}
                  <p className="font-bold text-grey-dark text-base">{workshopName || 'Your Workshop'}</p>
                  <p className="text-xs text-grey-medium">Quote #{isEdit ? '—' : 'Auto-generated'}</p>
                  {(workshopPhone || workshopEmail) && (
                    <div className="flex justify-center gap-3 mt-1 text-xs text-grey-medium">
                      {workshopPhone && <span>{workshopPhone}</span>}
                      {workshopEmail && <span>{workshopEmail}</span>}
                    </div>
                  )}
                  {workshopAddress && (
                    <p className="text-xs text-grey-medium mt-1">{workshopAddress}</p>
                  )}
                </div>

                {(customerName || vehicleMake) && (
                  <div className="flex flex-col gap-1.5 text-xs">
                    {customerName && <p><strong className="text-grey-dark">Customer:</strong> <span className="text-grey">{customerName}</span></p>}
                    {customerPhone && <p><strong className="text-grey-dark">Phone:</strong> <span className="text-grey">{customerPhone}</span></p>}
                    {serviceType && <p><strong className="text-grey-dark">Service:</strong> <span className="text-grey">{serviceType}</span></p>}
                    {[vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(' ') && (
                      <p><strong className="text-grey-dark">Vehicle:</strong> <span className="text-grey">{[vehicleYear, vehicleMake, vehicleModel].filter(Boolean).join(' ')}</span></p>
                    )}
                  </div>
                )}

                {description && (
                  <div className="text-xs text-grey leading-relaxed py-1 border-t border-grey-light">{description}</div>
                )}

                {rows.filter(r => r.name).length > 0 && (
                  <div className="border-t border-grey-light pt-2">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-grey-medium border-b border-grey-light/50">
                          <th className="text-left py-1 font-semibold">Item</th>
                          <th className="text-center py-1 font-semibold w-10">Qty</th>
                          <th className="text-right py-1 font-semibold w-20">Price</th>
                          <th className="text-right py-1 font-semibold w-20">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.filter(r => r.name).map((row) => (
                          <tr key={row.id} className="border-b border-grey-light/30 text-grey-dark">
                            <td className="py-1.5">{row.name}</td>
                            <td className="text-center py-1.5">{row.qty}</td>
                            <td className="text-right py-1.5">{formatCurrency(row.unitPrice)}</td>
                            <td className="text-right py-1.5 font-semibold">{formatCurrency(row.qty * row.unitPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="text-grey-dark">
                          <td colSpan={3} className="text-right py-1.5 font-semibold">Subtotal</td>
                          <td className="text-right py-1.5 font-bold">{formatCurrency(subtotal)}</td>
                        </tr>
                        {discountAmount > 0 && (
                          <tr className="text-error">
                            <td colSpan={3} className="text-right py-1 text-xs">Discount ({discountPercent}%)</td>
                            <td className="text-right py-1 font-semibold">-{formatCurrency(discountAmount)}</td>
                          </tr>
                        )}
                        <tr className="border-t-2 border-grey-dark text-base">
                          <td colSpan={3} className="text-right py-2 font-bold">Total</td>
                          <td className="text-right py-2 font-extrabold text-primary">{formatCurrency(total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {(depositPercent > 0 || depositAmount) && (
                  <div className="bg-green-50 border border-green-200 rounded-base p-3 text-xs">
                    <p className="font-bold text-green-800 mb-1">Deposit Required</p>
                    <p className="text-green-700">
                      {depositPercent > 0 && `${depositPercent}%`}
                      {depositPercent > 0 && depositAmount && ' — '}
                      {depositAmount && formatCurrency(Number(depositAmount))}
                      {!depositAmount && depositPercent > 0 && ` (${formatCurrency(total * depositPercent / 100)})`}
                    </p>
                  </div>
                )}

                {expiryDays > 0 && (
                  <p className="text-xs text-grey-medium">Valid for: {expiryDays} days</p>
                )}

                {workshopBanking && (
                  <div className="border-t border-grey-light pt-2 text-xs">
                    <p className="font-semibold text-grey-dark mb-1">Banking Details</p>
                    <div className="text-grey-medium space-y-0.5">
                      {workshopBanking.bankName && <p>Bank: {workshopBanking.bankName}</p>}
                      {workshopBanking.accountHolder && <p>Account Holder: {workshopBanking.accountHolder}</p>}
                      {workshopBanking.accountNumber && <p>Account: {workshopBanking.accountNumber}</p>}
                      {workshopBanking.branchCode && <p>Branch Code: {workshopBanking.branchCode}</p>}
                    </div>
                  </div>
                )}

                {(workshopTerms || workshopFooter) && (
                  <div className="border-t border-grey-light pt-2 text-xs">
                    <p className="font-semibold text-grey-dark mb-1">Terms & Conditions</p>
                    {workshopTerms && <p className="text-grey-medium leading-relaxed">{workshopTerms}</p>}
                    {workshopFooter && <p className="text-grey-medium leading-relaxed mt-1">{workshopFooter}</p>}
                  </div>
                )}

                {notes && (
                  <div className="border-t border-grey-light pt-2 text-xs text-grey-medium italic">{notes}</div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* END RIGHT COLUMN */}
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
  onAddLine,
}: {
  rows: DocumentLineItem[]
  subtotal: number
  discountPercent: number
  discountAmount: number
  total: number
  updateRow: (id: string, patch: Partial<DocumentLineItem>) => void
  removeRow: (id: string) => void
  onAddLine: () => void
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
      <div className="mt-3">
        <Button type="button" variant="outline" onClick={onAddLine} className="flex items-center gap-2">
          <Plus size={16} />
          Add line item
        </Button>
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
