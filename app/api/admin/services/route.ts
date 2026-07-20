import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'

const ServiceSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  category_id: z.string().uuid().optional().or(z.literal('')),
  category: z.string().trim().optional(),
  base_price: z.number().min(0).optional().nullable(),
  is_active: z.boolean().default(true),
  image_url: z.string().trim().url().optional().or(z.literal('')),
})

async function getWorkshopUserId(serverClient: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { session } } = await serverClient.auth.getSession()
  if (!session) return { userId: null, workshopId: null }

  try {
    const payload = JSON.parse(atob(session.access_token.split('.')[1]))
    return {
      userId: session.user?.id ?? null,
      workshopId: payload?.app_metadata?.workshop_id ?? null,
    }
  } catch {
    return { userId: null, workshopId: null }
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyStaffUser()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, remaining } = checkRateLimit(`admin:services-create:${ip}`, { maxRequests: 20, windowMs: 60_000 })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    let body: z.infer<typeof ServiceSchema>
    try {
      body = ServiceSchema.parse(await request.json())
    } catch {
      return NextResponse.json({ error: 'Invalid service data' }, { status: 400 })
    }

    const adminClient = await createSupabaseServerClient()
    const { userId, workshopId } = await getWorkshopUserId(adminClient)
    if (!userId || !workshopId) {
      return NextResponse.json({ error: 'Unable to resolve user' }, { status: 500 })
    }

    const { data, error } = await adminClient
      .from('services')
      .insert({
        user_id: userId,
        workshop_id: workshopId,
        name: body.name,
        description: body.description || null,
        category_id: body.category_id || null,
        category: body.category || null,
        base_price: body.base_price ?? null,
        is_active: body.is_active,
        image_url: body.image_url || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Create service error:', error)
      return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
    }

    return NextResponse.json({ success: true, service: data })
  } catch (err: unknown) {
    console.error('Create service API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create service', message }, { status: 500 })
  }
}
