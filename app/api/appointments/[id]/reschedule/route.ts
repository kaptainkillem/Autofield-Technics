import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabaseServer'

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

    const adminClient = createSupabaseAdminClient()

    // 2. Verify appointment exists and belongs to user
    const { data: appointment, error: fetchError } = await adminClient
      .from('appointments')
      .select('id, status, user_id, notes')
      .eq('id', id)
      .single()

    if (fetchError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    if (appointment.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only reschedule your own appointments' }, { status: 403 })
    }

    // 3. Only allow rescheduling confirmed or pending appointments
    if (!['confirmed', 'pending'].includes(appointment.status)) {
      return NextResponse.json(
        { error: 'Only confirmed or pending appointments can be rescheduled' },
        { status: 400 }
      )
    }

    // 4. Update status to pending with reschedule note
    const existingNotes = appointment.notes ?? ''
    const rescheduleNote = existingNotes
      ? `${existingNotes}\n[Client requested reschedule]`
      : '[Client requested reschedule]'

    const { data: updated, error: updateError } = await adminClient
      .from('appointments')
      .update({
        status: 'pending',
        notes: rescheduleNote,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Reschedule error:', updateError)
      return NextResponse.json({ error: 'Failed to request reschedule' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      appointment: updated,
      message: 'Reschedule requested. The mechanic will propose a new time.',
    })
  } catch (err: unknown) {
    console.error('Reschedule API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to request reschedule', message },
      { status: 500 }
    )
  }
}
