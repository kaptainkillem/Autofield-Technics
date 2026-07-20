import type { TemplateDef } from './types'

export const ACCOUNT_TEMPLATES: Record<string, TemplateDef> = {
  post_service_thank_you: {
    subject: 'Thanks for choosing {{businessName}}',
    text: [
      'Hi {{customerName}},',
      '',
      'Thank you for trusting {{businessName}} with your {{vehicleInfo}}.',
      '',
      'We hope you are satisfied with our work. If you have a moment, please leave us a review:',
      '',
      '{{reviewUrl}}',
      '',
      'Thanks again,',
      '{{businessName}}',
    ].join('\n'),
    html: [
      '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">',
      '<h2>{{businessName}}</h2>',
      '<p>Hi {{customerName}},</p>',
      '<p>Thank you for choosing us to service your <strong>{{vehicleInfo}}</strong>. We hope everything is running smoothly.</p>',
      '<a href="{{reviewUrl}}" style="display:inline-block;background:#F59E0B;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:700;">Leave a Review</a>',
      '<p style="font-size:12px;color:#9ca3af;margin-top:16px;">{{businessName}} &middot; {{businessPhone}}</p>',
      '</div>',
    ].join(''),
  },
}
