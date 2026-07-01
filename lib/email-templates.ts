/**
 * Reusable email templates for webhooks and transactional emails.
 * Centralizes copy so it can be edited in one place.
 */

import { SITE_CONFIG } from './site-config'

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
  const subject = `🔧 New Quote Request from ${payload.customer_name}`

  const text = [
    `New quote request received on ${SITE_CONFIG.name}.`,
    ``,
    `Customer: ${payload.customer_name}`,
    `Phone: ${payload.customer_phone || 'N/A'}`,
    `Vehicle: ${[payload.vehicle_year, payload.vehicle_make, payload.vehicle_model].filter(Boolean).join(' ') || 'N/A'}`,
    `Service: ${payload.service_type || 'General Repair'}`,
    `Description: ${payload.description || 'No description provided'}`,
    ``,
    `View in dashboard: ${process.env.NEXT_PUBLIC_SITE_URL || ''}/dashboard/admin/quotes`,
  ].join('\n')

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <h2 style="color: #5B9BD5; margin-bottom: 16px;">🔧 New Quote Request</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr><td style="padding: 8px 0; font-weight: 600;">Customer</td><td>${escapeHtml(payload.customer_name)}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600;">Phone</td><td>${escapeHtml(payload.customer_phone || 'N/A')}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600;">Vehicle</td><td>${escapeHtml([payload.vehicle_year, payload.vehicle_make, payload.vehicle_model].filter(Boolean).join(' ') || 'N/A')}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600;">Service</td><td>${escapeHtml(payload.service_type || 'General Repair')}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600; vertical-align: top;">Description</td><td>${escapeHtml(payload.description || 'No description provided')}</td></tr>
      </table>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/dashboard/admin/quotes" style="display: inline-block; background: #5B9BD5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">View in Dashboard</a>
    </div>
  `

  return { subject, text, html }
}

interface QuoteReadyPayload {
  customerName: string
  customerEmail: string
  vehicleInfo: string
  serviceType: string
  quoteNumber: string
  quoteId: string
  total: string
}

export function buildQuoteReadyCustomerEmail(payload: QuoteReadyPayload): {
  subject: string
  text: string
  html: string
} {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://autofieldtechnics.co.za'
  const quoteUrl = `${siteUrl}/quote/${payload.quoteId}`

  const subject = `Your quote from ${SITE_CONFIG.name} is ready`

  const text = [
    `Hi ${payload.customerName},`,
    ``,
    `Your quote (${payload.quoteNumber}) for ${payload.serviceType} is ready for review.`,
    ``,
    `Vehicle: ${payload.vehicleInfo}`,
    `Total: ${payload.total}`,
    ``,
    `View, accept or decline your quote online:`,
    `${quoteUrl}`,
    ``,
    `Thank you for choosing ${SITE_CONFIG.name}.`,
  ].join('\n')

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #1f2937; font-size: 24px; margin: 0 0 4px;">${escapeHtml(SITE_CONFIG.name)}</h1>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">Your quote is ready</p>
      </div>

      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <p style="margin: 0 0 12px; font-size: 15px;">Hi ${escapeHtml(payload.customerName)},</p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #4b5563;">
          Your quote <strong>${escapeHtml(payload.quoteNumber)}</strong> for <strong>${escapeHtml(payload.serviceType)}</strong> has been prepared and is ready for your review.
        </p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; font-size: 13px; color: #6b7280; width: 80px;">Vehicle</td>
            <td style="padding: 8px 0; font-size: 14px;">${escapeHtml(payload.vehicleInfo)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; font-size: 13px; color: #6b7280;">Total</td>
            <td style="padding: 8px 0; font-size: 18px; font-weight: 700; color: #5B9BD5;">${escapeHtml(payload.total)}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${quoteUrl}" style="display: inline-block; background: #28A745; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px;">
          View & Accept Quote
        </a>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
          Or copy this link: ${quoteUrl}
        </p>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
        You can accept or decline this quote directly from the link above.<br />
        No account needed — the link is uniquely yours.
      </p>
    </div>
  `.trim()

  return { subject, text, html }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
