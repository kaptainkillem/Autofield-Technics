'use client'

import { useState } from 'react'
import { X, Loader2, DollarSign, TrendingDown, Calendar, FileText, User, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type TransactionType = 'revenue' | 'expense'

interface TransactionModalProps {
  onClose: () => void
  onSaved: () => void
}

const EXPENSE_CATEGORIES = ['Parts', 'Fuel', 'Tools', 'Rent', 'Data', 'Misc']
const PAYMENT_METHODS = ['Cash', 'Card', 'EFT']

export function TransactionModal({ onClose, onSaved }: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('revenue')
  const [saving, setSaving] = useState(false)

  // Revenue form
  const [revenueForm, setRevenueForm] = useState({
    customer_name: '',
    amount_paid: '',
    payment_method: 'Cash',
    job_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  // Expense form
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: 'Parts',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const payload =
      type === 'revenue'
        ? {
            type: 'revenue' as const,
            customer_name: revenueForm.customer_name.trim(),
            amount_paid: parseFloat(revenueForm.amount_paid),
            payment_method: revenueForm.payment_method,
            job_date: revenueForm.job_date,
            notes: revenueForm.notes.trim() || undefined,
          }
        : {
            type: 'expense' as const,
            amount: parseFloat(expenseForm.amount),
            category: expenseForm.category,
            description: expenseForm.description.trim(),
            expense_date: expenseForm.expense_date,
          }

    try {
      const res = await fetch('/api/finance/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to save transaction')
        setSaving(false)
        return
      }

      toast.success(type === 'revenue' ? 'Revenue logged!' : 'Expense recorded!')
      onSaved()
    } catch {
      toast.error('Network error. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-base shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-grey-medium/20">
          <h2 className="text-lg font-bold text-grey-dark">Log Transaction</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-base text-grey hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="p-5 pb-0">
          <div className="flex gap-1 bg-grey-lightest rounded-base p-1">
            <button
              type="button"
              onClick={() => setType('revenue')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-base text-sm font-semibold transition-all cursor-pointer ${
                type === 'revenue'
                  ? 'bg-success text-white shadow-sm'
                  : 'text-grey hover:text-grey-dark'
              }`}
            >
              <DollarSign size={14} />
              Income
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-base text-sm font-semibold transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-error text-white shadow-sm'
                  : 'text-grey hover:text-grey-dark'
              }`}
            >
              <TrendingDown size={14} />
              Expense
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {type === 'revenue' ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-grey uppercase tracking-wide flex items-center gap-1.5">
                  <User size={12} />
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={revenueForm.customer_name}
                  onChange={(e) => setRevenueForm((p) => ({ ...p, customer_name: e.target.value }))}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-grey uppercase tracking-wide flex items-center gap-1.5">
                    <DollarSign size={12} />
                    Amount (R)
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={revenueForm.amount_paid}
                    onChange={(e) => setRevenueForm((p) => ({ ...p, amount_paid: e.target.value }))}
                    placeholder="0.00"
                    className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-grey uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar size={12} />
                    Job Date
                  </label>
                  <input
                    type="date"
                    required
                    value={revenueForm.job_date}
                    onChange={(e) => setRevenueForm((p) => ({ ...p, job_date: e.target.value }))}
                    className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-grey uppercase tracking-wide flex items-center gap-1.5">
                  <Tag size={12} />
                  Payment Method
                </label>
                <select
                  value={revenueForm.payment_method}
                  onChange={(e) => setRevenueForm((p) => ({ ...p, payment_method: e.target.value }))}
                  className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark h-[40px]"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-grey uppercase tracking-wide flex items-center gap-1.5">
                  <FileText size={12} />
                  Notes
                </label>
                <textarea
                  value={revenueForm.notes}
                  onChange={(e) => setRevenueForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional details about the job..."
                  rows={2}
                  className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark resize-none"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-grey uppercase tracking-wide flex items-center gap-1.5">
                    <DollarSign size={12} />
                    Amount (R)
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-grey uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar size={12} />
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.expense_date}
                    onChange={(e) => setExpenseForm((p) => ({ ...p, expense_date: e.target.value }))}
                    className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-grey uppercase tracking-wide flex items-center gap-1.5">
                  <Tag size={12} />
                  Category
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark h-[40px]"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-grey uppercase tracking-wide flex items-center gap-1.5">
                  <FileText size={12} />
                  Description
                </label>
                <textarea
                  required
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Brake pads for BMW M4"
                  rows={2}
                  className="w-full rounded-base border border-grey-light bg-white py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors text-grey-dark resize-none"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-base border border-grey-medium text-grey text-sm font-semibold hover:bg-primary/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-base text-white text-sm font-bold transition-colors disabled:opacity-50 ${
                type === 'revenue' ? 'bg-success hover:bg-success/90' : 'bg-error hover:bg-error/90'
              }`}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              <span>{saving ? 'Saving...' : type === 'revenue' ? 'Log Income' : 'Record Expense'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
