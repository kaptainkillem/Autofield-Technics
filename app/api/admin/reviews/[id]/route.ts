import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'

const StatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const auth = await verifyStaffUser()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, remaining } = checkRateLimit(`admin:reviews-status:${ip}`, { maxRequests: 30, windowMs: 60_000 })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    let body: z.infer<typeof StatusSchema>
    try {
      body = StatusSchema.parse(await request.json())
    } catch {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const adminClient = createSupabaseAdminClient()

    const { data: existing, error: fetchError } = await adminClient
      .from('reviews')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const { data, error } = await adminClient
      .from('reviews')
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update review status error:', error)
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
    }

    return NextResponse.json({ success: true, review: data })
  } catch (err: unknown) {
    console.error('Update review status API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to update review', message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const auth = await verifyStaffUser()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, remaining } = checkRateLimit(`admin:reviews-delete:${ip}`, { maxRequests: 20, windowMs: 60_000 })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    const adminClient = createSupabaseAdminClient()

    const { data: existing, error: fetchError } = await adminClient
      .from('reviews')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const { data, error } = await adminClient
      .from('reviews')
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Delete review error:', error)
      return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
    }

    return NextResponse.json({ success: true, review: data })
  } catch (err: unknown) {
    console.error('Delete review API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to delete review', message }, { status: 500 })
  }
}
