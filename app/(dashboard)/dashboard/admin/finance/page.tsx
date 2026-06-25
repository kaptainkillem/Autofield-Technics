import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { AdminInvoices } from '@/components/admin/AdminInvoices'
import { Database } from '@/types/database'
import { SITE_CONFIG } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

export default async function AdminFinancePage() {
  const supabase = createSupabaseAdminClient()
  const { data } = await supabase.from('receipts').select('*').is('deleted_at', null).order('job_date', { ascending: false })
  const receipts = (data ?? []) as Database['public']['Tables']['receipts']['Row'][]

  return (
    <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm max-w-[1600px] mx-auto w-full mt-4">
      <div className="mb-6 border-b border-grey-light pb-3">
        <h1 className="text-2xl font-bold text-grey-dark">Money Keeper Financial Ledger</h1>
        <p className="text-sm text-grey">Track invoice lifecycle processing states, tax data metrics, and revenue collections across {SITE_CONFIG.city}.</p>
      </div>
      <AdminInvoices receipts={receipts} />
    </div>
  )
}