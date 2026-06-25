'use client'

import React, { ComponentPropsWithoutRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogIn, LogOut, Loader2, User } from 'lucide-react'
import { SiteLogo } from './SiteLogo'
import { SITE_CONFIG, replaceVars } from '@/lib/site-config'
import { supabase } from '@/lib/supabase'

interface HeaderProps extends ComponentPropsWithoutRef<'header'> {}

const NAV_LINKS = SITE_CONFIG.navigation.header.map((link) => ({
  ...link,
  href: replaceVars(link.href, { phone: SITE_CONFIG.phone }),
}))

export const Header: React.FC<HeaderProps> = ({
  className,
  ...props
}) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch {
      // Server-side cookie clearing is best-effort
    }
    try {
      await supabase.auth.signOut()
    } catch {
      // Client signOut failure is also best-effort
    }
    setUser(null)
    setMobileOpen(false)
    router.push('/')
    router.refresh()
  }

  const dashboardHref = user?.user_metadata?.role === 'admin' ? '/dashboard/admin' : '/dashboard'
  const initial = (() => {
    if (!user) return ''
    const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''
    if (name) return name.charAt(0).toUpperCase()
    return user.email?.charAt(0).toUpperCase() ?? ''
  })()

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 right-0 z-50 h-full w-64 bg-primary text-white shadow-lg transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <span className="text-base font-semibold">Menu</span>
          <button
            type="button"
            className="text-white"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 px-6 py-6 border-b border-white/10">
          {user ? (
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold">
              {initial || '?'}
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <User className="text-white" size={24} />
            </div>
          )}
          <span className="text-sm text-white/70">{user ? (user.user_metadata?.full_name ?? user.email) : 'Guest'}</span>
        </div>

        <nav className="flex flex-col gap-1 px-4 py-4">
          {NAV_LINKS.map((link) => (
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                className="text-white no-underline text-base font-bold tracking-wide hover:bg-white/10 rounded-base px-3 py-3 transition-colors duration-200"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-white no-underline text-base font-bold tracking-wide hover:bg-white/10 rounded-base px-3 py-3 transition-colors duration-200"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            )
          ))}
          {user && (
            <Link
              href="/dashboard"
              className="text-primary no-underline text-base font-bold tracking-wide bg-white rounded-base px-3 py-3 mt-2 transition-colors duration-200 text-center"
              onClick={() => setMobileOpen(false)}
            >
              Dashboard
            </Link>
          )}
        </nav>

        <div className="px-4 pt-2 pb-4">
          {user ? (
            <button
              onClick={() => { handleLogout(); setMobileOpen(false); }}
              disabled={loggingOut}
              className="flex w-full items-center justify-center gap-2 bg-white/10 text-white font-semibold rounded-base px-4 py-3 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          ) : (
            <Link
              href="/signin"
              className="flex items-center justify-center gap-2 bg-white text-primary font-semibold rounded-base px-4 py-3 hover:bg-white/90 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          )}
        </div>
      </aside>

      <header
        className={`absolute top-0 left-0 right-0 lg:left-60 lg:right-60 z-50 bg-primary/90 backdrop-blur-sm text-white rounded-b-xl shadow-md ${className ?? ''}`}
        {...props}
      >
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center">
            <Link href="/" className="no-underline tracking-widest uppercase text-lg font-bold text-white whitespace-nowrap">
              <SiteLogo />
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-white no-underline text-base font-bold tracking-wide hover:text-white/80 transition-colors duration-200"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-white no-underline text-base font-bold tracking-wide hover:text-white/80 transition-colors duration-200"
                >
                  {link.label}
                </Link>
              )
            ))}
          </nav>

          <div className="flex items-center shrink-0 gap-3">
            {user ? (
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="hidden md:inline-flex items-center gap-2 border-2 border-white text-white font-semibold rounded-base px-4 py-2 hover:bg-white hover:text-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                {loggingOut ? 'Logging out...' : 'Logout'}
              </button>
            ) : (
              <Link
                href="/signin"
                className="hidden md:inline-flex items-center gap-2 border-2 border-white text-white font-semibold rounded-base px-4 py-2 hover:bg-white hover:text-primary transition-all duration-200"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            )}

            <Link
              href={user ? dashboardHref : '/signin'}
              className="hidden md:flex w-10 h-10 min-w-10 min-h-10 rounded-full bg-white/20 items-center justify-center overflow-hidden hover:bg-white/30 transition-colors"
              aria-label={user ? 'Dashboard' : 'Login'}
            >
              {user && initial ? (
                <span className="text-white text-sm font-bold">{initial}</span>
              ) : (
                <User className="text-white" size={20} />
              )}
            </Link>

            <button
              type="button"
              className="md:hidden text-white shrink-0"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>
    </>
  )
}

export default Header