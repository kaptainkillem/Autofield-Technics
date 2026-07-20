import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'

const EditCustomerSchema = z.object({
  full_name: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  alternate_phone: z.string().trim().optional(),
  physical_address: z.string().trim().optional(),
  prefers_whatsapp: z.boolean().optional(),
  service_reminders_opt_in: z.boolean().optional(),
  client_status: z.string().trim().optional(),
  internal_notes: z.string().trim().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const auth = await verifyStaffUser()
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed, remaining } = checkRateLimit(`admin:customers:${ip}`, { maxRequests: 20, windowMs: 60_000 })
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  }

  let body
  try {
    body = EditCustomerSchema.parse(await request.json())
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()

  const updates: Record<string, unknown> = {}

  if (body.full_name !== undefined) updates.full_name = body.full_name || null
  if (body.phone !== undefined) updates.phone = body.phone || null
  if (body.alternate_phone !== undefined) updates.alternate_phone = body.alternate_phone || null
  if (body.physical_address !== undefined) updates.physical_address = body.physical_address || null
  if (body.prefers_whatsapp !== undefined) updates.prefers_whatsapp = body.prefers_whatsapp
  if (body.service_reminders_opt_in !== undefined) updates.service_reminders_opt_in = body.service_reminders_opt_in
  if (body.client_status !== undefined) updates.client_status = body.client_status
  if (body.internal_notes !== undefined) updates.internal_notes = body.internal_notes || null

  if (!auth.workshopId) {
    return NextResponse.json({ error: 'No workshop assigned to this account' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates as never)
    .eq('id', id)
    .eq('workshop_id', auth.workshopId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: data })
}
