'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, Building2, Users, FileText, Banknote, Calendar, User, Mail, Phone, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageWrapper } from '@/components/layout/PageWrapper'

interface WorkshopStats {
  id: string
  name: string
  slug: string
  ownerName: string
  contactEmail: string | null
  contactPhone: string | null
  customerCount: number
  quoteCount: number
  revenue: number
  appointmentCount: number
  createdAt: string
}

interface StatsData {
  totals: {
    workshops: number
    customers: number
    quotesTotal: number
    quotesPending: number
    quotesThisMonth: number
    revenueTotal: number
    revenueThisMonth: number
    appointmentsTotal: number
    appointmentsToday: number
    invoicesTotal: number
  }
  perWorkshop: WorkshopStats[]
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(amount)

export default function SuperAdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/super-admin/stats')
        if (!res.ok) throw new Error('Failed to load stats')
        setStats(await res.json())
      } catch {
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex min-h-[400px] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageWrapper>
    )
  }

  if (!stats) {
    return (
      <PageWrapper>
        <p className="text-sm text-grey">Unable to load dashboard.</p>
      </PageWrapper>
    )
  }

  const { totals, perWorkshop } = stats

  const statCards = [
    { label: 'Workshops', value: totals.workshops, icon: Building2, color: 'bg-blue-50 text-blue-600', href: '/dashboard/super-admin/workshops' },
    { label: 'Customers', value: totals.customers, icon: Users, color: 'bg-green-50 text-green-600', href: '/dashboard/super-admin/users' },
    { label: 'Pending Quotes', value: totals.quotesPending, icon: FileText, color: 'bg-amber-50 text-amber-600' },
    { label: 'Monthly Revenue', value: formatCurrency(totals.revenueThisMonth), icon: Banknote, color: 'bg-emerald-50 text-emerald-600' },
    { label: "Today's Jobs", value: totals.appointmentsToday, icon: Calendar, color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <PageWrapper>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1 border-b border-grey-medium/10 pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-grey-dark">Super Admin Dashboard</h1>
          <p className="text-sm text-grey">Overview across all workshops and customers.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((card) => (
            <Link
              key={card.label}
              href={card.href ?? '#'}
              className={`${card.href ? '' : 'pointer-events-none'} bg-white border border-grey-medium/10 rounded-base p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all no-underline`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-base flex items-center justify-center ${card.color} bg-opacity-20`}>
                  <card.icon size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-grey-dark">{card.value}</p>
              <p className="text-xs text-grey mt-0.5">{card.label}</p>
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-grey-dark">Workshops</h2>
            <p className="text-xs text-grey">Performance snapshot across all tenant workshops.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/super-admin/users"
              className="flex items-center gap-2 border border-grey-light bg-white text-grey-dark px-4 py-2 rounded-base font-semibold text-sm hover:bg-primary/5 transition-colors no-underline"
            >
              <Users className="h-4 w-4" />
              Manage Users
            </Link>
            <Link
              href="/dashboard/super-admin/workshops"
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-base font-semibold text-sm hover:bg-primary-dark transition-colors no-underline"
            >
              <Building2 className="h-4 w-4" />
              Manage Workshops
            </Link>
          </div>
        </div>

        <div className="bg-white border border-grey-light rounded-base shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-grey-lightest border-b border-grey-light">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-grey uppercase">Workshop</th>
                <th className="px-4 py-3 text-xs font-semibold text-grey uppercase hidden md:table-cell">Owner</th>
                <th className="px-4 py-3 text-xs font-semibold text-grey uppercase text-center">Customers</th>
                <th className="px-4 py-3 text-xs font-semibold text-grey uppercase text-center hidden sm:table-cell">Quotes</th>
                <th className="px-4 py-3 text-xs font-semibold text-grey uppercase text-center hidden sm:table-cell">Revenue</th>
                <th className="px-4 py-3 text-xs font-semibold text-grey uppercase text-center">Jobs</th>
                <th className="px-4 py-3 text-xs font-semibold text-grey uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-light">
              {perWorkshop.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-grey-medium text-sm">
                    No workshops found.
                  </td>
                </tr>
              ) : (
                perWorkshop.map((w) => (
                  <tr key={w.id} className="hover:bg-grey-lightest/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-grey">{w.name}</p>
                          <code className="text-xs text-grey-medium">/{w.slug}</code>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-grey-medium" />
                        <span className="text-sm text-grey">{w.ownerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-semibold text-grey-dark">{w.customerCount}</span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="text-sm font-semibold text-grey-dark">{w.quoteCount}</span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="text-sm font-semibold text-grey-dark">{formatCurrency(w.revenue)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-semibold text-grey-dark">{w.appointmentCount}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/super-admin/settings?workshopId=${w.id}`}
                        className="text-xs text-primary font-semibold hover:underline no-underline flex items-center gap-1 justify-end"
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                        Settings
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  )
}
