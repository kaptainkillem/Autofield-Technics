import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

const VALID_STATUSES = ['pending', 'sent', 'accepted', 'completed', 'cancelled']

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let body: { status?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
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