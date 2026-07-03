import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'

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
  const auth = await verifyStaffUser()
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed, remaining } = checkRateLimit(`finance:${ip}`, { maxRequests: 20, windowMs: 60_000 })
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  }
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

  const adminClient = createSupabaseAdminClient()
  const data = parseResult.data
  const adminUserId = auth.userId

  try {
    if (data.type === 'revenue') {
      const { data: inserted, error } = await adminClient
        .from('receipts')
        .insert({
          user_id: adminUserId,
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
    const { data: inserted, error } = await adminClient
      .from('expenses')
      .insert({
        user_id: adminUserId,
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
