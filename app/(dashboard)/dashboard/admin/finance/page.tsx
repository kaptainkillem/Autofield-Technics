'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { FinanceSummaryCards } from '@/components/admin/FinanceSummaryCards'
import { FinanceLedger } from '@/components/admin/FinanceLedger'
import { TransactionModal } from '@/components/admin/TransactionModal'
import { Database } from '@/types/database'

type Receipt = Database['public']['Tables']['receipts']['Row']
type Expense = Database['public']['Tables']['expenses']['Row']

export default function AdminFinancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [modalOpen, setModalOpen] = useState(false)

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/signin')
      return
    }

    const role = user.user_metadata?.role ?? 'client'
    if (role !== 'admin') {
      router.push('/dashboard')
      return
    }

    setUserId(user.id)

    const [receiptsRes, expensesRes] = await Promise.all([
      (supabase as any)
        .from('receipts')
        .select('*')
        .is('deleted_at', null)
        .order('job_date', { ascending: false }),
      (supabase as any)
        .from('expenses')
        .select('*')
        .is('deleted_at', null)
        .order('expense_date', { ascending: false }),
    ])

    setReceipts(receiptsRes.data ?? [])
    setExpenses(expensesRes.data ?? [])
    setLoading(false)
  }, [router])

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
          userId={userId}
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
