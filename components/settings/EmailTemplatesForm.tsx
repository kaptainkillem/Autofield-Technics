'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, Save, RotateCcw, Eye, Code2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TemplateData {
  template_key: string
  subject: string
  html_body: string
  text_body: string
  has_override: boolean
  updated_at: string | null
}

const TEMPLATE_LABELS: Record<string, string> = {
  quote_ready: 'Quote Ready (Customer)',
  quote_accepted_alert: 'Quote Accepted (Admin)',
  quote_declined_alert: 'Quote Declined (Admin)',
  quote_notification_admin: 'New Quote (Admin)',
  appointment_confirmation: 'Appointment Confirmed (Customer)',
  work_order_status_update: 'Work Order Status (Customer)',
  work_order_revision: 'Additional Work (Customer)',
  invoice_sent: 'Invoice Sent (Customer)',
  post_service_thank_you: 'Thank You (Customer)',
  quote_submitted_confirmation: 'Quote Received (Customer)',
  contact_form: 'Contact Form (Admin)',
}

const TEMPLATE_VARIABLES: Record<string, string[]> = {
  quote_ready: ['customerName', 'quoteNumber', 'vehicleInfo', 'serviceType', 'total', 'quoteUrl', 'expiryDate', 'businessName', 'businessPhone'],
  quote_accepted_alert: ['customerName', 'customerPhone', 'vehicleInfo', 'quoteNumber', 'total', 'dashboardUrl'],
  quote_declined_alert: ['customerName', 'customerPhone', 'vehicleInfo', 'quoteNumber', 'total'],
  quote_notification_admin: ['customerName', 'customerPhone', 'vehicleInfo', 'serviceType', 'description', 'dashboardUrl'],
  appointment_confirmation: ['customerName', 'appointmentDate', 'appointmentTime', 'serviceType', 'vehicleInfo', 'businessName', 'businessAddress', 'businessPhone'],
  work_order_status_update: ['customerName', 'vehicleInfo', 'status', 'statusLabel', 'businessName', 'businessPhone'],
  work_order_revision: ['customerName', 'vehicleInfo', 'revisionNotes', 'revisionTotal', 'revisionUrl'],
  invoice_sent: ['customerName', 'invoiceNumber', 'total', 'dueDate', 'invoiceUrl', 'bankName', 'accountNumber', 'branchCode'],
  post_service_thank_you: ['customerName', 'vehicleInfo', 'businessName', 'businessPhone', 'reviewUrl'],
  quote_submitted_confirmation: ['customerName', 'vehicleInfo', 'serviceType', 'businessName'],
  contact_form: ['name', 'email', 'phone', 'message', 'businessName'],
}

const SAMPLE_DATA: Record<string, Record<string, string>> = {
  quote_ready: { customerName: 'John Doe', quoteNumber: 'Q-2026-001', vehicleInfo: '2020 Toyota Hilux', serviceType: 'Major Service', total: 'R 3,500.00', quoteUrl: 'https://example.com/quote/abc123', expiryDate: '31 Dec 2026', businessName: 'Your Workshop', businessPhone: '+27 12 345 6789' },
  quote_accepted_alert: { customerName: 'John Doe', customerPhone: '+27 82 123 4567', vehicleInfo: '2020 Toyota Hilux', quoteNumber: 'Q-2026-001', total: 'R 3,500.00', dashboardUrl: 'https://example.com/dashboard/admin/quotes' },
  work_order_status_update: { customerName: 'John Doe', vehicleInfo: '2020 Toyota Hilux', status: 'in_progress', statusLabel: 'Work In Progress', businessName: 'Your Workshop', businessPhone: '+27 12 345 6789' },
  invoice_sent: { customerName: 'John Doe', invoiceNumber: 'INV-2026-001', total: 'R 3,500.00', dueDate: '31 Dec 2026', invoiceUrl: 'https://example.com/invoice/abc', bankName: 'FNB', accountNumber: '62012345678', branchCode: '250655' },
}

interface EmailTemplatesFormProps {
  workshopId: string | null
}

