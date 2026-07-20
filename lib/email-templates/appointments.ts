import type { TemplateDef } from './types'

export const APPOINTMENT_TEMPLATES: Record<string, TemplateDef> = {
  appointment_confirmation: {
    subject: 'Your appointment is confirmed — {{appointmentDate}}',
    text: [
      'Hi {{customerName}},',
      '',
      'Your appointment is confirmed:',
      '',
      'Date: {{appointmentDate}}',
      'Time: {{appointmentTime}}',
      'Service: {{serviceType}}',
      'Vehicle: {{vehicleInfo}}',
      '',
      'Location: {{businessAddress}}',
      '',
      'Please arrive 10 minutes early and bring your keys.',
      'Questions? Call {{businessPhone}}.',
    ].join('\n'),
    html: [
      '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">',
      '<h2>{{businessName}}</h2>',
      '<p>Hi {{customerName}}, your appointment is confirmed.</p>',
      '<div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0;">',
      '<p><strong>{{appointmentDate}}</strong> at <strong>{{appointmentTime}}</strong></p>',
      '<p>{{serviceType}} &middot; {{vehicleInfo}}</p>',
      '<p style="font-size:12px;">{{businessAddress}}</p>',
      '</div>',
      '<p style="font-size:12px;">Please arrive 10 minutes early with your wheel lock key if applicable.</p>',
      '<a href="tel:{{businessPhone}}" style="display:inline-block;background:#5B9BD5;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;">Call {{businessPhone}}</a>',
      '</div>',
    ].join(''),
  },
}
