'use client'

import { useState } from 'react'
import { Database } from '@/types/database'
import { Trash2, Loader2, DollarSign, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'

type Receipt = Database['public']['Tables']['receipts']['Row']
type Expense = Database['public']['Tables']['expenses']['Row']

interface FinanceLedgerProps {
  receipts: Receipt[]
  expenses: Expense[]
  onRefresh: () => void
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 14) return '1 week ago'
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

export function FinanceLedger({ receipts, expenses, onRefresh }: FinanceLedgerProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'revenue' | 'expenses'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingType, setDeletingType] = useState<'receipt' | 'expense' | null>(null)

  async function handleDeleteReceipt(id: string) {
    if (!confirm('Delete this receipt?')) return
    setDeletingId(id)
    setDeletingType('receipt')

    try {
      const res = await fetch(`/api/admin/finance/receipts/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to delete receipt')
        return
      }

      toast.success('Receipt deleted')
      onRefresh()
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setDeletingId(null)
      setDeletingType(null)
    }
  }

  async function handleDeleteExpense(id: string) {
    if (!confirm('Delete this expense?')) return
    setDeletingId(id)
    setDeletingType('expense')

    try {
      const res = await fetch(`/api/admin/finance/expenses/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to delete expense')
        return
      }

      toast.success('Expense deleted')
      onRefresh()
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setDeletingId(null)
      setDeletingType(null)
    }
  }

  const visibleReceipts = activeTab === 'expenses' ? [] : receipts
  const visibleExpenses = activeTab === 'revenue' ? [] : expenses

  const hasData = visibleReceipts.length > 0 || visibleExpenses.length > 0

  if (!hasData) {
    return (
      <div className="text-center py-10 text-grey bg-white border border-grey-medium/10 rounded-base">
        <p className="text-3xl mb-2">🧾</p>
        <p className="text-sm text-grey">
          {activeTab === 'revenue'
            ? 'No revenue entries yet.'
            : activeTab === 'expenses'
            ? 'No expenses recorded yet.'
            : 'No transactions yet. Log your first entry above.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tab Filter */}
      <div className="flex items-center gap-1 bg-white border border-grey-medium/10 rounded-base p-1 shadow-sm w-fit">
        {(['all', 'revenue', 'expenses'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-base text-xs font-semibold transition-all cursor-pointer capitalize ${
              activeTab === tab
                ? 'bg-primary text-white shadow-sm'
                : 'text-grey hover:bg-primary/5 hover:text-grey-dark'
            }`}
          >
            {tab === 'all' ? `All (${receipts.length + expenses.length})` : `${tab} (${tab === 'revenue' ? receipts.length : expenses.length})`}
          </button>
        ))}
      </div>

      {/* Revenue Table */}
      {(activeTab === 'all' || activeTab === 'revenue') && visibleReceipts.length > 0 && (
        <div className="border border-grey-medium/10 rounded-base overflow-hidden">
          <div className="p-3 border-b border-grey-medium/20 bg-success/5 flex items-center gap-2">
            <DollarSign size={14} className="text-success" />
            <span className="text-xs font-bold text-success uppercase tracking-wider">Revenue</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-white border-b border-grey-medium/20 text-grey uppercase tracking-wider text-xs">
                  <th className="py-3 px-4 font-bold">Customer</th>
                  <th className="py-3 px-4 font-bold hidden md:table-cell">Method</th>
                  <th className="py-3 px-4 font-bold">Amount</th>
                  <th className="py-3 px-4 font-bold hidden sm:table-cell">Date</th>
                  <th className="py-3 px-4 font-bold w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-light">
                {visibleReceipts.map((inv) => (
                  <tr key={inv.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-grey-dark">
                        {inv.customer_name ?? 'Unknown'}
                      </p>
                      {inv.source === 'manual' && (
                        <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded font-semibold">
                          Manual
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-grey hidden md:table-cell capitalize">
                      {inv.payment_method ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-grey-dark">
                      R {(inv.amount_paid ?? 0).toLocaleString('en-ZA')}
                    </td>
                    <td className="px-4 py-3 text-grey hidden sm:table-cell">
                      {inv.created_at ? timeAgo(inv.created_at) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteReceipt(inv.id)}
                        disabled={deletingId === inv.id && deletingType === 'receipt'}
                        className="p-1.5 rounded-base text-grey-medium hover:text-error hover:bg-error/5 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete receipt"
                      >
                        {deletingId === inv.id && deletingType === 'receipt' ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      {(activeTab === 'all' || activeTab === 'expenses') && visibleExpenses.length > 0 && (
        <div className="border border-grey-medium/10 rounded-base overflow-hidden">
          <div className="p-3 border-b border-grey-medium/20 bg-error/5 flex items-center gap-2">
            <TrendingDown size={14} className="text-error" />
            <span className="text-xs font-bold text-error uppercase tracking-wider">Expenses</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-white border-b border-grey-medium/20 text-grey uppercase tracking-wider text-xs">
                  <th className="py-3 px-4 font-bold">Category</th>
                  <th className="py-3 px-4 font-bold hidden md:table-cell">Description</th>
                  <th className="py-3 px-4 font-bold">Amount</th>
                  <th className="py-3 px-4 font-bold hidden sm:table-cell">Date</th>
                  <th className="py-3 px-4 font-bold w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-light">
                {visibleExpenses.map((ex) => (
                  <tr key={ex.id} className="hover:bg-error/5 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold bg-error/10 text-error px-2 py-0.5 rounded">
                        {ex.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-grey hidden md:table-cell">
                      {ex.description ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-grey-dark">
                      R {(ex.amount ?? 0).toLocaleString('en-ZA')}
                    </td>
                    <td className="px-4 py-3 text-grey hidden sm:table-cell">
                      {ex.created_at ? timeAgo(ex.created_at) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(ex.id)}
                        disabled={deletingId === ex.id && deletingType === 'expense'}
                        className="p-1.5 rounded-base text-grey-medium hover:text-error hover:bg-error/5 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete expense"
                      >
                        {deletingId === ex.id && deletingType === 'expense' ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
