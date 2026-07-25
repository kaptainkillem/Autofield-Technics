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
  Settings,
  Globe,
  Settings2,
  CalendarClock,
  Landmark,
  PlusCircle,
  MessageSquare,
  ReceiptText,
  BarChart3,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react'
import { SiteLogo } from '@/components/common/SiteLogo'
import { supabase, getWorkshopIdFromSession } from '@/lib/supabase'

type SupabaseUser = Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']

function getUserInitial(user: SupabaseUser | null): string {
  if (!user) return ''
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''
  if (name) return name.charAt(0).toUpperCase()
  return user.email?.charAt(0).toUpperCase() ?? ''
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badgeKey?: string
}

const CLIENT_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Quotes', href: '/dashboard/quotes', icon: FileText, badgeKey: 'quotes' },
  { label: 'My Appointments', href: '/dashboard/appointments', icon: CalendarClock, badgeKey: 'appointmentActions' },
  { label: 'My Garage', href: '/dashboard/vehicles', icon: Wrench },
  { label: 'Settings', href: '/dashboard/client/settings', icon: Settings },
]

// External shortcut for client (opens in same tab, but is public route)
const CLIENT_SHORTCUTS: NavItem[] = [
  { label: 'Get a Quote', href: '/quote', icon: PlusCircle },
]

