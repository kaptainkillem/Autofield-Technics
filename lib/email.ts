import { Resend } from 'resend'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { buildQuoteReadyCustomerEmail, getDefaultTemplate, DEFAULT_TEMPLATES, renderTemplate } from '@/lib/email-templates'

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string | null
  workshopId?: string | null
  templateKey: string
  variables?: Record<string, string>
}

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.error('[email] RESEND_API_KEY is missing')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

async function resolveSender(workshopId?: string | null): Promise<{ from: string; replyTo?: string }> {
  const defaultName = 'Autofield Technics'
  const defaultFrom = `Autofield Technics <onboarding@resend.dev>`

  if (!workshopId) {
    return { from: process.env.EMAIL_FROM || defaultFrom }
  }

  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('business_settings')
      .select('email_display_name, email_reply_to')
      .eq('workshop_id', workshopId)
      .maybeSingle()

    const name = data?.email_display_name || defaultName
    const from = process.env.EMAIL_FROM || `${name} <onboarding@resend.dev>`

    return {
      from,
      replyTo: data?.email_reply_to ?? undefined,
    }
  } catch {
    return { from: process.env.EMAIL_FROM || defaultFrom }
  }
}

export async function getWorkshopAdminEmail(workshopId: string): Promise<string> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('business_settings')
      .select('contact_email')
      .eq('workshop_id', workshopId)
      .maybeSingle()
    return data?.contact_email || process.env.ADMIN_NOTIFICATION_EMAIL || ''
  } catch {
    return process.env.ADMIN_NOTIFICATION_EMAIL || ''
  }
}

async function resolveTemplate(
  templateKey: string,
  workshopId?: string | null,
  fallbackSubject?: string,
  fallbackHtml?: string,
  fallbackText?: string,
): Promise<{ subject: string; html: string; text: string }> {
  // Try per-workshop override from email_templates table
  if (workshopId) {
    try {
      const supabase = await createSupabaseServerClient()
      const { data } = await supabase
        .from('email_templates')
        .select('subject, html_body, text_body')
        .eq('workshop_id', workshopId)
        .eq('template_key', templateKey)
        .maybeSingle()

      if (data) {
        return {
          subject: data.subject,
          html: data.html_body,
          text: data.text_body || '',
        }
      }
    } catch {}
  }

  // Fall back to hardcoded default
  if (fallbackSubject && fallbackHtml) {
    return {
      subject: fallbackSubject,
      html: fallbackHtml,
      text: fallbackText || '',
    }
  }

  // Last resort: use default template from code
  const def = getDefaultTemplate(templateKey, DEFAULT_TEMPLATES)
  if (def) {
    return { subject: def.subject, html: def.html, text: def.text }
  }

  throw new Error(`No template found for key: ${templateKey}`)
}

async function logEmail(params: {
  workshopId: string | null
  templateKey: string
  toEmail: string
  fromDisplay: string
  subject: string
  status: 'sent' | 'failed'
  errorMessage?: string
  metadata?: Record<string, unknown>
}) {
  try {
    const supabase = await createSupabaseServerClient()
    await supabase.from('email_logs').insert({
      workshop_id: params.workshopId,
      template_key: params.templateKey,
      to_email: params.toEmail,
      from_display: params.fromDisplay,
      subject: params.subject,
      status: params.status,
      error_message: params.errorMessage ?? null,
      metadata: params.metadata ?? null,
    } as any)
  } catch {}
}

export async function sendEmail(params: SendEmailParams) {
  const resend = getResend()
  const sender = await resolveSender(params.workshopId)

  // Resolve template (override from DB → hardcoded default)
  let subject = params.subject
  let html = params.html
  let text = params.text || ''
  try {
    const resolved = await resolveTemplate(
      params.templateKey,
      params.workshopId ?? null,
      params.subject,
      params.html,
      params.text,
    )
    // Apply variable substitution if variables provided
    if (params.variables && Object.keys(params.variables).length > 0) {
      subject = renderTemplate(resolved.subject, params.variables)
      html = renderTemplate(resolved.html, params.variables)
      text = renderTemplate(resolved.text, params.variables)
    } else {
      subject = resolved.subject
      html = resolved.html
      text = resolved.text
    }
  } catch {}

  try {
    const emailConfig: any = {
      from: sender.from,
      to: params.to,
      subject,
      html,
    }
    if (text) emailConfig.text = text
    if (params.replyTo || sender.replyTo) {
      emailConfig.replyTo = params.replyTo || sender.replyTo
    }

    const { data, error } = await resend.emails.send(emailConfig)

    if (error) {
      console.error('[email] Resend send failed:', error.message)
      await logEmail({
        workshopId: params.workshopId ?? null,
        templateKey: params.templateKey,
        toEmail: params.to,
        fromDisplay: sender.from,
        subject,
        status: 'failed',
        errorMessage: error.message,
      })
      return { success: false, error: error.message }
    }

    await logEmail({
      workshopId: params.workshopId ?? null,
      templateKey: params.templateKey,
      toEmail: params.to,
      fromDisplay: sender.from,
      subject,
      status: 'sent',
      metadata: { messageId: data?.id },
    })

    console.log('[email] Sent successfully to', params.to)
    return { success: true, messageId: data?.id }
  } catch (err: any) {
    console.error('[email] Send exception:', err.message)
    await logEmail({
      workshopId: params.workshopId ?? null,
      templateKey: params.templateKey,
      toEmail: params.to,
      fromDisplay: sender.from,
      subject,
      status: 'failed',
      errorMessage: err.message,
    })
    return { success: false, error: err.message }
  }
}

// ── Template-based email sender ───────────────────────────────────────

interface SendTemplateParams {
  templateKey: string
  to: string
  variables: Record<string, string>
  workshopId?: string | null
  replyTo?: string | null
}

export async function sendTemplateEmail(params: SendTemplateParams) {
  const def = getDefaultTemplate(params.templateKey, DEFAULT_TEMPLATES)
  if (!def) {
    console.error(`[email] No default template for key: ${params.templateKey}`)
    return { success: false, error: 'Template not found' }
  }

  return sendEmail({
    to: params.to,
    subject: def.subject,
    html: def.html,
    text: def.text,
    templateKey: params.templateKey,
    workshopId: params.workshopId ?? null,
    variables: params.variables,
    replyTo: params.replyTo ?? null,
  })
}

// ── Specific email senders ──────────────────────────────────────────

interface QuoteReadyParams {
  customerName: string
  customerEmail: string
  vehicleInfo: string
  serviceType: string
  quoteNumber: string
  quoteId: string
  quoteToken: string
  total: string
  workshopId?: string | null
}

export async function sendQuoteReadyEmail(params: QuoteReadyParams) {
  if (!params.customerEmail) return

  const { subject, text, html } = buildQuoteReadyCustomerEmail(params)

  return sendEmail({
    to: params.customerEmail,
    subject,
    html,
    text,
    workshopId: params.workshopId ?? null,
    templateKey: 'quote_ready',
  })
}
