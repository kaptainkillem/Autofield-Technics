import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()

  // 1. Verify the requesting user via session cookie
  const sessionClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // no-op
        },
      },
    }
  )

  const { data: { user } } = await sessionClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = user.id

  // 2. Server-side guard: check for pending quotes or active appointments
  const { data: pendingQuotes } = await sessionClient
    .from('quotes')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .limit(1)

  if (pendingQuotes && pendingQuotes.length > 0) {
    return NextResponse.json(
      { error: 'You have pending quotes. Please cancel or complete them before deleting your account.' },
      { status: 409 }
    )
  }

  const { data: activeAppointments } = await sessionClient
    .from('appointments')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['pending', 'confirmed'])
    .limit(1)

  if (activeAppointments && activeAppointments.length > 0) {
    return NextResponse.json(
      { error: 'You have upcoming appointments. Please cancel them before deleting your account.' },
      { status: 409 }
    )
  }

  // 3. Delete profile row (vehicles cascade via FK)
  const { error: profileDeleteError } = await sessionClient
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (profileDeleteError) {
    console.error('Profile delete error:', profileDeleteError)
    return NextResponse.json(
      { error: 'Failed to delete account data. Please contact support.' },
      { status: 500 }
    )
  }

  // 4. Hard delete from auth.users via service role admin client
  const adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId)

  if (authDeleteError) {
    console.error('Auth delete error:', authDeleteError)
    // Profile is already gone — return error but note data is partially cleaned
    return NextResponse.json(
      { error: 'Account data removed, but auth cleanup failed. Please contact support.' },
      { status: 500 }
    )
  }

  // 5. Clear session cookies by signing out
  await sessionClient.auth.signOut()

  return NextResponse.json({ success: true })
}
