import { PageWrapper } from '@/components/layout/PageWrapper'
import { QuoteBuilder } from '@/components/admin/documents/QuoteBuilder'

export const dynamic = 'force-dynamic'

export default function CreateQuotePage() {
  return (
    <PageWrapper>
      <QuoteBuilder mode="quote" />
    </PageWrapper>
  )
}

