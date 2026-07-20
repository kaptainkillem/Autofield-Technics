/**
 * Email templates — organized by category.
 *
 * Structure:
 *   lib/email-templates/
 *     ├── index.ts          ← barrel (this file)
 *     ├── types.ts          ← shared interfaces
 *     ├── helpers.ts        ← renderTemplate, escapeHtml, getDefaultTemplate, buildTemplateEmail
 *     ├── quotes.ts         ← quote_ready, quote_accepted_alert, quote_declined_alert
 *     ├── appointments.ts   ← appointment_confirmation
 *     ├── work-orders.ts    ← work_order_status_update, work_order_revision
 *     ├── invoices.ts       ← invoice_sent
 *     └── account.ts        ← post_service_thank_you
 *
 * To add a new template:
 *   1. Add it to the appropriate category file
 *   2. Import and add to DEFAULT_TEMPLATES below
 *
 * email_templates table can override any default per workshop.
 */

import type { TemplateDef, TemplatePayload } from './types'
import { QUOTE_TEMPLATES } from './quotes'
import { APPOINTMENT_TEMPLATES } from './appointments'
import { WORK_ORDER_TEMPLATES } from './work-orders'
import { INVOICE_TEMPLATES } from './invoices'
import { ACCOUNT_TEMPLATES } from './account'

export type { TemplateDef, TemplatePayload }

export { renderTemplate, getDefaultTemplate, buildTemplateEmail } from './helpers'

export const DEFAULT_TEMPLATES: Record<string, TemplateDef> = {
  ...QUOTE_TEMPLATES,
  ...APPOINTMENT_TEMPLATES,
  ...WORK_ORDER_TEMPLATES,
  ...INVOICE_TEMPLATES,
  ...ACCOUNT_TEMPLATES,
}

// ── Legacy builders ──────────────────────────────────────────────────

import { SITE_CONFIG } from '@/lib/site-config'
import { renderTemplate } from './helpers'

interface QuoteWebhookPayload {
  id: string
  customer_name: string
  customer_phone?: string
  vehicle_make?: string
  vehicle_model?: string
  vehicle_year?: string
  service_type?: string
  description?: string
}

export function buildQuoteNotificationEmail(payload: QuoteWebhookPayload): {
  subject: string
  text: string
  html: string
} {
  const def = DEFAULT_TEMPLATES['quote_notification_admin']
  if (def) {
    const vars: Record<string, string> = {
      customerName: payload.customer_name,
      customerPhone: payload.customer_phone || 'N/A',
      vehicleInfo: [payload.vehicle_year, payload.vehicle_make, payload.vehicle_model].filter(Boolean).join(' ') || 'N/A',
      serviceType: payload.service_type || 'General Repair',
      description: payload.description || '',
      dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/dashboard/admin/quotes`,
    }
    return {
      subject: renderTemplate(def.subject, vars),
      text: renderTemplate(def.text, vars),
      html: renderTemplate(def.html, vars),
    }
  }
  const subject = `New Quote Request from ${payload.customer_name}`
  const text = `Customer: ${payload.customer_name}\nPhone: ${payload.customer_phone || 'N/A'}\nVehicle: ${[payload.vehicle_year, payload.vehicle_make, payload.vehicle_model].filter(Boolean).join(' ') || 'N/A'}\nService: ${payload.service_type || 'General Repair'}`
  const html = `<div style="font-family:system-ui,sans-serif;padding:24px;color:#1f2937;"><h2>New Quote Request</h2><p><strong>Customer:</strong> ${payload.customer_name}</p><p><strong>Phone:</strong> ${payload.customer_phone || 'N/A'}</p><p><strong>Vehicle:</strong> ${[payload.vehicle_year, payload.vehicle_make, payload.vehicle_model].filter(Boolean).join(' ') || 'N/A'}</p><p><strong>Service:</strong> ${payload.service_type || 'General Repair'}</p></div>`
  return { subject, text, html }
}

interface QuoteReadyPayload {
  customerName: string
  customerEmail: string
  vehicleInfo: string
  serviceType: string
  quoteNumber: string
  quoteId: string
  quoteToken: string
  total: string
}

export function buildQuoteReadyCustomerEmail(payload: QuoteReadyPayload): {
  subject: string
  text: string
  html: string
} {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://autofieldtechnics.co.za'
  const quoteUrl = `${siteUrl}/quote/${payload.quoteId}?token=${payload.quoteToken}`

  const def = DEFAULT_TEMPLATES['quote_ready']
  if (def) {
    const vars: Record<string, string> = {
      customerName: payload.customerName,
      quoteNumber: payload.quoteNumber,
      serviceType: payload.serviceType,
      vehicleInfo: payload.vehicleInfo,
      total: payload.total,
      quoteUrl,
      businessName: SITE_CONFIG.name,
      businessPhone: SITE_CONFIG.phone,
      expiryDate: '',
    }
    return {
      subject: renderTemplate(def.subject, vars),
      text: renderTemplate(def.text, vars),
      html: renderTemplate(def.html, vars),
    }
  }

  const subject = `Your quote from ${SITE_CONFIG.name} is ready`
  const text = `Hi ${payload.customerName},\n\nYour quote (${payload.quoteNumber}) for ${payload.serviceType} is ready.\nVehicle: ${payload.vehicleInfo}\nTotal: ${payload.total}\n\nView: ${quoteUrl}`
  const html = `<div style="font-family:system-ui,sans-serif;padding:24px;color:#1f2937;"><h2>${SITE_CONFIG.name}</h2><p>Hi ${payload.customerName},</p><p>Your quote <strong>${payload.quoteNumber}</strong> for <strong>${payload.serviceType}</strong> is ready.</p><p>Vehicle: ${payload.vehicleInfo}</p><p>Total: <strong style="color:#5B9BD5;">${payload.total}</strong></p><a href="${quoteUrl}" style="display:inline-block;background:#28A745;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:700;">View & Approve Quote</a></div>`
  return { subject, text, html }
}
