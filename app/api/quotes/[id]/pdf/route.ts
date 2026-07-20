import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { createSuperAdminClient } from '@/lib/super-admin'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { renderToBuffer } from '@react-pdf/renderer'
import { QuotePDF } from '@/lib/pdf-templates/QuotePDF'
import { sendQuoteReadyEmail } from '@/lib/email'
import type { PDFDocumentData } from '@/lib/pdf-templates/types'
import type { PDFLineItem } from '@/lib/pdf-templates/shared/LineItemTable'
import type { Json } from '@/types/database'

function parseLineItems(value: Json | null): PDFLineItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null
      const row = item as Record<string, Json>
      return {
        id: String(row.id ?? ''),
        name: String(row.name ?? ''),
        qty: Number(row.qty ?? 1),
        unitPrice: Number(row.unitPrice ?? 0),
      }
    })
    .filter((item): item is PDFLineItem => Boolean(item?.name))
}

async function fetchLogoBase64(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, logoUrl: string | null): Promise<string | null> {
  if (!logoUrl) return null
  try {
    const match = logoUrl.match(/\/logos\/(.+?)(?:\?|$)/)
    const path = match ? match[1] : new URL(logoUrl).pathname.split('/logos/')[1]
    if (!path) return null

    const { data, error } = await supabase.storage.from('logos').download(path)
    if (error || !data) return null

    const buffer = Buffer.from(await data.arrayBuffer())

    const isValidPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47
    const isValidJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF
    if (!isValidPNG && !isValidJPEG) {
      console.warn(`[pdf:logo] Corrupted or invalid image at ${path}; falling back to business name.`)
      return null
    }

    const ext = path.split('.').pop()?.toLowerCase() ?? 'png'
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
    return `data:${mime};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const skipEmail = new URL(request.url).searchParams.get('skipEmail') === 'true'

  const auth = await verifyStaffUser()
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed, remaining } = checkRateLimit(`pdf:${ip}`, { maxRequests: 10, windowMs: 60_000 })
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many PDF requests. Please try again shortly.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  }

  const supabase = await createSupabaseServerClient()

  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single() as any

  if (quoteError || !quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', auth.userId).single() as any,
    supabase.from('business_settings').select('*').eq('workshop_id', auth.workshopId!).single() as any,
  ])

  const logoBase64 = null

  const lineItems = parseLineItems(quote.line_items)
  const subtotal = quote.subtotal ?? lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  const total = quote.total ?? subtotal

  const pdfData: PDFDocumentData = {
    business: {
      companyName: settings?.company_name || settings?.site_name || 'Autofield Technics',
      address: settings?.address ?? null,
      phone: settings?.phone ?? null,
      email: settings?.contact_email ?? null,
      vatNumber: settings?.vat_number ?? null,
      registrationNumber: settings?.registration_number ?? null,
      logoBase64,
    },
    banking: {
      bankName: settings?.bank_name ?? null,
      accountHolder: settings?.account_holder ?? null,
      accountNumber: settings?.account_number ?? null,
      branchCode: settings?.branch_code ?? null,
    },
    terms: [settings?.terms_conditions, settings?.document_footer].filter(Boolean).join('\n\n') || null,
    documentNumber: quote.quote_number ?? quote.id.slice(0, 8),
    documentType: 'Quote',
    createdAt: quote.created_at ?? new Date().toISOString(),
    customerName: quote.customer_name,
    customerEmail: quote.customer_email ?? null,
    customerPhone: quote.customer_phone,
    vehicleInfo: [quote.vehicle_year, quote.vehicle_make, quote.vehicle_model].filter(Boolean).join(' ') || null,
    serviceType: quote.service_type ?? null,
    description: quote.description ?? null,
    notes: quote.notes ?? null,
    lineItems,
    discountPercent: Number(quote.discount_percent ?? 0),
    subtotal,
    total,
    paymentMethod: null,
    depositPercent: Number(quote.deposit_percent ?? 0),
    depositAmount: quote.deposit_amount ?? null,
    expiryDate: quote.expiry_date ?? null,
  }

  try {
    const buffer = await renderToBuffer(QuotePDF({ data: pdfData }))

    const storagePath = `quotes/${id}.pdf`
    const adminClient = createSuperAdminClient()
    const { error: uploadError } = await adminClient.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('PDF upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to store PDF' }, { status: 500 })
    }

    await adminClient
      .from('quotes')
      .update({ pdf_url: storagePath, updated_at: new Date().toISOString() } as never)
      .eq('id', id)

    if (quote.status === 'sent' && quote.customer_email && !skipEmail) {
      const vehicleInfo = [quote.vehicle_year, quote.vehicle_make, quote.vehicle_model].filter(Boolean).join(' ') || 'Not specified'
      const serviceType = quote.service_type ?? 'General Service'
      const totalFormatted = `R ${Number(total).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`

      console.log('[pdf:quote] Sending quote ready email to', quote.customer_email)

      sendQuoteReadyEmail({
        customerName: quote.customer_name,
        customerEmail: quote.customer_email,
        vehicleInfo,
        serviceType,
        quoteNumber: quote.quote_number ?? id.slice(0, 8),
        quoteId: id,
        quoteToken: quote.quote_token ?? '',
        total: totalFormatted,
        workshopId: auth.workshopId,
      }).catch((err) => console.error('[email] Quote ready email failed:', err))
    } else {
      console.log('[pdf:quote] Skipping email: status=%s, hasEmail=%s', quote.status, !!quote.customer_email)
    }

    return NextResponse.json({ storagePath })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
  } catch (error) {
    console.error('[pdf:quote]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
