'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { FinanceSummaryCards } from '@/components/admin/FinanceSummaryCards'
import { FinanceLedger } from '@/components/admin/FinanceLedger'
import { TransactionModal } from '@/components/admin/TransactionModal'
import { Database } from '@/types/database'
import { toast } from 'sonner'

type Receipt = Database['public']['Tables']['receipts']['Row']
type Expense = Database['public']['Tables']['expenses']['Row']

export default function AdminFinancePage() {
  const [loading, setLoading] = useState(true)
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [modalOpen, setModalOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/finance')
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to load finance data')
        setReceipts([])
        setExpenses([])
      } else {
        setReceipts(data.receipts ?? [])
        setExpenses(data.expenses ?? [])
      }
    } catch {
      toast.error('Network error loading finance data')
      setReceipts([])
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalRevenue = receipts.reduce((sum, r) => sum + (r.amount_paid ?? 0), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0)

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex min-h-[400px] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper className="gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-grey-dark tracking-tight">
            Finance Command Center
          </h1>
          <p className="text-xs text-grey">
            Track revenue, log expenses, and monitor your net profit in real time.
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-primary text-white font-bold flex items-center gap-1.5 shadow-sm"
        >
          <Plus size={16} />
          Log Transaction
        </Button>
      </div>

      {/* Summary Cards */}
      <FinanceSummaryCards totalRevenue={totalRevenue} totalExpenses={totalExpenses} />

      {/* Ledger */}
      <div className="bg-white border border-grey-medium/10 rounded-base p-6 shadow-sm">
        <FinanceLedger
          receipts={receipts}
          expenses={expenses}
          onRefresh={fetchData}
        />
      </div>

      {/* Modal */}
      {modalOpen && (
        <TransactionModal
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false)
            fetchData()
          }}
        />
      )}
    </PageWrapper>
  )
}
