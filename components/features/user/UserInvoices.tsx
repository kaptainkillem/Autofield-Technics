import { createSupabaseServerClient } from '@/lib/supabaseServer'

interface Props { userId: string }

type Receipt = {
  id: string
  created_at: string | null
  amount_paid: number
  payment_method: string | null
}

export async function UserInvoices({ userId }: Props) {
  const supabase = await createSupabaseServerClient()

  const { data: receipts } = await supabase
    .from('receipts')
    .select('id, created_at, amount_paid, payment_method')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(10) as { data: Receipt[] | null }

  if (!receipts?.length) {
    return (
      <div className="bg-white rounded-base shadow-base px-6 py-10 text-center text-grey text-sm">
        No invoices yet.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-base shadow-base divide-y divide-grey-medium/20">
      {receipts.map((r) => (
        <div key={r.id} className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold text-sm text-black truncate">
              Invoice #{r.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-xs text-grey mt-0.5">
              {r.created_at ? new Date(r.created_at).toLocaleDateString('en-ZA', {
                day: 'numeric', month: 'short', year: 'numeric',
              }) : '—'} 
              {r.payment_method ? ` · ${r.payment_method}` : ''}
            </p>
          </div>
          <span className="font-bold text-sm text-black flex-shrink-0">
            R{Number(r.amount_paid).toLocaleString('en-ZA')}
          </span>
        </div>
      ))}
    </div>
  )
}
