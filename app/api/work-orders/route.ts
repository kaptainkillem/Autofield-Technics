import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, getRoleFromJWT } from '@/lib/supabaseServer'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { z } from 'zod'

const CreateWorkOrderSchema = z.object({
  appointment_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyStaffUser()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, remaining } = checkRateLimit(`admin:work-orders-create:${ip}`, { maxRequests: 20, windowMs: 60_000 })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    let body: z.infer<typeof CreateWorkOrderSchema>
    try {
      body = CreateWorkOrderSchema.parse(await request.json())
    } catch {
      return NextResponse.json({ error: 'Invalid body. Expected: { appointment_id: string }' }, { status: 400 })
    }

    const serverClient = await createSupabaseServerClient()
    const { data: { user } } = await serverClient.auth.getUser()
    const adminId = user?.id ?? null

    const adminClient = await createSupabaseServerClient()

    // Fetch the appointment with its quote
    const { data: appointment, error: appointmentError } = await adminClient
      .from('appointments')
      .select('id, quote_id, status, user_id, workshop_id')
      .eq('id', body.appointment_id)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    if (appointment.workshop_id !== auth.workshopId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (appointment.status !== 'confirmed') {
      return NextResponse.json({ error: 'Work orders can only be started from confirmed appointments' }, { status: 400 })
    }

    if (!appointment.quote_id) {
      return NextResponse.json({ error: 'Appointment must be linked to a quote' }, { status: 400 })
    }

    // Prevent duplicate work orders for the same appointment
    const { data: existing, error: existingError } = await adminClient
      .from('work_orders')
      .select('id')
      .eq('appointment_id', appointment.id)
      .maybeSingle()

    if (existingError) {
      console.error('Work order existing check error:', existingError)
      return NextResponse.json({ error: 'Failed to check existing work order' }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({ error: 'A work order already exists for this appointment' }, { status: 409 })
    }

    const now = new Date().toISOString()

    const { data: workOrder, error: insertError } = await adminClient
      .from('work_orders')
      .insert({
        quote_id: appointment.quote_id,
        appointment_id: appointment.id,
        workshop_id: appointment.workshop_id!,
        status: 'checked_in',
        started_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Create work order error:', insertError)
      return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 })
    }

    // Record audit event
    await adminClient.from('work_order_events').insert({
      work_order_id: workOrder.id,
      workshop_id: workOrder.workshop_id!,
      event_type: 'status_change',
      new_status: 'checked_in',
      notes: 'Work order created from confirmed appointment',
      created_by: adminId,
    })

    return NextResponse.json({
      success: true,
      workOrder,
      message: 'Work order created. Vehicle checked in.',
    })
  } catch (err: unknown) {
    console.error('Create work order API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create work order', message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const serverClient = await createSupabaseServerClient()
    const { data: { session } } = await serverClient.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = getRoleFromJWT(session)
    const isAdmin = role === 'admin' || role === 'super_admin'
    const workshopId = (() => {
      try {
        const payload = JSON.parse(atob(session.access_token.split('.')[1]))
        return payload?.app_metadata?.workshop_id as string | null
      } catch { return null }
    })()

    const { searchParams } = new URL(request.url)
    const quoteId = searchParams.get('quote_id')
    const appointmentId = searchParams.get('appointment_id')

    const adminClient = await createSupabaseServerClient()
    let query = adminClient.from('work_orders').select('*, work_order_events(*)')

    if (!isAdmin) {
      query = query.eq('quote_id', quoteId ?? '')
      const { data: quote, error: quoteError } = await adminClient
        .from('quotes')
        .select('user_id')
        .eq('id', quoteId ?? '')
        .single()

      if (quoteError || !quote || quote.user_id !== session.user?.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (workshopId) {
      query = query.eq('workshop_id', workshopId)
    }

    if (quoteId) {
      query = query.eq('quote_id', quoteId)
    }

    if (appointmentId) {
      query = query.eq('appointment_id', appointmentId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('List work orders error:', error)
      return NextResponse.json({ error: 'Failed to fetch work orders' }, { status: 500 })
    }

    return NextResponse.json({ workOrders: data })
  } catch (err: unknown) {
    console.error('List work orders API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to fetch work orders', message }, { status: 500 })
  }
}
