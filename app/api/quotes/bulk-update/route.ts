import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'

const BULK_UPDATE_SCHEMA = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one quote ID required'),
  status: z.enum(['draft', 'pending', 'sent', 'accepted', 'declined', 'completed', 'cancelled']),
})

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyStaffUser()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, remaining } = checkRateLimit(`admin:bulk-update:${ip}`, { maxRequests: 10, windowMs: 60_000 })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }
    const body = await req.json()
    const { ids, status } = BULK_UPDATE_SCHEMA.parse(body)

    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
      .from('quotes')
      .update({ status })
      .eq('workshop_id', auth.workshopId!)
      .in('id', ids)
      .select('id, status')

    if (error) throw error

    return NextResponse.json(
      { success: true, updated: data?.length ?? 0 },
      { status: 200 }
    )
  } catch (err) {
    console.error('[BULK UPDATE QUOTES]', err)

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: err.issues[0]?.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update quotes' },
      { status: 500 }
    )
  }
}
