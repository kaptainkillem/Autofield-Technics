import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSuperAdminClient } from '@/lib/super-admin'
import { createSupabaseServerClient, getRoleFromJWT } from '@/lib/supabaseServer'

const CreateWorkshopSchema = z.object({
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(8),
  ownerName: z.string().min(1),
  workshopName: z.string().min(1),
  workshopSlug: z.string().min(1),
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

    const body = CreateWorkshopSchema.parse(await request.json())
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
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    const { data: workshop, error: workshopError } = await adminClient
      .from('workshops')
      .insert({
        name: body.workshopName,
        slug: body.workshopSlug,
        owner_id: newUser.user.id,
        contact_email: body.contactEmail ?? body.ownerEmail,
        contact_phone: body.contactPhone ?? null,
      })
      .select()
      .single()

    if (workshopError) {
      return NextResponse.json({ error: workshopError.message }, { status: 400 })
    }

    await adminClient
      .from('profiles')
      .update({ workshop_id: workshop.id, role: 'admin' })
      .eq('id', newUser.user.id)

    return NextResponse.json({ workshop, ownerId: newUser.user.id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map(i => i.message).join(', ') }, { status: 400 })
    }
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
      .select('id, name, slug, owner_id, contact_email, contact_phone, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const workshopsWithOwners = workshops && workshops.length > 0
      ? await (async () => {
          const ownerIds = workshops.map(w => w.owner_id)
          const { data: owners } = await adminClient
            .from('profiles')
            .select('id, full_name')
            .in('id', ownerIds)

          const ownerMap = new Map((owners ?? []).map(o => [o.id, o]))
          return workshops.map(w => ({
            ...w,
            owner: ownerMap.get(w.owner_id) ?? null,
          }))
        })()
      : []

    return NextResponse.json({ workshops: workshopsWithOwners })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
