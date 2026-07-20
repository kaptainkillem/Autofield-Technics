import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getDefaultTemplate, DEFAULT_TEMPLATES } from '@/lib/email-templates'
import { z } from 'zod'

const UpsertSchema = z.object({
  template_key: z.string().min(1),
  subject: z.string().min(1),
  html_body: z.string().min(1),
  text_body: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyStaffUser()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const adminClient = await createSupabaseServerClient()

    const { data: overrides, error } = await adminClient
      .from('email_templates')
      .select('template_key, subject, html_body, text_body, updated_at')
      .eq('workshop_id', auth.workshopId!)
      .order('template_key')

    if (error) {
      return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 })
    }

    const overrideMap = new Map((overrides ?? []).map((o) => [o.template_key, o]))

    const allKeys = Object.keys(DEFAULT_TEMPLATES)

    const templates = allKeys.map((key) => {
      const def = getDefaultTemplate(key, DEFAULT_TEMPLATES)
      const ovr = overrideMap.get(key)
      return {
        template_key: key,
        subject: ovr?.subject || def?.subject || '',
        html_body: ovr?.html_body || def?.html || '',
        text_body: ovr?.text_body || def?.text || '',
        has_override: !!ovr,
        updated_at: ovr?.updated_at ?? null,
      }
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Email templates list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyStaffUser()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, remaining } = checkRateLimit(`admin:email-templates:${ip}`, { maxRequests: 20, windowMs: 60_000 })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    const body = UpsertSchema.parse(await request.json())

    const adminClient = await createSupabaseServerClient()

    const { error } = await (adminClient as any)
      .from('email_templates')
      .upsert({
        workshop_id: auth.workshopId!,
        template_key: body.template_key,
        subject: body.subject,
        html_body: body.html_body,
        text_body: body.text_body || null,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 })
    }
    console.error('Email template save error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyStaffUser()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const templateKey = request.nextUrl.searchParams.get('key')
    if (!templateKey) {
      return NextResponse.json({ error: 'Missing template key' }, { status: 400 })
    }

    const adminClient = await createSupabaseServerClient()

    const { error } = await (adminClient as any)
      .from('email_templates')
      .delete()
      .eq('workshop_id', auth.workshopId!)
      .eq('template_key', templateKey)

    if (error) {
      return NextResponse.json({ error: 'Failed to reset template' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Template reset error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
