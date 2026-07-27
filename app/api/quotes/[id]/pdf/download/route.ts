import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { createSuperAdminClient } from '@/lib/super-admin'
import { checkRateLimit } from '@/lib/rate-limiter'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const { allowed, remaining } = checkRateLimit(`pdf:download:${ip}`, {
    maxRequests: 10,
    windowMs: 60_000,
  })
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  }

  const urlToken = request.nextUrl.searchParams.get('token')

  const adminClient = createSuperAdminClient()

  const { data: quote } = await adminClient
    .from('quotes')
    .select('id, pdf_url, quote_token, user_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!quote || !quote.pdf_url) {
    return NextResponse.json({ error: 'PDF not found' }, { status: 404 })
  }

  let authorized = false

  const authSupabase = await createSupabaseServerClient()
  const { data: { user } } = await authSupabase.auth.getUser()

  if (user) {
    if (user.id === quote.user_id) {
      authorized = true
    } else {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role === 'admin' || profile?.role === 'super_admin') {
        authorized = true
      }
    }
  }

  if (!authorized && urlToken && urlToken === quote.quote_token) {
    authorized = true
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await adminClient.storage
    .from('documents')
    .download(quote.pdf_url)

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to download PDF' }, { status: 500 })
  }

  const buffer = Buffer.from(await data.arrayBuffer())

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="quote-${id}.pdf"`,
      'Content-Length': String(buffer.length),
    },
  })
}
