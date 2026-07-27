import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'

const ProposeBodySchema = z.object({
  proposed_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  proposed_time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm'),
  proposed_notes: z.string().max(500, 'Notes must be under 500 characters').optional(),
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

    const { allowed, remaining } = checkRateLimit(`propose:${auth.userId}`, {
      maxRequests: 20,
      windowMs: 60_000,
    })

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    // Validate body
    let body: z.infer<typeof ProposeBodySchema>
    try {
      const raw = await request.json()
      body = ProposeBodySchema.parse(raw)
    } catch {
      return NextResponse.json(
        { error: 'Invalid body. Expected: { proposed_date: "YYYY-MM-DD", proposed_time: "HH:mm", proposed_notes?: string }' },
        { status: 400 }
      )
    }

    const adminClient = await createSupabaseServerClient()

    // Verify appointment exists, is in a valid state, and belongs to the staff user's workshop
    const { data: appointment, error: fetchError } = await adminClient
      .from('appointments')
      .select('id, status, user_id')
      .eq('id', id)
      .eq('workshop_id', auth.workshopId!)
      .single()

    if (fetchError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    if (!['pending', 'proposed', 'confirmed'].includes(appointment.status)) {
      return NextResponse.json(
        { error: 'Can only propose new dates for pending, proposed, or confirmed appointments' },
        { status: 400 }
      )
    }

    // Update appointment with proposal
    const { data: updated, error: updateError } = await adminClient
      .from('appointments')
      .update({
        proposed_date: body.proposed_date,
        proposed_time: body.proposed_time,
        proposed_notes: body.proposed_notes ?? null,
        status: 'proposed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('workshop_id', auth.workshopId!)
      .select()
      .single()

    if (updateError) {
      console.error('Propose appointment error:', updateError)
      return NextResponse.json({ error: 'Failed to propose new date' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      appointment: updated,
      message: 'New date proposed. Client will be notified.',
    })
  } catch (err: unknown) {
    console.error('Propose appointment API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to propose new date', message },
      { status: 500 }
    )
  }
}
