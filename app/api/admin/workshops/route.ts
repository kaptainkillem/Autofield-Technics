import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSuperAdminClient } from '@/lib/super-admin'
import { createSupabaseServerClient, getRoleFromJWT } from '@/lib/supabaseServer'
import { createDefaultHomePageContent } from '@/lib/homepage-content'

const CreateWorkshopSchema = z.object({
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(8),
  ownerName: z.string().min(1),
  workshopName: z.string().min(1),
  workshopSlug: z.string().min(1),
  domain: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const sessionClient = await createSupabaseServerClient()
    const { data: { session } } = await sessionClient.auth.getSession()

    if (!session || getRoleFromJWT(session) !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const raw = await request.json()

    const normalized = {
      ...raw,
      ownerEmail: typeof raw.ownerEmail === 'string' ? raw.ownerEmail.trim().toLowerCase() : raw.ownerEmail,
      ownerName: typeof raw.ownerName === 'string' ? raw.ownerName.trim() : raw.ownerName,
      workshopName: typeof raw.workshopName === 'string' ? raw.workshopName.trim() : raw.workshopName,
      workshopSlug: typeof raw.workshopSlug === 'string' ? raw.workshopSlug.trim() : raw.workshopSlug,
      domain: typeof raw.domain === 'string' ? raw.domain.trim() : raw.domain,
      contactEmail: typeof raw.contactEmail === 'string' ? raw.contactEmail.trim() || undefined : raw.contactEmail,
      contactPhone: typeof raw.contactPhone === 'string' ? raw.contactPhone.trim() || undefined : raw.contactPhone,
    }

    if (typeof normalized.domain === 'string' && normalized.domain.length === 0) {
      normalized.domain = undefined
    }

    const body = CreateWorkshopSchema.parse(normalized)
    const adminClient = createSuperAdminClient()

    const { data: newUser, error: userError } = await adminClient.auth.admin.createUser({
      email: body.ownerEmail,
      password: body.ownerPassword,
      email_confirm: true,
      user_metadata: {
        full_name: body.ownerName,
        role: 'admin',
      },
    })

    if (userError) {
      console.error('createUser failed:', userError)
      if (userError.message?.toLowerCase().includes('already')) {
        return NextResponse.json({ error: 'A user with this email address has already been registered.' }, { status: 400 })
      }
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    const { data: workshop, error: workshopError } = await adminClient
      .from('workshops')
      .insert({
        name: body.workshopName,
        slug: body.workshopSlug,
        domain: body.domain ?? null,
        owner_id: newUser.user.id,
        contact_email: body.contactEmail ?? body.ownerEmail,
        contact_phone: body.contactPhone ?? null,
      })
      .select()
      .single()

    if (workshopError) {
      console.error('workshop insert failed:', workshopError)
      return NextResponse.json({ error: workshopError.message }, { status: 400 })
    }

    await adminClient
      .from('profiles')
      .update({ workshop_id: workshop.id, role: 'admin' })
      .eq('id', newUser.user.id)

    // Seed default business_settings so the new workshop site is live immediately.
    const { error: settingsError } = await adminClient
      .from('business_settings')
      .insert({
        workshop_id: workshop.id,
        site_name: body.workshopName,
        phone: body.contactPhone ?? null,
        contact_email: body.contactEmail ?? body.ownerEmail,
        home_page_content: createDefaultHomePageContent(),
      })

    if (settingsError) {
      console.error('Failed to seed business_settings:', settingsError)
    }

    // Seed default working hours.
    const { error: hoursError } = await adminClient
      .from('working_hours')
      .insert([
        { workshop_id: workshop.id, day_of_week: 1, start_time: '08:00', end_time: '17:00', is_active: true },
        { workshop_id: workshop.id, day_of_week: 2, start_time: '08:00', end_time: '17:00', is_active: true },
        { workshop_id: workshop.id, day_of_week: 3, start_time: '08:00', end_time: '17:00', is_active: true },
        { workshop_id: workshop.id, day_of_week: 4, start_time: '08:00', end_time: '17:00', is_active: true },
        { workshop_id: workshop.id, day_of_week: 5, start_time: '08:00', end_time: '17:00', is_active: true },
        { workshop_id: workshop.id, day_of_week: 6, start_time: '08:00', end_time: '12:00', is_active: true },
        { workshop_id: workshop.id, day_of_week: 7, start_time: '00:00', end_time: '00:00', is_active: false },
      ])

    if (hoursError) {
      console.error('Failed to seed working hours:', hoursError)
    }

    // Seed default email templates.
    const { error: templatesError } = await adminClient
      .from('email_templates')
      .insert([
        { workshop_id: workshop.id, template_key: 'quote_ready', subject: 'Your quote from {{businessName}} is ready',
          html_body: '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333;"><div style="background:#3B82F6;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0;"><h2 style="margin:0;">{{businessName}}</h2></div><div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;"><p>Hi {{customerName}},</p><p>Your quote <strong>{{quoteNumber}}</strong> for <strong>{{serviceType}}</strong> is ready.</p><p><strong>Vehicle:</strong> {{vehicleInfo}}</p><p><strong>Total:</strong> <span style="font-size:18px;color:#3B82F6;font-weight:bold;">{{total}}</span></p><div style="text-align:center;margin:24px 0;"><a href="{{quoteUrl}}" style="background:#10B981;color:#fff;padding:14px 40px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;">View & Approve Quote</a></div><p style="font-size:12px;color:#999;">Quote valid until {{expiryDate}}. Reply to this email or call {{businessPhone}}.</p></div></div>', is_default: true },
        { workshop_id: workshop.id, template_key: 'appointment_confirmation', subject: 'Your appointment is confirmed — {{appointmentDate}}',
          html_body: '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333;"><div style="background:#10B981;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0;"><h2 style="margin:0;">Appointment Confirmed</h2></div><div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;"><p>Hi {{customerName}},</p><p>Your appointment is confirmed:</p><p><strong>Date:</strong> {{appointmentDate}}<br/><strong>Time:</strong> {{appointmentTime}}<br/><strong>Service:</strong> {{serviceType}}<br/><strong>Vehicle:</strong> {{vehicleInfo}}</p><p style="font-size:12px;color:#999;">Need to reschedule? Call {{businessPhone}}.</p></div></div>', is_default: true },
        { workshop_id: workshop.id, template_key: 'work_order_status_update', subject: 'Update on your {{vehicleInfo}} — {{statusLabel}}',
          html_body: '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333;"><h2 style="color:#3B82F6;">Status Update</h2><p>Hi {{customerName}},</p><p>Status update for your <strong>{{vehicleInfo}}</strong>:</p><div style="background:#f3f4f6;padding:12px 16px;border-radius:8px;margin:12px 0;"><strong>{{statusLabel}}</strong></div><p>{{statusDescription}}</p><p style="font-size:12px;color:#999;">Call {{businessPhone}} for questions.</p></div>', is_default: true },
        { workshop_id: workshop.id, template_key: 'work_order_revision', subject: 'Revision requested — {{vehicleInfo}}',
          html_body: '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333;"><h2 style="color:#F59E0B;">Revision Requested</h2><p>Hi {{customerName}},</p><p>A revision has been requested for your <strong>{{vehicleInfo}}</strong> work order.</p><p><strong>Additional work:</strong> {{revisionDescription}}</p><p><strong>Revised total:</strong> {{revisedTotal}}</p><p><a href="{{actionUrl}}" style="background:#3B82F6;color:#fff;padding:12px 32px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;">Review Revision</a></p></div>', is_default: true },
        { workshop_id: workshop.id, template_key: 'invoice_sent', subject: 'Your invoice from {{businessName}}',
          html_body: '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333;"><div style="background:#3B82F6;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0;"><h2 style="margin:0;">Invoice {{invoiceNumber}}</h2></div><div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;"><p>Hi {{customerName}},</p><p>Your invoice {{invoiceNumber}} is ready.</p><p><strong>Total:</strong> <span style="font-size:18px;color:#3B82F6;font-weight:bold;">{{total}}</span></p><p><a href="{{invoiceUrl}}" style="background:#10B981;color:#fff;padding:12px 32px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;">View Invoice</a></p><p style="font-size:12px;color:#999;">Questions? Call {{businessPhone}}.</p></div></div>', is_default: true },
        { workshop_id: workshop.id, template_key: 'post_service_thank_you', subject: 'Thanks for choosing {{businessName}}',
          html_body: '<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333;"><h2>Thank You, {{customerName}}!</h2><p>Thank you for trusting <strong>{{businessName}}</strong> with your {{vehicleInfo}}.</p><p>We hope you are happy with the service. If you have a moment, please leave us a review.</p><div style="text-align:center;margin:24px 0;"><a href="{{reviewUrl}}" style="background:#3B82F6;color:#fff;padding:14px 40px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;">Leave a Review</a></div></div>', is_default: true },
      ])

    if (templatesError) {
      console.error('Failed to seed email templates:', templatesError)
    }
    return NextResponse.json({ workshop, ownerId: newUser.user.id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues.map((i) => {
        const field = i.path.join('.')
        return field ? `${field}: ${i.message}` : i.message
      })
      console.error('Zod validation failed:', fieldErrors)
      return NextResponse.json({ error: fieldErrors.join('. ') }, { status: 400 })
    }
    console.error('Workshop creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const sessionClient = await createSupabaseServerClient()
    const { data: { session } } = await sessionClient.auth.getSession()

    if (!session || getRoleFromJWT(session) !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createSuperAdminClient()

    const { data: workshops, error } = await adminClient
      .from('workshops')
      .select('id, name, slug, domain, owner_id, contact_email, contact_phone, status, billing_status, suspended_at, suspension_reason, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const workshopsWithOwners = workshops && workshops.length > 0
      ? await (async () => {
          const ownerIds = workshops.map(w => w.owner_id)
          const [ownersRes, settingsRes, servicesRes] = await Promise.all([
            adminClient.from('profiles').select('id, full_name').in('id', ownerIds),
            adminClient.from('business_settings').select('workshop_id, site_name, phone, whatsapp_number, city, logo_url, hero_image_url, primary_color, accent_color, font_family, home_page_content, business_hours, terms_conditions, document_footer').in('workshop_id', workshops.map(w => w.id)),
            adminClient.from('services').select('workshop_id, id').in('workshop_id', workshops.map(w => w.id)).eq('is_active', true),
          ])

          const ownerMap = new Map((ownersRes.data ?? []).map(o => [o.id, o]))
          const settingsMap = new Map((settingsRes.data ?? []).map(s => [s.workshop_id, s]))
          const servicesByWorkshop = new Map<string, number>()
          ;(servicesRes.data ?? []).forEach(s => {
            servicesByWorkshop.set(s.workshop_id, (servicesByWorkshop.get(s.workshop_id) || 0) + 1)
          })

          return workshops.map(w => ({
            ...w,
            owner: ownerMap.get(w.owner_id) ?? null,
            settings: settingsMap.get(w.id) ?? null,
            servicesCount: servicesByWorkshop.get(w.id) ?? 0,
          }))
        })()
      : []

    return NextResponse.json({ workshops: workshopsWithOwners })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const UpdateWorkshopSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  billing_status: z.enum(['paid', 'past_due', 'cancelled']).optional(),
  suspension_reason: z.string().max(500).optional(),
  domain: z.string().optional(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
})

export async function PATCH(request: Request) {
  try {
    const sessionClient = await createSupabaseServerClient()
    const { data: { session } } = await sessionClient.auth.getSession()

    if (!session || getRoleFromJWT(session) !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const workshopId = url.searchParams.get('id')
    if (!workshopId) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    const body = UpdateWorkshopSchema.parse(await request.json())
    const adminClient = createSuperAdminClient()

    const updateData: Record<string, unknown> = {}
    if (body.status !== undefined) {
      updateData.status = body.status
      if (body.status === 'suspended') {
        updateData.suspended_at = new Date().toISOString()
      } else {
        updateData.suspended_at = null
      }
    }
    if (body.billing_status !== undefined) updateData.billing_status = body.billing_status
    if (body.suspension_reason !== undefined) updateData.suspension_reason = body.suspension_reason
    if (body.domain !== undefined) updateData.domain = body.domain
    if (body.name !== undefined) updateData.name = body.name
    if (body.slug !== undefined) updateData.slug = body.slug
    updateData.updated_at = new Date().toISOString()

    const { data: workshop, error } = await (adminClient as any)
      .from('workshops')
      .update(updateData)
      .eq('id', workshopId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ workshop })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map(i => i.message).join(', ') }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const sessionClient = await createSupabaseServerClient()
    const { data: { session } } = await sessionClient.auth.getSession()

    if (!session || getRoleFromJWT(session) !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const workshopId = url.searchParams.get('id')
    if (!workshopId) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    const adminClient = createSuperAdminClient()

    const { error } = await (adminClient as any)
      .from('workshops')
      .update({
        status: 'inactive',
        suspended_at: new Date().toISOString(),
        suspension_reason: 'Soft-deleted by super-admin',
        updated_at: new Date().toISOString(),
      })
      .eq('id', workshopId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Workshop deactivated' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
