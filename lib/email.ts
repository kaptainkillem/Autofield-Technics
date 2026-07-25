import { Resend } from 'resend'
import { createTransport } from 'nodemailer'
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

interface EmailProviderConfig {
  email_provider: string | null
  email_from: string | null
  email_display_name: string | null
  email_reply_to: string | null
  admin_notification_email: string | null
  smtp_host: string | null
  smtp_port: number | null
  smtp_username: string | null
  smtp_password: string | null
  smtp_secure: boolean | null
}

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.error('[email] RESEND_API_KEY is missing')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

async function fetchEmailConfig(workshopId?: string | null): Promise<EmailProviderConfig | null> {
  if (!workshopId) return null

  try {
    const { createSuperAdminClient } = await import('@/lib/super-admin')
    const adminClient = createSuperAdminClient()
    const { data } = await adminClient
      .from('business_settings')
      .select('email_provider, email_from, email_display_name, email_reply_to, admin_notification_email, smtp_host, smtp_port, smtp_username, smtp_password, smtp_secure')
      .eq('workshop_id', workshopId)
      .maybeSingle()

    return (data as EmailProviderConfig) ?? null
  } catch {
    return null
  }
}

async function resolveSender(workshopId?: string | null): Promise<{
  from: string
  replyTo?: string
  config: EmailProviderConfig | null
}> {
  const defaultName = 'Autofield Technics'
  const defaultFrom = `Autofield Technics <onboarding@resend.dev>`
  const config = await fetchEmailConfig(workshopId)

  if (!config) {
    return { from: process.env.EMAIL_FROM || defaultFrom, config: null }
  }

  const name = config.email_display_name || defaultName
  const from = config.email_from || process.env.EMAIL_FROM || `${name} <onboarding@resend.dev>`

  return {
    from,
    replyTo: config.email_reply_to ?? undefined,
    config,
  }
}

export async function getWorkshopAdminEmail(workshopId: string): Promise<string> {
  try {
    const { createSuperAdminClient } = await import('@/lib/super-admin')
    const adminClient = createSuperAdminClient()
    const { data } = await adminClient
      .from('business_settings')
      .select('contact_email, admin_notification_email')
      .eq('workshop_id', workshopId)
      .maybeSingle()
    return data?.admin_notification_email
      || data?.contact_email
      || process.env.ADMIN_NOTIFICATION_EMAIL
      || ''
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
    const provider = sender.config?.email_provider || 'resend'
    let result: { success: boolean; error?: string; messageId?: string }

    if (provider === 'smtp' && sender.config?.smtp_host) {
      result = await sendViaSMTP({
        host: sender.config.smtp_host,
        port: sender.config.smtp_port || 587,
        secure: sender.config.smtp_secure ?? false,
        user: sender.config.smtp_username || '',
        pass: sender.config.smtp_password || '',
        from: sender.from,
        to: params.to,
        subject,
        html,
        text,
        replyTo: params.replyTo || sender.replyTo,
      })
    } else {
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

      const resend = getResend()
      const { data, error } = await resend.emails.send(emailConfig)

      if (error) {
        result = { success: false, error: error.message }
      } else {
        result = { success: true, messageId: data?.id }
      }
    }

    if (!result.success) {
      console.error('[email] Send failed:', result.error)
      await logEmail({
        workshopId: params.workshopId ?? null,
        templateKey: params.templateKey,
        toEmail: params.to,
        fromDisplay: sender.from,
        subject,
        status: 'failed',
        errorMessage: result.error,
      })
      return { success: false, error: result.error }
    }

    await logEmail({
      workshopId: params.workshopId ?? null,
      templateKey: params.templateKey,
      toEmail: params.to,
      fromDisplay: sender.from,
      subject,
      status: 'sent',
      metadata: { messageId: result.messageId },
    })

    console.log('[email] Sent successfully to', params.to)
    return { success: true, messageId: result.messageId }
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

// ── SMTP transport ──────────────────────────────────────────────

interface SMTPParams {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

async function sendViaSMTP(params: SMTPParams): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const transport = createTransport({
      host: params.host,
      port: params.port,
      secure: params.secure,
      auth: {
        user: params.user,
        pass: params.pass,
      },
    })

    const info = await transport.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
    })

    return { success: true, messageId: info.messageId }
  } catch (err: any) {
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
