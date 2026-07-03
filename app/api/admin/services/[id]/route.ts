import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'

const ServiceUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional().nullable(),
  category_id: z.string().uuid().optional().nullable().or(z.literal('')),
  category: z.string().trim().optional().nullable(),
  base_price: z.number().min(0).optional().nullable(),
  is_active: z.boolean().optional(),
  image_url: z.string().trim().url().optional().nullable().or(z.literal('')),
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
    const { allowed, remaining } = checkRateLimit(`admin:services-edit:${ip}`, { maxRequests: 20, windowMs: 60_000 })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    let body: z.infer<typeof ServiceUpdateSchema>
    try {
      body = ServiceUpdateSchema.parse(await request.json())
    } catch {
      return NextResponse.json({ error: 'Invalid service data' }, { status: 400 })
    }

    const adminClient = createSupabaseAdminClient()

    const { data: existing, error: fetchError } = await adminClient
      .from('services')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined) updates.name = body.name
    if (body.description !== undefined) updates.description = body.description
    if (body.category_id !== undefined) updates.category_id = body.category_id || null
    if (body.category !== undefined) updates.category = body.category
    if (body.base_price !== undefined) updates.base_price = body.base_price
    if (body.is_active !== undefined) updates.is_active = body.is_active
    if (body.image_url !== undefined) updates.image_url = body.image_url || null

    const { data, error } = await adminClient
      .from('services')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update service error:', error)
      return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
    }

    return NextResponse.json({ success: true, service: data })
  } catch (err: unknown) {
    console.error('Update service API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to update service', message }, { status: 500 })
  }
}
