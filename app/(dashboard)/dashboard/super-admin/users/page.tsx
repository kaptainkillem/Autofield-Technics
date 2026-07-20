'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, Users, Search, User, Mail, Phone, Building2, ArrowLeft, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { PageWrapper } from '@/components/layout/PageWrapper'

interface UserData {
  id: string
  fullName: string
  email: string | null
  role: string
  workshopId: string | null
  workshopName: string | null
  phone: string | null
  createdAt: string
}

interface Workshop {
  id: string
  name: string
}

const ROLES = [
  { value: '', label: 'All Roles' },
  { value: 'client', label: 'Client' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
]

const roleBadge = (role: string) => {
  switch (role) {
    case 'super_admin': return 'bg-purple-100 text-purple-700'
    case 'admin': return 'bg-blue-100 text-blue-700'
    default: return 'bg-green-100 text-green-700'
  }
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [workshopFilter, setWorkshopFilter] = useState('')
  const [workshops, setWorkshops] = useState<Workshop[]>([])

  useEffect(() => {
    async function fetchWorkshops() {
      try {
        const res = await fetch('/api/admin/workshops')
        if (res.ok) {
          const { workshops: data } = await res.json()
          setWorkshops(data ?? [])
        }
      } catch {
        // Workshop filter is optional
      }
    }
    fetchWorkshops()
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [page, roleFilter, workshopFilter])

  async function fetchUsers() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (roleFilter) params.set('role', roleFilter)
      if (workshopFilter) params.set('workshopId', workshopFilter)
      if (search.trim()) params.set('search', search.trim())

      const res = await fetch(`/api/admin/super-admin/users?${params}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setUsers(data.users ?? [])
      setTotal(data.total ?? 0)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch() {
    setPage(1)
    fetchUsers()
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <PageWrapper>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/super-admin"
            className="p-2 bg-white rounded-base border border-grey-medium/10 text-grey hover:text-primary transition-all shadow-sm no-underline"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-grey-dark tracking-tight">Global Users</h1>
            <p className="text-xs text-grey">View and manage all users across workshops.</p>
          </div>
        </div>

        <div className="bg-white border border-grey-medium/10 rounded-base p-4 shadow-sm flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-medium" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name..."
                className="w-full pl-9 pr-3 py-2 rounded-base border border-grey-light text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 text-grey-dark"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-primary text-white rounded-base text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              Search
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
                className="appearance-none rounded-base border border-grey-light bg-white py-2 pl-3 pr-8 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 text-grey-dark"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-grey pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={workshopFilter}
                onChange={(e) => { setWorkshopFilter(e.target.value); setPage(1) }}
                className="appearance-none rounded-base border border-grey-light bg-white py-2 pl-3 pr-8 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 text-grey-dark"
              >
                <option value="">All Workshops</option>
                {workshops.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-grey pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-grey-light rounded-base shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-grey-lightest border-b border-grey-light">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-grey uppercase">User</th>
                <th className="px-4 py-3 text-xs font-semibold text-grey uppercase hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-xs font-semibold text-grey uppercase">Role</th>
                <th className="px-4 py-3 text-xs font-semibold text-grey uppercase hidden lg:table-cell">Workshop</th>
                <th className="px-4 py-3 text-xs font-semibold text-grey uppercase hidden sm:table-cell">Phone</th>
                <th className="px-4 py-3 text-xs font-semibold text-grey uppercase hidden xl:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-light">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-grey-medium text-sm">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-grey-lightest/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-grey-lightest flex items-center justify-center">
                          <User size={14} className="text-grey-medium" />
                        </div>
                        <span className="text-sm font-semibold text-grey-dark">{u.fullName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-grey-medium" />
                        <span className="text-sm text-grey">{u.email || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${roleBadge(u.role)}`}>
                        {u.role === 'super_admin' ? 'Super Admin' : u.role === 'admin' ? 'Admin' : 'Client'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {u.workshopName ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-grey-medium" />
                          <span className="text-sm text-grey">{u.workshopName}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-grey-medium">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-grey-medium" />
                        <span className="text-sm text-grey">{u.phone || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-grey-medium hidden xl:table-cell">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white border border-grey-medium/10 rounded-base p-3 shadow-sm">
            <span className="text-xs text-grey">
              {total} users &middot; Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-base border border-grey-light text-grey hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-base text-xs font-semibold transition-colors ${
                      page === pageNum
                        ? 'bg-primary text-white'
                        : 'text-grey hover:bg-primary/5'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-base border border-grey-light text-grey hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
