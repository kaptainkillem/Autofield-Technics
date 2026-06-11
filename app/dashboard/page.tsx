import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { Database } from '@/types/database'
import { AdminStats } from '@/components/AdminStats'
import { QuotesInbox } from '@/components/admin/QuotesInbox'
import { AdminInvoices } from '@/components/admin/AdminInvoices'
import { AdminCustomers } from '@/components/admin/AdminCustomers'
import { AdminNav } from '@/components/AdminNav'

// Explicit types so TypeScript doesn't infer never[]
type Quote    = Database['public']['Tables']['quotes']['Row']
type Receipt  = Database['public']['Tables']['receipts']['Row']
type Review   = Database['public']['Tables']['reviews']['Row']
type Profile  = Database['public']['Tables']['profiles']['Row']

async function getAdminData(): Promise<{
  quotes:         Quote[]
  receipts:       Receipt[]
  pendingReviews: Review[]
  customers:      Profile[]
}> {
  const supabase = createSupabaseAdminClient()

  const [quotesRes, receiptsRes, reviewsRes, profilesRes] = await Promise.all([
    supabase
      .from('quotes')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),

    supabase
      .from('receipts')
      .select('*')
      .is('deleted_at', null)
      .order('job_date', { ascending: false }),

    supabase
      .from('reviews')
      .select('*')
      .eq('status', 'pending')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),

    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'client')
      .order('created_at', { ascending: false }),
  ])

  return {
    quotes:         (quotesRes.data   ?? []) as Quote[],
    receipts:       (receiptsRes.data ?? []) as Receipt[],
    pendingReviews: (reviewsRes.data  ?? []) as Review[],
    customers:      (profilesRes.data ?? []) as Profile[],
  }
}

export default async function AdminDashboardPage() {
  const { quotes, receipts, pendingReviews, customers } = await getAdminData()

  const totalQuotes     = quotes.length
  const pendingQuotes   = quotes.filter((q) => q.status === 'pending').length
  const completedQuotes = quotes.filter((q) => q.status === 'completed').length

  const monthlyRevenue = receipts
    .filter((r) => {
      const jobDate = new Date(r.issued_at ?? Date.now())
      const now     = new Date()
      return (
        jobDate.getMonth()    === now.getMonth() &&
        jobDate.getFullYear() === now.getFullYear()
      )
    })
    .reduce((sum, r) => sum + (r.amount_paid ?? 0), 0)

  return (
    <div className="min-h-screen bg-grey-lightest">
      <AdminNav />

      <main className="px-4 py-8 md:px-10 max-w-7xl mx-auto flex flex-col gap-10">

        <section>
          <h2 className="text-xl font-bold text-black mb-4">Overview</h2>
          <AdminStats
            totalQuotes={totalQuotes}
            pendingQuotes={pendingQuotes}
            completedQuotes={completedQuotes}
            monthlyRevenue={monthlyRevenue}
            pendingReviews={pendingReviews.length}
          />
        </section>

        <section>
          <h2 className="text-xl font-bold text-black mb-4">Quotes Inbox</h2>
          <QuotesInbox quotes={quotes} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <h2 className="text-xl font-bold text-black mb-4">Customers</h2>
            <AdminCustomers customers={customers} />
          </section>
          <section>
            <h2 className="text-xl font-bold text-black mb-4">Invoices</h2>
            <AdminInvoices receipts={receipts} />
          </section>
        </div>

      </main>
    </div>
  )
}