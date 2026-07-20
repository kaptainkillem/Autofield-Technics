import { NextResponse } from 'next/server'
import { createSuperAdminClient } from '@/lib/super-admin'
import { createSupabaseServerClient, getRoleFromJWT } from '@/lib/supabaseServer'

export async function GET() {
  try {
    const sessionClient = await createSupabaseServerClient()
    const { data: { session } } = await sessionClient.auth.getSession()

    if (!session || getRoleFromJWT(session) !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createSuperAdminClient()

    const { data: workshops, error: workshopsError } = await adminClient
      .from('workshops')
      .select('id, name, slug, owner_id, contact_email, contact_phone, created_at')
      .order('created_at', { ascending: false })

    if (workshopsError || !workshops) {
      return NextResponse.json({ error: 'Failed to load workshops' }, { status: 500 })
    }

    const ownerIds = [...new Set(workshops.map((w) => w.owner_id))]
    const { data: owners } = await adminClient
      .from('profiles')
      .select('id, full_name')
      .in('id', ownerIds)
    const ownerMap = new Map((owners ?? []).map((o) => [o.id, o]))

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

    const [
      { data: customerProfiles },
      { data: allQuotes },
      { data: pendingQuotes },
      { data: quotesThisMonth },
      { data: allReceipts },
      { data: receiptsThisMonth },
      { data: allAppointments },
      { data: appointmentsToday },
      { data: allInvoices },
    ] = await Promise.all([
      adminClient.from('profiles').select('id, workshop_id').eq('role', 'client'),
      adminClient.from('quotes').select('id, workshop_id, status').is('deleted_at', null),
      adminClient.from('quotes').select('id').eq('status', 'pending').is('deleted_at', null),
      adminClient.from('quotes').select('id').gte('created_at', startOfMonth).is('deleted_at', null),
      adminClient.from('receipts').select('workshop_id, amount_paid').is('deleted_at', null),
      adminClient.from('receipts').select('workshop_id, amount_paid').gte('created_at', startOfMonth).is('deleted_at', null),
      adminClient.from('appointments').select('id, workshop_id, scheduled_date').is('deleted_at', null),
      adminClient.from('appointments').select('id').gte('scheduled_date', todayStart).is('deleted_at', null),
      adminClient.from('invoices').select('id').is('deleted_at', null),
    ])

    const revenueTotal = (allReceipts ?? []).reduce((sum, r) => sum + (r.amount_paid ?? 0), 0)
    const revenueThisMonth = (receiptsThisMonth ?? []).reduce((sum, r) => sum + (r.amount_paid ?? 0), 0)

    const perWorkshop = workshops.map((w) => {
      const customers = (customerProfiles ?? []).filter((p) => p.workshop_id === w.id).length
      const quotes = (allQuotes ?? []).filter((q) => q.workshop_id === w.id).length
      const revenue = (allReceipts ?? []).filter((r) => r.workshop_id === w.id).reduce((s, r) => s + (r.amount_paid ?? 0), 0)
      const appointments = (allAppointments ?? []).filter((a) => a.workshop_id === w.id).length
      return {
        id: w.id,
        name: w.name,
        slug: w.slug,
        ownerName: ownerMap.get(w.owner_id)?.full_name ?? 'N/A',
        contactEmail: w.contact_email,
        contactPhone: w.contact_phone,
        customerCount: customers,
        quoteCount: quotes,
        revenue,
        appointmentCount: appointments,
        createdAt: w.created_at,
      }
    })

    return NextResponse.json({
      totals: {
        workshops: workshops.length,
        customers: (customerProfiles ?? []).length,
        quotesTotal: (allQuotes ?? []).length,
        quotesPending: (pendingQuotes ?? []).length,
        quotesThisMonth: (quotesThisMonth ?? []).length,
        revenueTotal,
        revenueThisMonth,
        appointmentsTotal: (allAppointments ?? []).length,
        appointmentsToday: (appointmentsToday ?? []).length,
        invoicesTotal: (allInvoices ?? []).length,
      },
      perWorkshop,
    })
  } catch (error) {
    console.error('Super-admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
