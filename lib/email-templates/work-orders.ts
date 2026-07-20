import type { TemplateDef } from './types'

export const WORK_ORDER_TEMPLATES: Record<string, TemplateDef> = {
  work_order_status_update: {
    subject: 'Update on your {{vehicleInfo}} — {{statusLabel}}',
    text: [
      'Hi {{customerName}},',
      '',
      'Status update for your {{vehicleInfo}}:',
      '',
      'Current status: {{statusLabel}}',
      '',
      'Questions? Call {{businessPhone}}.',
    ].join('\n'),
    html: [
      '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">',
      '<h2>{{businessName}}</h2>',
      '<p>Hi {{customerName}},</p>',
      '<div style="background:#eff6ff;border-radius:8px;padding:16px;margin:16px 0;">',
      '<p style="font-size:18px;font-weight:700;color:#3B82F6;">{{statusLabel}}</p>',
      '<p>Vehicle: <strong>{{vehicleInfo}}</strong></p>',
      '</div>',
      '<a href="tel:{{businessPhone}}" style="display:inline-block;background:#5B9BD5;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;">Call Workshop</a>',
      '</div>',
    ].join(''),
  },

  work_order_revision: {
    subject: 'Additional work approval needed — {{vehicleInfo}}',
    text: [
      'Hi {{customerName}},',
      '',
      'Additional work has been identified for your {{vehicleInfo}}:',
      '',
      '{{revisionNotes}}',
      '',
      'Additional cost: {{revisionTotal}}',
      '',
      'View and approve: {{revisionUrl}}',
    ].join('\n'),
    html: [
      '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">',
      '<h2>{{businessName}}</h2>',
      '<p>Hi {{customerName}},</p>',
      '<p>Our mechanic identified additional work needed on your <strong>{{vehicleInfo}}</strong>:</p>',
      '<div style="background:#fef3c7;border-radius:8px;padding:16px;margin:16px 0;">',
      '<p>{{revisionNotes}}</p>',
      '<p style="font-weight:700;">Additional cost: {{revisionTotal}}</p>',
      '</div>',
      '<a href="{{revisionUrl}}" style="display:inline-block;background:#F59E0B;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:700;">Review & Approve</a>',
      '<p style="font-size:12px;color:#9ca3af;">Your approval is required to proceed.</p>',
      '</div>',
    ].join(''),
  },
}
