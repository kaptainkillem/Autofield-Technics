import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabaseServer'
import { Database } from '@/types/database'
import { AdminStats } from '@/components/AdminStats'
import { QuotesInbox } from '@/components/admin/QuotesInbox'
import { UpcomingJobsWidget } from '@/components/admin/UpcomingJobsWidget'
import { RevenueChart } from '@/components/admin/RevenueChart'
import { DashboardSkeleton } from '@/components/admin/DashboardSkeleton'
import { ArrowRight, Users, FileText, Landmark, Wrench, Settings2 } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/site-config'
import { PageWrapper } from '@/components/layout/PageWrapper'

type Quote   = Database['public']['Tables']['quotes']['Row']
type Receipt = Database['public']['Tables']['receipts']['Row']

export const dynamic = 'force-dynamic'

async function getSummaryData() {
  // Server-side auth guard: verify user is authenticated and has admin role
  const serverClient = await createSupabaseServerClient()
  const { data: { user } } = await serverClient.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  const role = user.user_metadata?.role ?? 'client'
  if (role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = createSupabaseAdminClient()

  // Fetch only high-level snapshot data boundaries for the overview index execution
  const [quotesRes, receiptsRes, reviewsRes, profilesRes] = await Promise.all([
    supabase.from('quotes').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('receipts').select('*').is('deleted_at', null),
    supabase.from('reviews').select('id').eq('status', 'pending').is('deleted_at', null),
    supabase.from('profiles').select('id').eq('role', 'client')
  ])

  return {
    quotes: (quotesRes.data ?? []) as Quote[],
    receiptsCount: (receiptsRes.data ?? []) as Receipt[],
    pendingReviewsCount: reviewsRes.data?.length ?? 0,
    customersCount: profilesRes.data?.length ?? 0,
  }
}

async function DashboardContent() {
  const { quotes, receiptsCount, pendingReviewsCount, customersCount } = await getSummaryData()

  const totalQuotes     = quotes.length
  const pendingQuotes   = quotes.filter((q) => q.status === 'pending').length
  const completedQuotes = quotes.filter((q) => q.status === 'completed').length

  const monthlyRevenue = receiptsCount
    .filter((r) => {
      const jobDate = r.job_date ? new Date(r.job_date) : new Date()
      const now     = new Date()
      return jobDate.getMonth() === now.getMonth() && jobDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, r) => sum + (r.amount_paid ?? 0), 0)

  // Build monthly revenue chart data (last 6 months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const now = new Date()
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const monthLabel = monthNames[d.getMonth()]
    const revenue = receiptsCount
      .filter((r) => {
        const jobDate = r.job_date ? new Date(r.job_date) : null
        return jobDate && jobDate.getMonth() === d.getMonth() && jobDate.getFullYear() === d.getFullYear()
      })
      .reduce((sum, r) => sum + (r.amount_paid ?? 0), 0)
    return { month: monthLabel, revenue, jobs: 0 }
  })

  // Glimpse slices for premium summary overview display
  const recentQuotesGlimpse = quotes.slice(0, 5)

  return (
    <PageWrapper>
      {/* Executive Archive Header Block */}
      <div className="flex flex-col gap-1 border-b border-grey-medium/10 pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-grey-dark">{SITE_CONFIG.dashboard.adminTitle}</h1>
        <p className="text-sm text-grey">{SITE_CONFIG.dashboard.adminSubtitle}</p>
      </div>

      {/* 🚀 Dynamic Metrics Counter Matrix (Clickable shortcuts configured within components) */}
      <section className="w-full">
        <AdminStats
          totalQuotes={totalQuotes}
          pendingQuotes={pendingQuotes}
          completedQuotes={completedQuotes}
          monthlyRevenue={monthlyRevenue}
          pendingReviews={pendingReviewsCount}
        />
      </section>

      {/* Main Core Glimpse Split Section Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left 2-Col Module Block: Primary Quotes Processing Flow Inbox */}
        <div className="lg:col-span-2 flex flex-col gap-6 bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-grey-light pb-3">
            <div>
              <h2 className="text-lg font-bold text-grey-dark">Recent Quotes Queue</h2>
              <p className="text-xs text-grey">Immediate processing overview tracking client estimate actions.</p>
            </div>
            <Link href="/dashboard/admin/quotes" className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline no-underline">
              <span>Open Full Inbox</span>
              <ArrowRight size={14} />
            </Link>
          </div>
          <QuotesInbox quotes={recentQuotesGlimpse} />

          {/* Revenue Chart */}
          <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
            <RevenueChart data={chartData} />
          </div>
        </div>

        {/* Right 1-Col Module Block: Operations Directory Hub Navigation Quick links */}
        <div className="lg:col-span-1 bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold text-grey-dark">Quick Directory Workspace</h2>
            <p className="text-xs text-grey">Fast workspace routing modules control map shortcuts.</p>
          </div>

          <Link href="/dashboard/admin/leads" className="flex items-center justify-between p-3 rounded-base bg-white border border-grey-medium/10 text-grey-dark no-underline hover:border-primary/30 hover:bg-primary/5 transition-all">
  <div className="flex items-center gap-3">
    <Users size={18} className="text-primary" />
    <span className="text-sm font-semibold">Leads Pipeline Portal</span>
  </div>
  <ArrowRight size={14} className="text-grey" />
</Link>

          <div className="flex flex-col gap-2.5">
            <Link href="/dashboard/admin/quotes" className="flex items-center justify-between p-3 rounded-base bg-white border border-grey-medium/10 text-grey-dark no-underline hover:border-primary/30 hover:bg-primary/5 transition-all">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-primary" />
                <span className="text-sm font-semibold">Quotes Pipeline ({totalQuotes})</span>
              </div>
              <ArrowRight size={14} className="text-grey" />
            </Link>

            <Link href="/dashboard/admin/finance" className="flex items-center justify-between p-3 rounded-base bg-white border border-grey-medium/10 text-grey-dark no-underline hover:border-primary/30 hover:bg-primary/5 transition-all">
              <div className="flex items-center gap-3">
                <Landmark size={18} className="text-primary" />
                <span className="text-sm font-semibold">Money Keeper Ledger</span>
              </div>
              <ArrowRight size={14} className="text-grey" />
            </Link>

            <Link href="/dashboard/admin/services" className="flex items-center justify-between p-3 rounded-base bg-white border border-grey-medium/10 text-grey-dark no-underline hover:border-primary/30 hover:bg-primary/5 transition-all">
              <div className="flex items-center gap-3">
                <Settings2 size={18} className="text-primary" />
                <span className="text-sm font-semibold">Service Catalog</span>
              </div>
              <ArrowRight size={14} className="text-grey" />
            </Link>

            <Link href="/dashboard/admin/customers" className="flex items-center justify-between p-3 rounded-base bg-white border border-grey-medium/10 text-grey-dark no-underline hover:border-primary/30 hover:bg-primary/5 transition-all">
              <div className="flex items-center gap-3">
                <Users size={18} className="text-primary" />
                <span className="text-sm font-semibold">Customer Base Tracker ({customersCount})</span>
              </div>
              <ArrowRight size={14} className="text-grey" />
            </Link>

            <Link href="/dashboard/admin/jobs" className="flex items-center justify-between p-3 rounded-base bg-white border border-grey-medium/10 text-grey-dark no-underline hover:border-primary/30 hover:bg-primary/5 transition-all">
              <div className="flex items-center gap-3">
                <Wrench size={18} className="text-primary" />
                <span className="text-sm font-semibold">Active Mechanical Jobs</span>
              </div>
              <ArrowRight size={14} className="text-grey" />
            </Link>
          </div>

          {/* Upcoming Jobs Widget */}
          <UpcomingJobsWidget />
        </div>

      </div>
    </PageWrapper>
  )
}

export default function AdminDashboardArchivePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}