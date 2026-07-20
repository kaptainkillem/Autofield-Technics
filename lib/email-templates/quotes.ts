import type { TemplateDef } from './types'

export const QUOTE_TEMPLATES: Record<string, TemplateDef> = {
  quote_ready: {
    subject: 'Your quote from {{businessName}} is ready',
    text: [
      'Hi {{customerName}},',
      '',
      'Your quote ({{quoteNumber}}) for {{serviceType}} is ready.',
      '',
      'Vehicle: {{vehicleInfo}}',
      'Total: {{total}}',
      '',
      'View or approve: {{quoteUrl}}',
      '',
      'Quote valid until {{expiryDate}}.',
    ].join('\n'),
    html: [
      '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">',
      '<h2>{{businessName}}</h2>',
      '<p>Hi {{customerName}},</p>',
      '<p>Your quote <strong>{{quoteNumber}}</strong> for <strong>{{serviceType}}</strong> is ready.</p>',
      '<table style="width:100%;border-collapse:collapse;margin:16px 0;"><tr><td><strong>Vehicle</strong></td><td>{{vehicleInfo}}</td></tr><tr><td><strong>Total</strong></td><td style="font-size:18px;font-weight:700;color:#5B9BD5;">{{total}}</td></tr></table>',
      '<p>Valid until: {{expiryDate}}</p>',
      '<a href="{{quoteUrl}}" style="display:inline-block;background:#28A745;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:700;">View & Approve Quote</a>',
      '<p style="font-size:12px;color:#9ca3af;margin-top:24px;">{{businessName}} &middot; {{businessPhone}}</p>',
      '</div>',
    ].join(''),
  },

  quote_accepted_alert: {
    subject: 'Quote accepted by {{customerName}}',
    text: [
      'Quote {{quoteNumber}} has been accepted.',
      '',
      'Customer: {{customerName}}',
      'Phone: {{customerPhone}}',
      'Vehicle: {{vehicleInfo}}',
      'Total: {{total}}',
      '',
      'View in dashboard: {{dashboardUrl}}',
    ].join('\n'),
    html: [
      '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">',
      '<h2 style="color:#10B981;">Quote Accepted</h2>',
      '<p><strong>{{customerName}}</strong> accepted quote <strong>{{quoteNumber}}</strong>.</p>',
      '<table style="width:100%;margin:16px 0;"><tr><td>Phone</td><td>{{customerPhone}}</td></tr><tr><td>Vehicle</td><td>{{vehicleInfo}}</td></tr><tr><td>Total</td><td>{{total}}</td></tr></table>',
      '<a href="{{dashboardUrl}}" style="display:inline-block;background:#5B9BD5;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;">View Quote in Dashboard</a>',
      '</div>',
    ].join(''),
  },

  quote_declined_alert: {
    subject: 'Quote declined by {{customerName}}',
    text: [
      'Quote {{quoteNumber}} was declined.',
      '',
      'Customer: {{customerName}}',
      'Phone: {{customerPhone}}',
      'Vehicle: {{vehicleInfo}}',
      'Total: {{total}}',
      '',
      'Contact customer: {{customerPhone}}',
    ].join('\n'),
    html: [
      '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">',
      '<h2 style="color:#EF4444;">Quote Declined</h2>',
      '<p><strong>{{customerName}}</strong> declined quote <strong>{{quoteNumber}}</strong>.</p>',
      '<table style="width:100%;margin:16px 0;"><tr><td>Phone</td><td>{{customerPhone}}</td></tr><tr><td>Vehicle</td><td>{{vehicleInfo}}</td></tr><tr><td>Total</td><td>{{total}}</td></tr></table>',
      '<a href="tel:{{customerPhone}}" style="display:inline-block;background:#5B9BD5;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;">Contact Customer</a>',
      '</div>',
    ].join(''),
  },
}
