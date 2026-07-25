'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SiteLogo } from '@/components/common/SiteLogo'
import { NotificationBell } from '@/components/admin/NotificationBell'
import { supabase } from '@/lib/supabase'

function getUserInitial(user: { user_metadata?: Record<string, unknown>; email?: string } | null): string {
  if (!user) return ''
  const name = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? '') as string
  if (name) return name.charAt(0).toUpperCase()
  return user.email?.charAt(0).toUpperCase() ?? ''
}

export function DashboardTopBar() {
  const pathname = usePathname()
  const [user, setUser] = useState<ReturnType<typeof supabase.auth.getUser> extends Promise<{ data: { user: infer U } }> ? U : never | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const isAdmin = pathname.startsWith('/dashboard/admin')
  const isSuperAdmin = pathname.startsWith('/dashboard/super-admin')
  const isClient = pathname.startsWith('/dashboard') && !isAdmin && !isSuperAdmin
  const initial = getUserInitial(user)

  return (
    <header className="hidden lg:flex bg-white border-b border-grey-medium/30 sticky top-0 z-30">
      <div className="w-64 flex-shrink-0 border-r border-grey-medium/20 px-5 h-14 flex items-center">
        {isSuperAdmin ? (
          <Link href="/dashboard/super-admin" className="no-underline flex items-center gap-2">
            <img
              src="/motiongrid-assets/logos/logo-horizontal.svg"
              alt="Motion Grid"
              className="h-7 w-auto"
            />
          </Link>
        ) : (
          <>
            <Link href="/" className="no-underline">
              <SiteLogo />
            </Link>
            {isAdmin && (
              <span className="ml-2 text-xs font-semibold bg-primary text-white px-2 py-0.5 rounded-full">
                Admin
              </span>
            )}
            {isClient && (
              <span className="ml-2 text-xs font-semibold bg-primary text-white px-2 py-0.5 rounded-full">
                Client
              </span>
            )}
          </>
        )}
      </div>
      <div className="flex-1 h-14 flex items-center justify-end px-6">
        <div className="flex items-center gap-4">
          <NotificationBell />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
              {user && initial ? initial : '?'}
            </div>
            <span className="text-sm text-grey hidden md:block">
              {user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}