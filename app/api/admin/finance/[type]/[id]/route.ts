import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'

const VALID_TYPES = ['receipts', 'expenses'] as const
type FinanceType = (typeof VALID_TYPES)[number]

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type: rawType, id } = await params

    const auth = await verifyStaffUser()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    if (!VALID_TYPES.includes(rawType as FinanceType)) {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 })
    }

    const type = rawType as FinanceType

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, remaining } = checkRateLimit(`admin:finance-delete:${ip}`, { maxRequests: 20, windowMs: 60_000 })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    const adminClient = await createSupabaseServerClient()

    const { data: existing, error: fetchError } = await adminClient
      .from(type)
      .select('id')
      .eq('id', id)
      .eq('workshop_id', auth.workshopId!)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const { error } = await adminClient
      .from(type)
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workshop_id', auth.workshopId!)

    if (error) {
      console.error('Delete finance transaction error:', error)
      return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Transaction deleted' })
  } catch (err: unknown) {
    console.error('Delete finance transaction API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to delete transaction', message }, { status: 500 })
  }
}