export function EmailTemplatesForm({ workshopId }: EmailTemplatesFormProps) {
  const [templates, setTemplates] = useState<TemplateData[]>([])
  const [selectedKey, setSelectedKey] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [subject, setSubject] = useState('')
  const [htmlBody, setHtmlBody] = useState('')
  const [textBody, setTextBody] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewing, setPreviewing] = useState(false)
  const [sampleVars, setSampleVars] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchTemplates()
  }, [workshopId])

  async function fetchTemplates() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/email-templates')
      if (!res.ok) throw new Error('Failed')
      const { templates: data } = await res.json()
      setTemplates(data ?? [])
      if (data?.length > 0 && !selectedKey) {
        selectTemplate(data[0])
      }
    } catch {
      toast.error('Failed to load email templates')
    } finally {
      setLoading(false)
    }
  }

  function selectTemplate(t: TemplateData) {
    setSelectedKey(t.template_key)
    setSubject(t.subject)
    setHtmlBody(t.html_body)
    setTextBody(t.text_body || '')
    const defaults = SAMPLE_DATA[t.template_key] || {}
    setSampleVars(defaults)
    setPreviewHtml('')
  }

  function insertVariable(varName: string) {
    setHtmlBody((prev) => prev + `{{${varName}}}`)
  }

  async function handlePreview() {
    setPreviewing(true)
    try {
      const res = await fetch('/api/admin/email-templates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_key: selectedKey,
          subject,
          html_body: htmlBody,
          text_body: textBody,
          variables: sampleVars,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const { html } = await res.json()
      setPreviewHtml(html)
    } catch {
      toast.error('Preview failed')
    } finally {
      setPreviewing(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/email-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_key: selectedKey,
          subject,
          html_body: htmlBody,
          text_body: textBody,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Template saved!')
      await fetchTemplates()
    } catch {
      toast.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (!confirm('Reset this template to default? Your changes will be lost.')) return
    try {
      const res = await fetch(`/api/admin/email-templates?key=${selectedKey}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Template reset to default')
      await fetchTemplates()
    } catch {
      toast.error('Failed to reset template')
    }
  }

  const selected = templates.find((t) => t.template_key === selectedKey)
  const vars = TEMPLATE_VARIABLES[selectedKey] || []

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 flex flex-col gap-2">
          <h4 className="text-xs font-bold text-grey uppercase tracking-wide">Templates</h4>
          <div className="flex flex-col gap-0.5 max-h-[500px] overflow-y-auto border border-grey-light rounded-base">
            {templates.map((t) => (
              <button
                key={t.template_key}
                onClick={() => selectTemplate(t)}
                className={`text-left px-3 py-2.5 text-sm transition-colors ${
                  selectedKey === t.template_key
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-grey hover:bg-grey-lightest'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{TEMPLATE_LABELS[t.template_key] || t.template_key.replace(/_/g, ' ')}</span>
                  {t.has_override && <span className="w-2 h-2 rounded-full bg-amber-500" title="Customized" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {selected && (
          <div className="lg:col-span-9 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-grey-dark">
                  {TEMPLATE_LABELS[selectedKey] || selectedKey}
                </h3>
                {selected.has_override && (
                  <p className="text-xs text-amber-600">Customized — last saved {selected.updated_at ? new Date(selected.updated_at).toLocaleDateString() : ''}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handlePreview}
                  disabled={previewing}
                  variant="outline"
                  className="flex items-center gap-1.5 text-xs"
                >
                  {previewing ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                  Preview
                </Button>
                {selected.has_override && (
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex items-center gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <RotateCcw size={14} />
                    Reset
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs bg-primary text-white"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-grey uppercase tracking-wide">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-base border border-grey-light bg-white py-2 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 text-grey-dark"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-grey uppercase tracking-wide flex items-center gap-1">
                  <Code2 size={12} /> HTML Body
                </label>
                <textarea
                  value={htmlBody}
                  onChange={(e) => setHtmlBody(e.target.value)}
                  rows={12}
                  className="w-full rounded-base border border-grey-light bg-white py-2 px-3 text-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 text-grey-dark resize-y"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-grey uppercase tracking-wide flex items-center gap-1">
                  <Mail size={12} /> Plain Text Body
                </label>
                <textarea
                  value={textBody}
                  onChange={(e) => setTextBody(e.target.value)}
                  rows={4}
                  className="w-full rounded-base border border-grey-light bg-white py-2 px-3 text-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 text-grey-dark resize-y"
                />
              </div>

              {vars.length > 0 && (
                <div className="bg-grey-lightest border border-grey-light rounded-base p-3">
                  <p className="text-xs font-semibold text-grey uppercase tracking-wide mb-2">Variables</p>
                  <div className="flex flex-wrap gap-1.5">
                    {vars.map((v) => (
                      <button
                        key={v}
                        onClick={() => insertVariable(v)}
                        className="px-2 py-1 bg-white border border-grey-light rounded text-xs text-primary font-mono hover:bg-primary/5 transition-colors"
                        title="Click to insert"
                      >
                        {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(sampleVars).length > 0 && (
                <div className="bg-grey-lightest border border-grey-light rounded-base p-3">
                  <p className="text-xs font-semibold text-grey uppercase tracking-wide mb-2">Preview Data (edit to test)</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(sampleVars).map(([key, value]) => (
                      <div key={key}>
                        <label className="text-[10px] text-grey-medium">{key}</label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setSampleVars((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="w-full rounded border border-grey-light px-2 py-1 text-xs text-grey-dark focus:border-primary focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {previewHtml && (
              <div className="border border-primary/20 rounded-base overflow-hidden">
                <div className="bg-primary/5 px-4 py-2 border-b border-primary/10">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1">
                    <Eye size={12} /> Live Preview
                  </p>
                </div>
                <div
                  className="p-4 bg-white"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
