import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { QuoteBuilder } from '@/components/admin/documents/QuoteBuilder'
import type { QuoteData, DocumentLineItem } from '@/components/admin/documents/QuoteBuilder'
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

interface Props {
  searchParams: Promise<{ quoteId?: string }>
}

export default async function QuoteBuilderPage({ searchParams }: Props) {
  const { quoteId } = await searchParams

  if (!quoteId) {
    return (
      <PageWrapper>
        <div className="text-center py-16 text-grey">
          No quote ID provided. Go back and select a pending request.
        </div>
      </PageWrapper>
    )
  }

  const supabase = await createSupabaseServerClient()
  const { data: quote } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .is('deleted_at', null)
    .single()

  if (!quote) {
    return (
      <PageWrapper>
        <div className="text-center py-16 text-grey">Quote not found.</div>
      </PageWrapper>
    )
  }

  const initialData: QuoteData = {
    customerName: quote.customer_name,
    customerEmail: quote.customer_email,
    customerPhone: quote.customer_phone,
    vehicleYear: quote.vehicle_year,
    vehicleMake: quote.vehicle_make,
    vehicleModel: quote.vehicle_model,
    serviceType: quote.service_type,
    description: quote.description,
    notes: quote.notes,
    lineItems: parseLineItems(quote.line_items),
    discountPercent: Number(quote.discount_percent ?? 0),
    depositPercent: Number((quote as any).deposit_percent ?? 0),
    depositAmount: (quote as any).deposit_amount ?? null,
    expiryDate: (quote as any).expiry_date ?? null,
    status: quote.status ?? 'draft',
  }

  return (
    <PageWrapper>
      <QuoteBuilder
        mode="quote"
        quoteId={quoteId}
        initialData={initialData}
      />
    </PageWrapper>
  )
}
