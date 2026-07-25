'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus, Mail, Phone, User, Building2, Users, FileText, Banknote, Calendar, Settings2, Globe, ExternalLink, CheckCircle, AlertTriangle, BadgeCheck, ShieldOff, Clock } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { PageWrapper } from '@/components/layout/PageWrapper'

interface Workshop {
  id: string
  name: string
  slug: string
  domain: string | null
  contact_email: string | null
  contact_phone: string | null
  status: string
  billing_status: string
  suspended_at: string | null
  suspension_reason: string | null
  created_at: string
  owner: { full_name: string } | null
  settings: {
    site_name: string | null
    phone: string | null
    whatsapp_number: string | null
    city: string | null
    logo_url: string | null
    hero_image_url: string | null
    primary_color: string
    accent_color: string
    font_family: string | null
    home_page_content: unknown
    business_hours: string | null
    terms_conditions: string | null
    document_footer: string | null
  } | null
  servicesCount: number
}

function computeProgress(settings: Workshop['settings'], servicesCount: number): number {
  if (!settings) return 0
  const items = [
    !!settings.site_name && settings.site_name !== 'Autofields Technics',
    !!settings.phone && settings.phone !== '+27784802796',
    !!settings.whatsapp_number,
    !!settings.city && settings.city !== 'Johannesburg',
    !!settings.logo_url,
    !!settings.hero_image_url,
    settings.primary_color !== '#3B82F6' || settings.accent_color !== '#10B981',
    !!settings.font_family && settings.font_family !== 'Inter',
    (() => { if (!settings.home_page_content || typeof settings.home_page_content !== 'object') return false; const h = settings.home_page_content as Record<string, unknown>; const hero = h.hero as Record<string, unknown> | null; return hero ? hero.title !== 'Professional Mechanical Care, Wherever You Are' : false })(),
    servicesCount > 0,
    !!settings.business_hours,
    !!(settings.terms_conditions || settings.document_footer),
  ]
  const done = items.filter(Boolean).length
  return Math.round((done / items.length) * 100)
}

