import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const VALID_STATUSES = ['pending', 'sent', 'accepted', 'completed', 'cancelled']

const PatchBodySchema = z.object({
  status: z.enum(['pending', 'sent', 'accepted', 'completed', 'cancelled']),
})

async function verifyAdmin() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { authorized: false as const, error: 'Unauthorized', status: 401 }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  if (profile?.role !== 'admin') {
    return { authorized: false as const, error: 'Forbidden', status: 403 }
  }

  return { authorized: true as const }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // 🔒 1. Verify caller is authenticated admin
  const auth = await verifyAdmin()
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  // 2. Validate body with Zod
  let body: z.infer<typeof PatchBodySchema>
  try {
    const raw = await request.json()
    body = PatchBodySchema.parse(raw)
  } catch {
    return NextResponse.json(
      { error: `Status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from('quotes')
    .update({ status: body.status, updated_at: new Date().toISOString() } as never)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  return NextResponse.json({ quote: data })
}