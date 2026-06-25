import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { QuotesInbox } from '@/components/admin/QuotesInbox'
import { Database } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function AdminQuotesPage() {
  const supabase = createSupabaseAdminClient()
  const { data } = await supabase.from('quotes').select('*').is('deleted_at', null).order('created_at', { ascending: false })
  const quotes = (data ?? []) as Database['public']['Tables']['quotes']['Row'][]

  return (
    <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm max-w-[1600px] mx-auto w-full mt-4">
      <div className="mb-6 border-b border-grey-light pb-3">
        <h1 className="text-2xl font-bold text-grey-dark">Quotes Processing Pipeline Inbox</h1>
        <p className="text-sm text-grey">Manage, analyze, update processing parameters, and review system generated client interaction requests.</p>
      </div>
      <QuotesInbox quotes={quotes} />
    </div>
  )
}