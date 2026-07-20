import type { TemplateDef } from './types'

export const INVOICE_TEMPLATES: Record<string, TemplateDef> = {
  invoice_sent: {
    subject: 'Your invoice from {{businessName}}',
    text: [
      'Hi {{customerName}},',
      '',
      'Your invoice {{invoiceNumber}} is ready.',
      '',
      'Total due: {{total}}',
      'Due date: {{dueDate}}',
      '',
      'View invoice: {{invoiceUrl}}',
      '',
      'Banking details:',
      'Bank: {{bankName}}',
      'Account: {{accountNumber}}',
      'Branch: {{branchCode}}',
    ].join('\n'),
    html: [
      '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">',
      '<h2>{{businessName}}</h2>',
      '<p>Hi {{customerName}}, your invoice is ready.</p>',
      '<table style="width:100%;margin:16px 0;"><tr><td><strong>Invoice</strong></td><td>{{invoiceNumber}}</td></tr><tr><td><strong>Total Due</strong></td><td style="font-size:18px;font-weight:700;color:#5B9BD5;">{{total}}</td></tr><tr><td><strong>Due Date</strong></td><td>{{dueDate}}</td></tr></table>',
      '<div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0;">',
      '<p><strong>Banking Details</strong></p>',
      '<p>Bank: {{bankName}}<br>Account: {{accountNumber}}<br>Branch: {{branchCode}}</p>',
      '</div>',
      '<a href="{{invoiceUrl}}" style="display:inline-block;background:#28A745;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:700;">View Invoice</a>',
      '</div>',
    ].join(''),
  },
}
