'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus, Mail, Phone, User, Building2, Users, FileText, Banknote, Calendar, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { PageWrapper } from '@/components/layout/PageWrapper'

interface Workshop {
  id: string
  name: string
  slug: string
  contact_email: string | null
  contact_phone: string | null
  created_at: string
  owner: { full_name: string } | null
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
      setForm({ ownerEmail: '', ownerPassword: '', ownerName: '', workshopName: '', workshopSlug: '', contactEmail: '', contactPhone: '' })
      fetchWorkshops()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create workshop')
    } finally {
      setCreating(false)
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
                  <th className="px-4 py-3 text-xs font-semibold text-grey uppercase hidden md:table-cell">Owner</th>
                  <th className="px-4 py-3 text-xs font-semibold text-grey uppercase hidden md:table-cell">Contact</th>
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
                    <td colSpan={9} className="px-4 py-8 text-center text-grey-medium text-sm">
                      No workshops yet. Create your first one above.
                    </td>
                  </tr>
                ) : (
                  workshops.map((w) => {
                    const stats = workshopStats.get(w.id)
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
                        <Link
                          href={`/dashboard/super-admin/settings?workshopId=${w.id}`}
                          className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline no-underline justify-end"
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                          Settings
                        </Link>
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
