'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/database'
import { ArrowRight, Loader2, Phone, MapPin, X } from 'lucide-react'
import { TableSearch } from '@/components/ui/TableSearch'
import { toast } from 'sonner'

type Quote = Database['public']['Tables']['quotes']['Row']

interface IncomingTableProps {
  requests: Quote[]
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return `${Math.floor(days / 7)} weeks ago`
}

export function IncomingTable({ requests }: IncomingTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [accepting, setAccepting] = useState<string | null>(null)
  const [declining, setDeclining] = useState<string | null>(null)

  const filtered = requests.filter((r) => {
    const term = search.toLowerCase()
    return (
      (r.customer_name ?? '').toLowerCase().includes(term) ||
      (r.customer_phone ?? '').toLowerCase().includes(term) ||
      (r.description ?? '').toLowerCase().includes(term) ||
      (r.vehicle_make ?? '').toLowerCase().includes(term)
    )
  })

  async function handleAccept(id: string) {
    setAccepting(id)
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'draft' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to accept request')
      }
      toast.success('Request accepted. Opening quote builder...')
      router.push(`/dashboard/admin/quotes/builder?quoteId=${id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept request')
    } finally {
      setAccepting(null)
    }
  }

  async function handleDecline(id: string) {
    setDeclining(id)
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'declined' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to decline request')
      }
      toast.success('Request declined')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to decline request')
    } finally {
      setDeclining(null)
    }
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-16 text-grey bg-white border border-dashed rounded-base">
        <MapPin size={32} className="mx-auto mb-2 text-grey-medium" />
        <p className="font-semibold">All clear! No pending requests.</p>
        <p className="text-xs mt-1">New incoming submissions will appear here.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="bg-amber-50 border border-amber-200 rounded-base px-4 py-2 text-sm text-amber-800 font-bold">
          {requests.length} pending request{requests.length !== 1 ? 's' : ''}
        </div>
        <div className="w-full sm:max-w-xs">
          <TableSearch
            placeholder="Search name, vehicle..."
            value={search}
            onChange={setSearch}
          />
        </div>
      </div>

      <div className="border border-grey-medium/10 rounded-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-grey-medium/20 text-grey uppercase tracking-wider text-xs bg-white">
                <th className="py-3 px-4 font-bold">Customer</th>
                <th className="py-3 px-4 font-bold hidden md:table-cell">Vehicle</th>
                <th className="py-3 px-4 font-bold hidden lg:table-cell">Issue</th>
                <th className="py-3 px-4 font-bold">Source</th>
                <th className="py-3 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-light">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-primary/5 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-grey-dark">{r.customer_name}</p>
                    <div className="flex items-center gap-1 text-xs text-grey mt-0.5">
                      <Phone size={11} />
                      {r.customer_phone}
                      {r.customer_email && (
                        <span className="ml-1 text-primary">{r.customer_email}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-grey-dark hidden md:table-cell">
                    {[r.vehicle_make, r.vehicle_model, r.vehicle_year]
                      .filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    <p className="text-xs text-grey max-w-xs truncate">
                      {r.description?.replace(/\[Service:\s*([^\]]+)\]\s*(—\s*)?/, '') ?? '—'}
                    </p>
                    <span className="text-[10px] text-grey-medium">
                      {r.created_at ? timeAgo(r.created_at) : '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700">
                      {r.source || 'request'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleDecline(r.id)}
                        disabled={accepting !== null || declining !== null}
                        className="inline-flex items-center gap-1 px-2 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-base transition-colors disabled:opacity-50"
                      >
                        {declining === r.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <X size={13} />
                        )}
                        Decline
                      </button>
                      <button
                        onClick={() => handleAccept(r.id)}
                        disabled={accepting !== null || declining !== null}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-base hover:bg-primary-dark transition-colors disabled:opacity-50 shadow-sm"
                      >
                        {accepting === r.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <ArrowRight size={13} />
                        )}
                        Accept
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
