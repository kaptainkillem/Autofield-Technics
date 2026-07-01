import { Resend } from 'resend'
import { buildQuoteReadyCustomerEmail } from '@/lib/email-templates'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Autofield Technics <onboarding@resend.dev>'

interface QuoteReadyParams {
  customerName: string
  customerEmail: string
  vehicleInfo: string
  serviceType: string
  quoteNumber: string
  quoteId: string
  total: string
}

export async function sendQuoteReadyEmail(params: QuoteReadyParams) {
  if (!params.customerEmail) {
    console.warn('[email] Skipping quote email — no customer email')
    return
  }

  const { subject, text, html } = buildQuoteReadyCustomerEmail(params)

  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: params.customerEmail,
      subject,
      text,
      html,
    })

    if (error) {
      console.error('[email] Resend error:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
  } catch (err: any) {
    console.error('[email] Send failed:', err)
    return { success: false, error: err.message }
  }
}
