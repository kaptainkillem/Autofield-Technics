'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Star,
  LogOut,
  Loader2,
  Menu,
  X,
  Wrench,
  Users,
  Receipt,
  Settings,
  Globe,
  Settings2,
  CalendarClock
} from 'lucide-react'
import { SiteLogo } from '@/components/common/SiteLogo'
import { supabase } from '@/lib/supabase'

type SupabaseUser = Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']

function getUserInitial(user: SupabaseUser | null): string {
  if (!user) return ''
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''
  if (name) return name.charAt(0).toUpperCase()
  return user.email?.charAt(0).toUpperCase() ?? ''
}

// 🚀 Updated: Synced with dedicated client standalone workspace sub-routes
const CLIENT_NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Quotes ', href: '/dashboard/quotes', icon: FileText },
  { label: 'My Garage', href: '/dashboard/vehicles', icon: Wrench },
  { label: 'Invoices & Spend', href: '/dashboard/receipts', icon: Receipt },
  { label: 'Review Center', href: '/dashboard/reviews', icon: Star },
  { label: 'Account Settings', href: '/dashboard/settings', icon: Settings },
]

const ADMIN_NAV = [
  { label: 'Overview', href: '/dashboard/admin', icon: LayoutDashboard },
  { label: 'Quotes Inbox', href: '/dashboard/admin/quotes', icon: FileText },
  { label: 'Leads', href: '/dashboard/admin/leads', icon: Wrench }, 
  { label: 'Jobs', href: '/dashboard/admin/jobs', icon: CalendarClock },
  { label: 'Services', href: '/dashboard/admin/services', icon: Settings2 },
  { label: 'Finances', href: '/dashboard/admin/finance', icon: Star },
  { label: 'Customers', href: '/dashboard/admin/customers', icon: Users },
  { label: 'SEO Engine', href: '/dashboard/admin/seo', icon: Globe },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)

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
  const navItems = isAdmin ? ADMIN_NAV : CLIENT_NAV
  const initial = getUserInitial(user)

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch { /* best-effort server cookie clearing */ }
    try {
      await supabase.auth.signOut()
    } catch { /* best-effort client signout */ }
    setUser(null)
    router.push('/')
    router.refresh()
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1" onClick={() => setMobileOpen(false)}>
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href.includes('#') && pathname === href.split('#')[0])
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-base text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-grey hover:bg-grey-lightest hover:text-primary'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-grey-medium/20">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-base text-sm font-medium text-grey hover:bg-grey-lightest hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
          {loggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-14 left-0 bottom-0 w-64 bg-white border-r border-grey-medium/20 flex-col z-30">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile drawer header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-grey-medium/20">
          <Link href="/" className="no-underline">
            <SiteLogo />
          </Link>
          {isAdmin && (
            <span className="text-xs font-semibold bg-primary text-white px-2 py-0.5 rounded-full">
              Admin
            </span>
          )}
          <button
            type="button"
            className="text-grey hover:text-black transition-colors"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mobile user info */}
        <div className="px-5 py-4 border-b border-grey-medium/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
              {user && initial ? initial : '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-black truncate">
                {user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User'}
              </p>
              <p className="text-xs text-grey truncate">{user?.email ?? ''}</p>
            </div>
          </div>
        </div>

        {sidebarContent}
      </aside>

      {/* Mobile bottom bar with hamburger */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-grey-medium/30">
        <div className="h-14 flex items-center justify-between px-4">
          <button
            type="button"
            className="text-grey hover:text-black transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <Link href="/" className="no-underline">
            <SiteLogo />
          </Link>
          {isAdmin && (
            <span className="text-xs font-semibold bg-primary text-white px-2 py-0.5 rounded-full">
              Admin
            </span>
          )}
          <div className="w-10 h-10 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
            {user && initial ? initial : '?'}
          </div>
        </div>
      </header>
    </>
  )
}