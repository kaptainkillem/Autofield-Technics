'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, getRoleFromSession } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  BarChart3, Loader2, ArrowLeft, TrendingUp, Users, FileText, Star, Wrench,
} from 'lucide-react'
import Link from 'next/link'
import { PageWrapper } from '@/components/layout/PageWrapper'

interface AnalyticsData {
  totalQuotes: number
  pendingQuotes: number
  completedQuotes: number
  totalCustomers: number
  totalReviews: number
  pendingReviews: number
  approvedReviews: number
  totalRevenue: number
  totalJobs: number
  monthlyRevenue: { month: string; revenue: number }[]
}

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)

  const fetchAnalytics = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/signin')
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    const role = getRoleFromSession(session)
    if (role !== 'admin') {
      router.push('/dashboard')
      return
    }

    const [
      quotesRes,
      customersRes,
      reviewsRes,
      receiptsRes,
      appointmentsRes,
    ] = await Promise.all([
      (supabase as any).from('quotes').select('status').is('deleted_at', null),
      (supabase as any).from('profiles').select('id').eq('role', 'client'),
      (supabase as any).from('reviews').select('status').is('deleted_at', null),
      (supabase as any).from('receipts').select('amount_paid, job_date').is('deleted_at', null),
      (supabase as any).from('appointments').select('status').is('deleted_at', null),
    ])

    const quotes = quotesRes.data ?? []
    const customers = customersRes.data ?? []
    const reviews = reviewsRes.data ?? []
    const receipts = receiptsRes.data ?? []
    const appointments = appointmentsRes.data ?? []

    const totalRevenue = receipts.reduce((sum: number, r: any) => sum + (r.amount_paid ?? 0), 0)

    // Build last 6 months revenue chart
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const now = new Date()
    const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      const monthLabel = monthNames[d.getMonth()]
      const revenue = receipts
        .filter((r: any) => {
          const jobDate = r.job_date ? new Date(r.job_date) : null
          return jobDate && jobDate.getMonth() === d.getMonth() && jobDate.getFullYear() === d.getFullYear()
        })
        .reduce((sum: number, r: any) => sum + (r.amount_paid ?? 0), 0)
      return { month: monthLabel, revenue }
    })

    setData({
      totalQuotes: quotes.length,
      pendingQuotes: quotes.filter((q: any) => q.status === 'pending').length,
      completedQuotes: quotes.filter((q: any) => q.status === 'completed').length,
      totalCustomers: customers.length,
      totalReviews: reviews.length,
      pendingReviews: reviews.filter((r: any) => r.status === 'pending').length,
      approvedReviews: reviews.filter((r: any) => r.status === 'approved').length,
      totalRevenue,
      totalJobs: appointments.length,
      monthlyRevenue,
    })

    setLoading(false)
  }, [router])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading || !data) {
    return (
      <PageWrapper>
        <div className="flex min-h-[400px] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </PageWrapper>
    )
  }

  const maxRevenue = Math.max(...data.monthlyRevenue.map((m) => m.revenue), 1)

  return (
    <PageWrapper className="gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin" className="p-2 bg-white rounded-base border border-grey-medium/10 text-grey hover:text-primary transition-all shadow-sm">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-grey-dark tracking-tight">Analytics Dashboard</h1>
          <p className="text-xs text-grey">Business performance metrics and growth trends.</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<FileText size={18} className="text-primary" />}
          label="Total Quotes"
          value={data.totalQuotes}
          sub={`${data.pendingQuotes} pending, ${data.completedQuotes} completed`}
        />
        <MetricCard
          icon={<Users size={18} className="text-success" />}
          label="Total Customers"
          value={data.totalCustomers}
          sub="Registered client accounts"
        />
        <MetricCard
          icon={<TrendingUp size={18} className="text-green-600" />}
          label="Total Revenue"
          value={`R ${data.totalRevenue.toLocaleString('en-ZA')}`}
          sub="From all completed jobs"
        />
        <MetricCard
          icon={<Star size={18} className="text-yellow-500" />}
          label="Reviews"
          value={data.totalReviews}
          sub={`${data.approvedReviews} approved, ${data.pendingReviews} pending`}
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-grey-dark">Monthly Revenue</h3>
            <p className="text-xs text-grey">Last 6 months of income</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-grey">
            <Wrench size={14} className="text-primary" />
            <span>{data.totalJobs} total jobs</span>
          </div>
        </div>

        <div className="flex items-end gap-3 h-48">
          {data.monthlyRevenue.map((m) => {
            const heightPct = m.revenue > 0 ? (m.revenue / maxRevenue) * 100 : 0
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center gap-1">
                  {m.revenue > 0 && (
                    <span className="text-[10px] font-semibold text-grey-dark">
                      R {(m.revenue / 1000).toFixed(0)}k
                    </span>
                  )}
                  <div
                    className="w-full bg-primary/20 rounded-t-base transition-all duration-500"
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                  >
                    <div
                      className="w-full bg-primary rounded-t-base"
                      style={{ height: '100%' }}
                    />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-grey uppercase">{m.month}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatusBreakdown
          title="Quote Pipeline"
          items={[
            { label: 'Pending', count: data.pendingQuotes, color: 'bg-amber-500' },
            { label: 'Completed', count: data.completedQuotes, color: 'bg-success' },
            { label: 'Other', count: data.totalQuotes - data.pendingQuotes - data.completedQuotes, color: 'bg-grey-medium' },
          ]}
          total={data.totalQuotes}
        />
        <StatusBreakdown
          title="Review Moderation"
          items={[
            { label: 'Approved', count: data.approvedReviews, color: 'bg-success' },
            { label: 'Pending', count: data.pendingReviews, color: 'bg-amber-500' },
            { label: 'Other', count: data.totalReviews - data.approvedReviews - data.pendingReviews, color: 'bg-grey-medium' },
          ]}
          total={data.totalReviews}
        />
      </div>
    </PageWrapper>
  )
}

function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub: string }) {
  return (
    <div className="bg-white border border-grey-medium/10 rounded-base p-5 shadow-sm flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-grey-lightest rounded-base">{icon}</div>
        <span className="text-xs font-bold text-grey uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-black text-grey-dark">{value}</p>
      <p className="text-[11px] text-grey">{sub}</p>
    </div>
  )
}

function StatusBreakdown({
  title,
  items,
  total,
}: {
  title: string
  items: { label: string; count: number; color: string }[]
  total: number
}) {
  return (
    <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
      <h3 className="text-sm font-bold text-grey-dark mb-4">{title}</h3>
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const pct = total > 0 ? (item.count / total) * 100 : 0
          return (
            <div key={item.label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-grey-dark font-medium">{item.label}</span>
                <span className="text-grey">{item.count} ({pct.toFixed(0)}%)</span>
              </div>
              <div className="h-2 w-full bg-grey-light rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
