import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient, getRoleFromJWT } from '@/lib/supabaseServer'
import { Database } from '@/types/database'
import { AdminStats } from '@/components/AdminStats'
import { QuotesInbox } from '@/components/admin/QuotesInbox'
import { UpcomingJobsWidget } from '@/components/admin/UpcomingJobsWidget'
import { RevenueChart } from '@/components/admin/RevenueChart'
import { DashboardSkeleton } from '@/components/admin/DashboardSkeleton'
import { ArrowRight, Users, FileText, Landmark, Wrench, Settings2 } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { OnboardingChecklist } from '@/components/admin/OnboardingChecklist'

type Quote   = Database['public']['Tables']['quotes']['Row']
type Receipt = Database['public']['Tables']['receipts']['Row']

export const dynamic = 'force-dynamic'

async function getSummaryData() {
  const serverClient = await createSupabaseServerClient()
  const { data: { session } } = await serverClient.auth.getSession()

  if (!session) {
    redirect('/signin')
  }

  const role = getRoleFromJWT(session)
  if (role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = await createSupabaseServerClient()

  const workshopId = (() => {
    try {
      const payload = JSON.parse(atob(session.access_token.split('.')[1]))
      return payload?.app_metadata?.workshop_id as string | null
    } catch { return null }
  })()

  const [quotesRes, receiptsRes, reviewsRes, profilesRes, settingsRes, servicesRes] = await Promise.all([
    supabase.from('quotes').select('*').eq('workshop_id', workshopId as string).is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('receipts').select('*').eq('workshop_id', workshopId as string).is('deleted_at', null),
    supabase.from('reviews').select('id').eq('workshop_id', workshopId as string).eq('status', 'pending').is('deleted_at', null),
    supabase.from('profiles').select('id').eq('workshop_id', workshopId as string).eq('role', 'client'),
    supabase.from('public_business_settings' as any).select('*').eq('workshop_id', workshopId as string).maybeSingle() as any,
    supabase.from('services').select('id').eq('workshop_id', workshopId as string).eq('is_active', true),
  ])

  return {
    quotes: (quotesRes.data ?? []) as Quote[],
    receiptsCount: (receiptsRes.data ?? []) as Receipt[],
    pendingReviewsCount: reviewsRes.data?.length ?? 0,
    customersCount: profilesRes.data?.length ?? 0,
    settings: settingsRes.data ?? null,
    servicesCount: (servicesRes.data ?? []).length,
  }
}

async function DashboardContent() {
  const { quotes, receiptsCount, pendingReviewsCount, customersCount, settings, servicesCount } = await getSummaryData()

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
        <h1 className="text-3xl font-extrabold tracking-tight text-grey-dark">Executive Command Center</h1>
        <p className="text-sm text-grey">High-level snapshot workspace summary parameters.</p>
      </div>

      {settings && (
        <OnboardingChecklist
          settings={{
            site_name: settings.site_name,
            phone: settings.phone,
            whatsapp_number: settings.whatsapp_number,
            city: settings.city,
            logo_url: settings.logo_url,
            hero_image_url: settings.hero_image_url,
            primary_color: settings.primary_color,
            accent_color: settings.accent_color,
            font_family: settings.font_family,
            home_page_content: settings.home_page_content,
            business_hours: settings.business_hours,
            terms_conditions: settings.terms_conditions,
            document_footer: settings.document_footer,
          }}
          hasServices={servicesCount > 0}
        />
      )}

      {/* Dynamic Metrics Counter Matrix (Clickable shortcuts configured within components) */}
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