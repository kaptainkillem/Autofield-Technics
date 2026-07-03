import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { verifyStaffUser } from '@/lib/admin-auth'

export async function GET(_request: NextRequest) {
  try {
    const auth = await verifyStaffUser()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const adminClient = createSupabaseAdminClient()

    const [receiptsRes, expensesRes] = await Promise.all([
      adminClient
        .from('receipts')
        .select('*')
        .is('deleted_at', null)
        .order('job_date', { ascending: false }),
      adminClient
        .from('expenses')
        .select('*')
        .is('deleted_at', null)
        .order('expense_date', { ascending: false }),
    ])

    if (receiptsRes.error) {
      console.error('Fetch receipts error:', receiptsRes.error)
      return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 })
    }

    if (expensesRes.error) {
      console.error('Fetch expenses error:', expensesRes.error)
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
    }

    return NextResponse.json({
      receipts: receiptsRes.data ?? [],
      expenses: expensesRes.data ?? [],
    })
  } catch (err: unknown) {
    console.error('Fetch finance API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to fetch finance data', message }, { status: 500 })
  }
}
