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
      <h2 style="color: #3B82F6; margin-bottom: 16px;">🔧 New Quote Request</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr><td style="padding: 8px 0; font-weight: 600;">Customer</td><td>${escapeHtml(payload.customer_name)}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600;">Phone</td><td>${escapeHtml(payload.customer_phone || 'N/A')}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600;">Vehicle</td><td>${escapeHtml([payload.vehicle_year, payload.vehicle_make, payload.vehicle_model].filter(Boolean).join(' ') || 'N/A')}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600;">Service</td><td>${escapeHtml(payload.service_type || 'General Repair')}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600; vertical-align: top;">Description</td><td>${escapeHtml(payload.description || 'No description provided')}</td></tr>
      </table>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/dashboard/admin/quotes" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">View in Dashboard</a>
    </div>
  `

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
