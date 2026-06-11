import { createSupabaseServerClient } from '@/lib/supabaseServer'

interface Props { userId: string }

type Receipt = {
  id: string
  job_date: string
  amount_paid: number
  payment_method: string | null
  notes: string | null
  invoice_number: string | null
}

export async function UserInvoices({ userId }: Props) {
  const supabase = await createSupabaseServerClient()

  const { data: receipts } = await supabase
    .from('receipts')
    .select('id, job_date, amount_paid, payment_method, notes, invoice_number')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('job_date', { ascending: false })
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
              {r.invoice_number ? `Invoice #${r.invoice_number}` : r.notes ?? 'Invoice'}
            </p>
            <p className="text-xs text-grey mt-0.5">
              {new Date(r.job_date).toLocaleDateString('en-ZA', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
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