const ADMIN_NAV: NavItem[] = [
  { label: 'Overview', href: '/dashboard/admin', icon: LayoutDashboard },
  { label: 'Incoming', href: '/dashboard/admin/incoming', icon: MessageSquare, badgeKey: 'pendingQuotes' },
  { label: 'Quotes', href: '/dashboard/admin/quotes', icon: FileText },
  { label: 'Create Quote', href: '/dashboard/admin/quotes/create', icon: PlusCircle },
  { label: 'Invoices', href: '/dashboard/admin/invoices', icon: ReceiptText },
  { label: 'Jobs', href: '/dashboard/admin/jobs', icon: CalendarClock, badgeKey: 'pendingJobs' },
  { label: 'Reviews', href: '/dashboard/admin/reviews', icon: Star, badgeKey: 'pendingReviews' },
  { label: 'Services', href: '/dashboard/admin/services', icon: Settings2 },
  { label: 'Finances', href: '/dashboard/admin/finance', icon: Landmark },
  { label: 'Customers', href: '/dashboard/admin/customers', icon: Users },
  { label: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
  { label: 'FAQs', href: '/dashboard/admin/faqs', icon: HelpCircle },
  { label: 'Account Settings', href: '/dashboard/admin/settings', icon: Settings },
]

interface NavSection {
  label: string
  items: NavItem[]
}

const SUPER_ADMIN_SECTIONS: NavSection[] = [
  {
    label: 'Dashboard',
    items: [
      { label: 'Overview', href: '/dashboard/super-admin', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Workshops',
    items: [
      { label: 'All Workshops', href: '/dashboard/super-admin/workshops', icon: ShieldCheck },
      { label: 'New Workshop', href: '/dashboard/super-admin/workshops?new=true', icon: PlusCircle },
    ],
  },
  {
    label: 'Users',
    items: [
      { label: 'All Users', href: '/dashboard/super-admin/users', icon: Users },
    ],
  },
  {
    label: 'Tenant Settings',
    items: [
      { label: 'Workshop Settings', href: '/dashboard/super-admin/settings', icon: Settings2 },
      { label: 'SEO Registry', href: '/dashboard/super-admin/seo', icon: Globe },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Stats & Reports', href: '/dashboard/super-admin', icon: BarChart3 },
    ],
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [badges, setBadges] = useState<Record<string, number>>({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch badge counts + Supabase Realtime subscription
  useEffect(() => {
    if (!user) return

    const currentUserId = user.id
    const isAdminPath = pathname.startsWith('/dashboard/admin')

    async function fetchBadgeCounts() {
      const { data: { session } } = await supabase.auth.getSession()
      const workshopId = getWorkshopIdFromSession(session)

      if (isAdminPath) {
        const [quotesRes, reviewsRes, jobsRes] = await Promise.all([
          (supabase as any).from('quotes').select('id', { count: 'exact', head: true }).eq('status', 'pending').eq('workshop_id', workshopId).is('deleted_at', null),
          (supabase as any).from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending').eq('workshop_id', workshopId).is('deleted_at', null),
          (supabase as any).from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'pending').eq('workshop_id', workshopId),
        ])

        setBadges({
          pendingQuotes: quotesRes.count ?? 0,
          pendingReviews: reviewsRes.count ?? 0,
          pendingJobs: jobsRes.count ?? 0,
        })
      } else {
        const [quotesRes, proposedApptsRes, revisionsRes] = await Promise.all([
          (supabase as any)
            .from('quotes')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', currentUserId)
            .is('deleted_at', null),
          (supabase as any)
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', currentUserId)
            .eq('status', 'proposed'),
          (supabase as any)
            .from('work_orders')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'revision_pending'),
        ])

        setBadges({
          quotes: quotesRes.count ?? 0,
          appointmentActions: (proposedApptsRes.count ?? 0) + (revisionsRes.count ?? 0),
        })
      }
    }

    fetchBadgeCounts()

    const channels: ReturnType<typeof supabase.channel>[] = []

    if (isAdminPath) {
      const quotesChannel = supabase
        .channel('badges-quotes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, () => fetchBadgeCounts())
        .subscribe()
      channels.push(quotesChannel)

      const reviewsChannel = supabase
        .channel('badges-reviews')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => fetchBadgeCounts())
        .subscribe()
      channels.push(reviewsChannel)

      const apptsChannel = supabase
        .channel('badges-appointments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchBadgeCounts())
        .subscribe()
      channels.push(apptsChannel)
    } else {
      const quotesChannel = supabase
        .channel('badges-client-quotes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'quotes', filter: `user_id=eq.${currentUserId}` },
          () => fetchBadgeCounts()
        )
        .subscribe()
      channels.push(quotesChannel)

      const apptsChannel = supabase
        .channel('badges-client-appointments')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'appointments', filter: `user_id=eq.${currentUserId}` },
          () => fetchBadgeCounts()
        )
        .subscribe()
      channels.push(apptsChannel)

      const workOrdersChannel = supabase
        .channel('badges-client-work-orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, () => fetchBadgeCounts())
        .subscribe()
      channels.push(workOrdersChannel)
    }

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch))
    }
  }, [user, pathname])

  const isSuperAdmin = pathname.startsWith('/dashboard/super-admin')
  const isAdmin = pathname.startsWith('/dashboard/admin') && !isSuperAdmin
  const isClient = !isAdmin && !isSuperAdmin
  const navItems = isSuperAdmin ? [] : isAdmin ? ADMIN_NAV : CLIENT_NAV
  const shortcuts = isAdmin || isSuperAdmin ? [] : CLIENT_SHORTCUTS
  const initial = getUserInitial(user)
  const roleLabel = isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Client'

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

  function renderNavLink(item: NavItem, isShortcut = false) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    const badgeCount = item.badgeKey ? badges[item.badgeKey] ?? 0 : 0
    const Icon = item.icon

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center justify-between px-3 py-2.5 rounded-base text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary/10 text-primary font-bold'
            : isShortcut
            ? 'text-primary hover:bg-primary/5'
            : 'text-grey hover:text-primary'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} />
          {item.label}
        </div>
        {badgeCount > 0 && (
          <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </Link>
    )
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1" onClick={() => setMobileOpen(false)}>
        {isSuperAdmin
          ? SUPER_ADMIN_SECTIONS.map((section) => (
              <div key={section.label} className="mb-2">
                <p className="px-3 text-[10px] font-bold text-grey-medium uppercase tracking-wider mb-1">
                  {section.label}
                </p>
                {section.items.map((item) => renderNavLink(item))}
              </div>
            ))
          : navItems.map((item) => renderNavLink(item))}

        {/* Shortcuts section for clients */}
        {shortcuts.length > 0 && (
          <>
            <div className="my-2 border-t border-grey-light/60" />
            <p className="px-3 text-[10px] font-bold text-grey-medium uppercase tracking-wider mb-1">
              Quick Actions
            </p>
            {shortcuts.map((item) => renderNavLink(item, true))}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-grey-medium/20">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-base text-sm font-medium text-grey hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      <aside className="hidden lg:flex fixed top-14 left-0 bottom-0 w-64 bg-white border-r border-grey-medium/20 flex-col z-30 overflow-y-auto">
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
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile drawer header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-grey-medium/20">
          {isSuperAdmin ? (
            <Link href="/dashboard/super-admin" className="no-underline flex items-center gap-2">
              <img
                src="/motiongrid-assets/logos/logo-horizontal.svg"
                alt="Motion Grid"
                className="h-7 w-auto"
              />
            </Link>
          ) : (
            <Link href="/" className="no-underline">
              <SiteLogo />
            </Link>
          )}
          <div className="flex items-center gap-2">
            {roleLabel === 'Admin' && (
                <span className="text-xs font-semibold bg-primary text-white px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
              {roleLabel === 'Super Admin' && (
                <span className="text-xs font-semibold bg-yellow-600 text-white px-2 py-0.5 rounded-full">
                  Super Admin
                </span>
              )}
              {roleLabel === 'Client' && (
                <span className="text-xs font-semibold bg-primary text-white px-2 py-0.5 rounded-full">
                  Client
                </span>
              )}
            <button
              type="button"
              className="text-grey hover:text-grey-dark transition-colors"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Mobile user info */}
        <div className="px-5 py-4 border-b border-grey-medium/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
              {user && initial ? initial : '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-grey-dark truncate">
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
            className="text-grey hover:text-grey-dark transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          {isSuperAdmin ? (
            <Link href="/dashboard/super-admin" className="no-underline flex items-center gap-2">
              <img
                src="/motiongrid-assets/logos/logo-horizontal.svg"
                alt="Motion Grid"
                className="h-7 w-auto"
              />
            </Link>
          ) : (
            <Link href="/" className="no-underline">
              <SiteLogo />
            </Link>
          )}
          <div className="flex items-center gap-2">
            {roleLabel === 'Admin' && (
                <span className="text-xs font-semibold bg-primary text-white px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
              {roleLabel === 'Super Admin' && (
                <span className="text-xs font-semibold bg-yellow-600 text-white px-2 py-0.5 rounded-full">
                  Super Admin
                </span>
              )}
              {roleLabel === 'Client' && (
                <span className="text-xs font-semibold bg-primary text-white px-2 py-0.5 rounded-full">
                  Client
                </span>
              )}
            <div className="w-10 h-10 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
              {user && initial ? initial : '?'}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
