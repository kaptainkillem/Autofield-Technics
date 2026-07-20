import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { z } from 'zod'

const RespondBodySchema = z.object({
  action: z.enum(['accept', 'decline']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. Verify client auth
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate body
    let body: z.infer<typeof RespondBodySchema>
    try {
      const raw = await request.json()
      body = RespondBodySchema.parse(raw)
    } catch {
      return NextResponse.json(
        { error: 'Invalid body. Expected: { action: "accept" | "decline" }' },
        { status: 400 }
      )
    }

    const adminClient = await createSupabaseServerClient()

    // 3. Verify appointment exists, belongs to user, and is proposed
    const { data: appointment, error: fetchError } = await adminClient
      .from('appointments')
      .select('id, status, user_id, proposed_date, proposed_time')
      .eq('id', id)
      .single()

    if (fetchError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    if (appointment.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only respond to your own appointments' }, { status: 403 })
    }

    if (appointment.status !== 'proposed') {
      return NextResponse.json(
        { error: 'This appointment does not have a pending proposal' },
        { status: 400 }
      )
    }

    // 4. Handle accept vs decline
    if (body.action === 'accept') {
      // Accept: copy proposed dates to scheduled dates, clear proposal fields, confirm
      const { data: updated, error: updateError } = await adminClient
        .from('appointments')
        .update({
          scheduled_date: appointment.proposed_date ?? undefined,
          scheduled_time: appointment.proposed_time ?? undefined,
          proposed_date: null,
          proposed_time: null,
          proposed_notes: null,
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('Accept proposal error:', updateError)
        return NextResponse.json({ error: 'Failed to accept proposal' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        appointment: updated,
        message: 'Proposal accepted. Appointment confirmed.',
      })
    } else {
      // Decline: revert to pending, clear proposal fields
      const { data: updated, error: updateError } = await adminClient
        .from('appointments')
        .update({
          proposed_date: null,
          proposed_time: null,
          proposed_notes: null,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('Decline proposal error:', updateError)
        return NextResponse.json({ error: 'Failed to decline proposal' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        appointment: updated,
        message: 'Proposal declined. The mechanic will suggest another time.',
      })
    }
  } catch (err: unknown) {
    console.error('Respond appointment API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to respond to proposal', message },
      { status: 500 }
    )
  }
}
