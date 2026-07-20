import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { sendTemplateEmail } from '@/lib/email'
import { z } from 'zod'

const CreateAppointmentSchema = z.object({
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  scheduled_time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm'),
  service_type: z.string().trim().min(1),
  customer_name: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  duration_minutes: z.number().min(30).max(480).default(60),
  user_id: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyStaffUser()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, remaining } = checkRateLimit(`admin:appointments-create:${ip}`, { maxRequests: 20, windowMs: 60_000 })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    let body: z.infer<typeof CreateAppointmentSchema>
    try {
      body = CreateAppointmentSchema.parse(await request.json())
    } catch {
      return NextResponse.json({ error: 'Invalid appointment data' }, { status: 400 })
    }

    const adminClient = await createSupabaseServerClient()

    // If a specific user_id is provided, verify it exists; otherwise assign to admin
    let targetUserId = body.user_id ?? auth.userId
    if (body.user_id) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('id, workshop_id')
        .eq('id', body.user_id)
        .single()
      if (!profile) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }
      if (profile.workshop_id !== auth.workshopId) {
        return NextResponse.json({ error: 'Customer does not belong to your workshop' }, { status: 403 })
      }
      targetUserId = body.user_id
    }

    const { data, error } = await adminClient
      .from('appointments')
      .insert({
        user_id: targetUserId,
        workshop_id: auth.workshopId!,
        scheduled_date: body.scheduled_date,
        scheduled_time: body.scheduled_time,
        service_type: body.service_type,
        customer_name: body.customer_name || null,
        notes: body.notes || null,
        duration_minutes: body.duration_minutes,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Create appointment error:', error)
      return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
    }

    // Send confirmation email to customer
    if (targetUserId) {
      try {
        const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(targetUserId)
        if (authUser?.email) {
          const vehicleInfo = data?.service_type || ''
          sendTemplateEmail({
            templateKey: 'appointment_confirmation',
            to: authUser.email,
            variables: {
              customerName: body.customer_name || authUser.user_metadata?.full_name || 'Customer',
              appointmentDate: body.scheduled_date,
              appointmentTime: body.scheduled_time,
              serviceType: body.service_type,
              vehicleInfo,
              businessName: '',
              businessAddress: '',
              businessPhone: '',
            },
            workshopId: auth.workshopId!,
          }).catch(() => {})
        }
      } catch {}
    }

    return NextResponse.json({ success: true, appointment: data })
  } catch (err: unknown) {
    console.error('Create appointment API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create appointment', message }, { status: 500 })
  }
}