interface WorkshopStats {
  id: string
  customerCount: number
  quoteCount: number
  revenue: number
  appointmentCount: number
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(amount)

export default function SuperAdminWorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [workshopStats, setWorkshopStats] = useState<Map<string, WorkshopStats>>(new Map())
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    ownerEmail: '',
    ownerPassword: '',
    ownerName: '',
    workshopName: '',
    workshopSlug: '',
    domain: '',
    contactEmail: '',
    contactPhone: '',
  })

  useEffect(() => {
    fetchWorkshops()
  }, [])

  async function fetchWorkshops() {
    try {
      const [workshopsRes, statsRes] = await Promise.all([
        fetch('/api/admin/workshops'),
        fetch('/api/admin/super-admin/stats'),
      ])

      if (workshopsRes.ok) {
        const { workshops: data } = await workshopsRes.json()
        setWorkshops(data ?? [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        const statsMap = new Map<string, WorkshopStats>()
        statsData.perWorkshop?.forEach((w: WorkshopStats) => {
          statsMap.set(w.id, w)
        })
        setWorkshopStats(statsMap)
      }
    } catch {
      toast.error('Failed to load workshops')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/admin/workshops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(Array.isArray(error) ? error[0]?.message : error)
      }
      toast.success('Workshop created')
      setShowForm(false)
      setForm({ ownerEmail: '', ownerPassword: '', ownerName: '', workshopName: '', workshopSlug: '', domain: '', contactEmail: '', contactPhone: '' })
      fetchWorkshops()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create workshop')
    } finally {
      setCreating(false)
    }
  }

  async function handleStatusChange(workshopId: string, status: string, reason?: string) {
    try {
      const res = await fetch(`/api/admin/workshops?id=${workshopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, suspension_reason: reason || null }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error)
      }
      toast.success(`Workshop ${status === 'active' ? 'reactivated' : status === 'suspended' ? 'suspended' : 'updated'}`)
      fetchWorkshops()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update workshop')
    }
  }

  async function handleDeactivate(workshopId: string) {
    if (!window.confirm('Deactivate this workshop? All data will be preserved, but the site and dashboard will become unavailable.')) {
      return
    }
    try {
      const res = await fetch(`/api/admin/workshops?id=${workshopId}`, { method: 'DELETE' })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error)
      }
      toast.success('Workshop deactivated')
      fetchWorkshops()
    } catch (err: any) {
      toast.error(err.message || 'Failed to deactivate workshop')
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active': return { icon: BadgeCheck, class: 'bg-green-100 text-green-700', label: 'Active' }
      case 'suspended': return { icon: ShieldOff, class: 'bg-amber-100 text-amber-700', label: 'Suspended' }
      case 'inactive': return { icon: Clock, class: 'bg-red-100 text-red-500', label: 'Inactive' }
      default: return { icon: AlertTriangle, class: 'bg-grey-lightest text-grey', label: status }
    }
  }

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-grey">Workshop Management</h1>
            <p className="text-sm text-grey mt-1">Provision new workshops and owner accounts</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-base font-semibold text-sm hover:bg-primary-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Workshop
          </button>
        </div>

        {showForm && (
          <div className="bg-white border border-grey-light rounded-base p-6 shadow-sm">
            <h2 className="text-lg font-bold text-grey mb-4">Create Workshop</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-grey mb-1">Workshop Name</label>
                <input
                  type="text"
                  required
                  value={form.workshopName}
                  onChange={(e) => {
                    const name = e.target.value
                    setForm({ ...form, workshopName: name, workshopSlug: generateSlug(name) })
                  }}
                  className="w-full rounded-base border border-grey-light px-3 py-2 text-grey focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-grey mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  value={form.workshopSlug}
                  onChange={(e) => setForm({ ...form, workshopSlug: e.target.value })}
                  className="w-full rounded-base border border-grey-light px-3 py-2 text-grey focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-grey mb-1">Domain (optional)</label>
                <input
                  type="text"
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                  placeholder="mechanic.co.za"
                  className="w-full rounded-base border border-grey-light px-3 py-2 text-grey focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-grey mb-1">Owner Name</label>
                <input
                  type="text"
                  required
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  className="w-full rounded-base border border-grey-light px-3 py-2 text-grey focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-grey mb-1">Owner Email</label>
                <input
                  type="email"
                  required
                  value={form.ownerEmail}
                  onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                  className="w-full rounded-base border border-grey-light px-3 py-2 text-grey focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-grey mb-1">Owner Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.ownerPassword}
                  onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })}
                  className="w-full rounded-base border border-grey-light px-3 py-2 text-grey focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-grey mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  className="w-full rounded-base border border-grey-light px-3 py-2 text-grey focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="md:col-span-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-semibold text-grey border border-grey-light rounded-base hover:bg-grey-light/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-base font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {creating ? 'Creating...' : 'Create Workshop'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-white border border-grey-light rounded-base shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-grey-lightest border-b border-grey-light">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-grey uppercase">Workshop</th>
                  <th className="px-4 py-3 text-xs font-semibold text-grey uppercase hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-grey uppercase hidden md:table-cell">Owner</th>
                  <th className="px-4 py-3 text-xs font-semibold text-grey uppercase hidden md:table-cell">Contact</th>
                  <th className="px-4 py-3 text-xs font-semibold text-grey uppercase text-center">Setup</th>
                  <th className="px-4 py-3 text-xs font-semibold text-grey uppercase text-center hidden lg:table-cell">Customers</th>
                  <th className="px-4 py-3 text-xs font-semibold text-grey uppercase text-center hidden lg:table-cell">Quotes</th>
                  <th className="px-4 py-3 text-xs font-semibold text-grey uppercase text-center hidden lg:table-cell">Revenue</th>
                  <th className="px-4 py-3 text-xs font-semibold text-grey uppercase text-center">Jobs</th>
                  <th className="px-4 py-3 text-xs font-semibold text-grey uppercase hidden sm:table-cell">Created</th>
                  <th className="px-4 py-3 text-xs font-semibold text-grey uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-light">
                {workshops.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-grey-medium text-sm">
                      No workshops yet. Create your first one above.
                    </td>
                  </tr>
                ) : (
                  workshops.map((w) => {
                    const stats = workshopStats.get(w.id)
                    const progress = computeProgress(w.settings, w.servicesCount)
                    return (
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
                        {(() => {
                          const badge = statusBadge(w.status)
                          const Icon = badge.icon
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${badge.class}`}>
                              <Icon size={12} />
                              {badge.label}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-grey-medium" />
                          <span className="text-sm text-grey">{w.owner?.full_name ?? 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex flex-col gap-0.5">
                          {w.contact_email && (
                            <span className="text-xs text-grey-medium flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {w.contact_email}
                            </span>
                          )}
                          {w.contact_phone && (
                            <span className="text-xs text-grey-medium flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {w.contact_phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {progress >= 100 ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <div className="bg-grey-lightest rounded-full h-2 w-16 overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${progress >= 50 ? 'bg-green-500' : progress >= 25 ? 'bg-yellow-500' : 'bg-red-400'}`} style={{ width: `${progress}%` }} />
                            </div>
                          )}
                          <span className="text-xs font-semibold text-grey">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <div className="flex items-center justify-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-grey-medium" />
                          <span className="text-sm font-semibold text-grey-dark">{stats?.customerCount ?? 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <div className="flex items-center justify-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-grey-medium" />
                          <span className="text-sm font-semibold text-grey-dark">{stats?.quoteCount ?? 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <span className="text-sm font-semibold text-grey-dark">{stats ? formatCurrency(stats.revenue) : 'R0'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-grey-medium" />
                          <span className="text-sm font-semibold text-grey-dark">{stats?.appointmentCount ?? 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-grey-medium hidden sm:table-cell">
                        {new Date(w.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          {w.domain && (
                            <a
                              href={`https://${w.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline no-underline"
                              title="Go to site"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <Link
                            href={`/dashboard/super-admin/settings?workshopId=${w.id}`}
                            className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline no-underline"
                          >
                            <Settings2 className="h-3.5 w-3.5" />
                            Settings
                          </Link>
                          {w.status === 'active' && (
                            <button
                              onClick={() => handleStatusChange(w.id, 'suspended', 'Suspended by super-admin')}
                              className="flex items-center gap-1 text-xs text-amber-600 font-semibold hover:underline cursor-pointer"
                              title="Suspend workshop"
                            >
                              <ShieldOff className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {w.status === 'suspended' && (
                            <button
                              onClick={() => handleStatusChange(w.id, 'active')}
                              className="flex items-center gap-1 text-xs text-green-600 font-semibold hover:underline cursor-pointer"
                              title="Reactivate workshop"
                            >
                              <BadgeCheck className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {w.status !== 'inactive' && (
                            <button
                              onClick={() => handleDeactivate(w.id)}
                              className="flex items-center gap-1 text-xs text-red-500 font-semibold hover:underline cursor-pointer"
                              title="Deactivate workshop"
                            >
                              Deactivate
                            </button>
                          )}
                          {w.status === 'inactive' && (
                            <button
                              onClick={() => handleStatusChange(w.id, 'active')}
                              className="flex items-center gap-1 text-xs text-green-600 font-semibold hover:underline cursor-pointer"
                              title="Reactivate workshop"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
