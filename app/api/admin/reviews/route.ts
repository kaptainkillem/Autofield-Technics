import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'

export async function GET(_request: NextRequest) {
  try {
    const auth = await verifyStaffUser()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { allowed, remaining } = checkRateLimit(`admin:reviews:${auth.userId}`, {
      maxRequests: 20,
      windowMs: 60_000,
    })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    const adminClient = await createSupabaseServerClient()

    const { data, error } = await adminClient
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        status,
        created_at,
        profiles (
          full_name,
          phone
        )
      `)
      .eq('workshop_id', auth.workshopId!)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch reviews error:', error)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    return NextResponse.json({ reviews: data ?? [] })
  } catch (err: unknown) {
    console.error('Fetch reviews API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to fetch reviews', message }, { status: 500 })
  }
}
