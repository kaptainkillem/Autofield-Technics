import { NextRequest, NextResponse } from 'next/server'
import { verifyStaffUser } from '@/lib/admin-auth'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getDefaultTemplate, renderTemplate } from '@/lib/email-templates'
import { z } from 'zod'

const PreviewSchema = z.object({
  template_key: z.string().min(1),
  subject: z.string().min(1),
  html_body: z.string().min(1),
  text_body: z.string().optional(),
  variables: z.record(z.string(), z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyStaffUser()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { allowed, remaining } = checkRateLimit(`admin:email-preview:${ip}`, { maxRequests: 30, windowMs: 60_000 })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    const body = PreviewSchema.parse(await request.json())

    const vars = body.variables || {}

    const renderedSubject = renderTemplate(body.subject, vars)
    const renderedHtml = renderTemplate(body.html_body, vars)
    const renderedText = body.text_body ? renderTemplate(body.text_body, vars) : ''

    return NextResponse.json({
      subject: renderedSubject,
      html: renderedHtml,
      text: renderedText,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 })
    }
    console.error('Email preview error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
