import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { UserQuotes } from '@/components/features/user/UserQuotes'
import { UserAppointments } from '@/components/features/user/UserAppointments'
import { UserInvoices } from '@/components/features/user/UserInvoices'
import Link from 'next/link'

export default async function UserDashboardPage() {
  const supabase = await createSupabaseServerClient()

  // 1. Get the authenticated session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/signin')


const { data: profile } = await supabase
  .from('profiles')
  .select('full_name, created_at')
  .eq('id', user.id)
  .single() as { data: { full_name: string; created_at: string } | null }

const { data: vehicle } = await supabase
  .from('vehicles')
  .select('make, model, year')
  .eq('profile_id', user.id)
  .order('created_at', { ascending: true })
  .limit(1)
  .single() as { data: { make: string; model: string; year: string | number } | null }
  
  const fullName = profile?.full_name ?? user.email ?? 'there'
  const firstName = fullName.split(' ')[0]

  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-ZA', {
        month: 'long',
        year: 'numeric',
      })
    : null

  const vehicleLabel = vehicle
    ? `${vehicle.make} ${vehicle.model} ${vehicle.year}`
    : null

  return (
    <div className="min-h-screen bg-grey-lightest">

      {/* Top bar */}
      <header className="bg-white border-b border-grey-medium/30 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 md:px-10 h-14 flex items-center justify-between">
          <Link href="/" className="text-primary font-bold text-lg">
            Autofield Technics
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/quote" className="btn-primary text-sm px-4 py-2 hidden sm:inline-flex">
              + New Quote
            </Link>
            <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
              {initials}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-10 py-8 flex flex-col gap-8">

        {/* Welcome banner */}
        <div className="bg-white rounded-base shadow-base px-6 py-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary text-white text-xl font-bold flex items-center justify-center flex-shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-bold text-black">
                Welcome back, {firstName}
              </h1>
              <p className="text-sm text-grey">
                {[vehicleLabel, memberSince ? `Member since ${memberSince}` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>
          <Link href="/quote" className="btn-primary text-sm px-4 py-2 sm:hidden">
            + New Quote
          </Link>
        </div>

        {/* Quote history */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-black">My Quotes</h2>
            <Link href="/quote" className="text-sm text-primary font-semibold hover:underline">
              + Request new
            </Link>
          </div>
          <UserQuotes userId={user.id} />
        </section>

        {/* Appointments + Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <h2 className="text-lg font-bold text-black mb-4">Upcoming Appointments</h2>
            <UserAppointments userId={user.id} />
          </section>
          <section>
            <h2 className="text-lg font-bold text-black mb-4">Past Invoices</h2>
            <UserInvoices userId={user.id} />
          </section>
        </div>

      </main>
    </div>
  )
}