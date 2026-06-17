import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface Props { userId: string }

type Quote = {
  id: string
  description: string | null
  status: 'pending' | 'sent' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
  created_at: string
}

export async function UserQuotes({ userId }: Props) {
  const supabase = await createSupabaseServerClient()

  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, created_at, status, description')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(10) as { data: Quote[] | null }

  if (!quotes?.length) {
    return (
      <div className="bg-white rounded-base shadow-base text-center text-grey text-sm px-6 py-10">
        No quotes yet.{' '}
        <a href="/quote" className="text-primary font-semibold hover:underline">
          Request your first one →
        </a>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-base shadow-base divide-y divide-grey-medium/20">
      {quotes.map((q) => (
        <div key={q.id} className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold text-sm text-black truncate">
              {q.description?.slice(0, 30) ?? 'General service'}
            </p>
            <p className="text-xs text-grey mt-0.5 truncate">{q.description}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <StatusBadge status={q.status} />
            <span className="text-xs text-grey hidden sm:block">
              {new Date(q.created_at).toLocaleDateString('en-ZA', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
