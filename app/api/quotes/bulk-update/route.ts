import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabaseServer'
import { z } from 'zod'

const BULK_UPDATE_SCHEMA = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one quote ID required'),
  status: z.enum(['pending', 'sent', 'accepted', 'completed', 'cancelled']),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ids, status } = BULK_UPDATE_SCHEMA.parse(body)

    const supabase = createSupabaseAdminClient()

    const { data, error } = await supabase
      .from('quotes')
      .update({ status })
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
