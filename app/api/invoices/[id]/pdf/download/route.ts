import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { createSuperAdminClient } from '@/lib/super-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const adminClient = createSuperAdminClient()

  const { data: invoice } = await adminClient
    .from('invoices')
    .select('id, pdf_url, user_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!invoice || !invoice.pdf_url) {
    return NextResponse.json({ error: 'PDF not found' }, { status: 404 })
  }

  let authorized = false

  const authSupabase = await createSupabaseServerClient()
  const { data: { user } } = await authSupabase.auth.getUser()

  if (user) {
    if (user.id === invoice.user_id) {
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

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await adminClient.storage
    .from('documents')
    .download(invoice.pdf_url)

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to download PDF' }, { status: 500 })
  }

  const buffer = Buffer.from(await data.arrayBuffer())

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${id}.pdf"`,
      'Content-Length': String(buffer.length),
    },
  })
}
