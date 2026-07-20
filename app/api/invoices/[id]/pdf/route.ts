import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { createSuperAdminClient } from '@/lib/super-admin'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/lib/pdf-templates/InvoicePDF'
import { sendTemplateEmail } from '@/lib/email'
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

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .eq('workshop_id', auth.workshopId as string)
    .is('deleted_at', null)
    .single() as any

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', auth.userId).single() as any,
    supabase.from('business_settings').select('*').eq('workshop_id', auth.workshopId!).single() as any,
  ])

  const logoBase64 = null

  const lineItems = parseLineItems(invoice.line_items)
  const subtotal = invoice.subtotal ?? lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  const total = invoice.total ?? subtotal

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
    documentNumber: invoice.invoice_number ?? invoice.id.slice(0, 8),
    documentType: 'Invoice',
    createdAt: invoice.created_at ?? new Date().toISOString(),
    customerName: invoice.customer_name,
    customerEmail: invoice.customer_email ?? null,
    customerPhone: invoice.customer_phone ?? '',
    vehicleInfo: [invoice.vehicle_year, invoice.vehicle_make, invoice.vehicle_model].filter(Boolean).join(' ') || null,
    serviceType: invoice.service_type ?? null,
    description: invoice.description ?? null,
    notes: invoice.notes ?? null,
    lineItems,
    discountPercent: Number(invoice.discount_percent ?? 0),
    subtotal,
    total,
    paymentMethod: invoice.payment_method ?? null,
    depositPercent: 0,
    depositAmount: null,
    expiryDate: null,
  }

  try {
    const buffer = await renderToBuffer(InvoicePDF({ data: pdfData }))

    const storagePath = `invoices/${id}.pdf`
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
      .from('invoices')
      .update({ pdf_url: storagePath, updated_at: new Date().toISOString() } as never)
      .eq('id', id)

    // Send invoice email to customer
    if (invoice.customer_email && !skipEmail) {
      const totalFormatted = `R ${Number(total).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
      sendTemplateEmail({
        templateKey: 'invoice_sent',
        to: invoice.customer_email,
        variables: {
          customerName: invoice.customer_name || 'Customer',
          invoiceNumber: invoice.invoice_number || id.slice(0, 8),
          total: totalFormatted,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-ZA'),
          invoiceUrl: '',
          bankName: settings?.bank_name || '',
          accountNumber: settings?.account_number || '',
          branchCode: settings?.branch_code || '',
        },
        workshopId: auth.workshopId!,
      }).catch(() => {})
    }

    return NextResponse.json({ storagePath })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
  } catch (error) {
    console.error('[pdf:invoice]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
