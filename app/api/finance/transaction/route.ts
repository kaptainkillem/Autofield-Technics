import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseAdminClient } from '@/lib/supabaseServer'

const RevenueSchema = z.object({
  type: z.literal('revenue'),
  customer_name: z.string().min(1, 'Customer name is required').max(200),
  amount_paid: z.number().positive('Amount must be greater than zero'),
  payment_method: z.string().min(1, 'Payment method is required'),
  job_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  notes: z.string().max(1000).optional(),
})

const ExpenseSchema = z.object({
  type: z.literal('expense'),
  amount: z.number().positive('Amount must be greater than zero'),
  category: z.enum(['Parts', 'Fuel', 'Tools', 'Rent', 'Data', 'Misc']),
  description: z.string().min(1, 'Description is required').max(1000),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
})

const TransactionSchema = z.discriminatedUnion('type', [RevenueSchema, ExpenseSchema])

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parseResult = TransactionSchema.safeParse(body)
  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.issues[0]?.message ?? 'Invalid request data' },
      { status: 400 }
    )
  }

  const supabase = createSupabaseAdminClient()
  const data = parseResult.data

  try {
    if (data.type === 'revenue') {
      // For manual revenue, we need a user_id. Use the admin's own ID or a system placeholder.
      // In a single-mechanic shop, the admin IS the user. We'll accept user_id in payload.
      const { user_id, ...revenueData } = body as Record<string, unknown>

      if (!user_id || typeof user_id !== 'string') {
        return NextResponse.json({ error: 'user_id is required for revenue entries' }, { status: 400 })
      }

      const { data: inserted, error } = await supabase
        .from('receipts')
        .insert({
          user_id,
          customer_name: data.customer_name,
          amount_paid: data.amount_paid,
          payment_method: data.payment_method,
          job_date: data.job_date,
          notes: data.notes ?? null,
          source: 'manual',
        })
        .select()
        .single()

      if (error) {
        console.error('Revenue insert error:', error)
        return NextResponse.json({ error: 'Failed to log revenue' }, { status: 500 })
      }

      return NextResponse.json({ success: true, data: inserted })
    }

    // Expense
    const { user_id, ...expenseBody } = body as Record<string, unknown>
    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json({ error: 'user_id is required for expense entries' }, { status: 400 })
    }

    const { data: inserted, error } = await supabase
      .from('expenses')
      .insert({
        user_id,
        amount: data.amount,
        category: data.category,
        description: data.description,
        expense_date: data.expense_date,
      })
      .select()
      .single()

    if (error) {
      console.error('Expense insert error:', error)
      return NextResponse.json({ error: 'Failed to log expense' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: inserted })
  } catch (err) {
    console.error('Transaction route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
