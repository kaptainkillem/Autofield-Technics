import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { QuoteBuilder } from '@/components/admin/documents/QuoteBuilder'
import type { AcceptedQuote, DocumentLineItem } from '@/components/admin/documents/QuoteBuilder'
import type { Json } from '@/types/database'

export const dynamic = 'force-dynamic'

function parseLineItems(value: Json | null): DocumentLineItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null
      const row = item as Record<string, Json>
      return {
        id: String(row.id ?? `line-${Math.random()}`),
        name: String(row.name ?? ''),
        qty: Number(row.qty ?? 1),
        unitPrice: Number(row.unitPrice ?? 0),
      }
    })
    .filter((item): item is DocumentLineItem => Boolean(item?.name))
}

export default async function CreateInvoicePage() {
  const supabase = createSupabaseAdminClient()
  const { data } = await supabase
    .from('quotes')
    .select('*')
    .eq('status', 'accepted')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const acceptedQuotes: AcceptedQuote[] = (data ?? []).map((quote) => ({
    id: quote.id,
    quoteNumber: quote.quote_number,
    customerName: quote.customer_name,
    customerEmail: quote.customer_email,
    customerPhone: quote.customer_phone,
    vehicleYear: quote.vehicle_year,
    vehicleMake: quote.vehicle_make,
    vehicleModel: quote.vehicle_model,
    serviceType: quote.service_type,
    description: quote.description,
    lineItems: parseLineItems(quote.line_items),
    discountPercent: Number(quote.discount_percent ?? 0),
  }))

  return (
    <PageWrapper>
      <QuoteBuilder mode="invoice" acceptedQuotes={acceptedQuotes} />
    </PageWrapper>
  )
}
