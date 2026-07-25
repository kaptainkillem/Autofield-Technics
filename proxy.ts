import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/database'

/**
 * Route protection + tenant-context middleware.
 *
 * Tenant routing: Each client has their own Vercel project + domain, so the
 * workshop is pinned via NEXT_PUBLIC_DEFAULT_WORKSHOP_SLUG at deploy time.
 * We still inject x-workshop-slug / x-site-url headers for server components
 * that may need them.
 *
 * Auth responsibilities:
 * - Protect /dashboard/admin/* (admin/super_admin)
 * - Protect /dashboard/super-admin/* (super_admin only)
 * - Protect /dashboard/* (any authenticated user)
 * - Protect /onboarding/* (any authenticated user)
 * - Redirect authenticated users away from /signin, /signup, etc.
 * - Enforce onboarding completion for client dashboard routes.
 */

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/signin',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/suspended',
  ],
}

function getRoleFromJWT(accessToken?: string): string {
  if (!accessToken) return 'client'
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]))
    return payload?.app_metadata?.role ?? 'client'
  } catch {
    return 'client'
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const authRoutes = ['/signin', '/signup', '/forgot-password', '/reset-password']
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  const isAdminRoute = pathname.startsWith('/dashboard/admin')
  const isSuperAdminRoute = pathname.startsWith('/dashboard/super-admin')
  const isDashboardRoute = pathname.startsWith('/dashboard') && !isAdminRoute && !isSuperAdminRoute
  const isOnboardingRoute = pathname.startsWith('/onboarding')
  const isSuspendedRoute = pathname.startsWith('/suspended')

  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Inject static tenant context headers for downstream server components
  const defaultWorkshopSlug = process.env.NEXT_PUBLIC_DEFAULT_WORKSHOP_SLUG
  if (defaultWorkshopSlug) {
    response.headers.set('x-workshop-slug', defaultWorkshopSlug)
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (siteUrl) {
    response.headers.set('x-site-url', siteUrl)
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, {
              ...options,
              secure: process.env.NODE_ENV === 'production',
              httpOnly: true,
              sameSite: 'lax',
            })
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // No session cookie: redirect to signin for protected routes
  if (!session) {
    if (isAdminRoute || isSuperAdminRoute || isDashboardRoute || isOnboardingRoute) {
      const signInUrl = new URL('/signin', request.url)
      signInUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(signInUrl)
    }
    return response
  }

  // Cryptographically validate the session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    if (isAdminRoute || isSuperAdminRoute || isDashboardRoute || isOnboardingRoute) {
      const signInUrl = new URL('/signin', request.url)
      signInUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(signInUrl)
    }
    return response
  }

  const role = getRoleFromJWT(session?.access_token)
  const isStaff = role === 'admin' || role === 'super_admin'

  // Query profile for onboarding status + workshop_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, workshop_id')
    .eq('id', user.id)
    .single()

  const onboardingCompleted = profile?.onboarding_completed ?? false
  const workshopId = (profile as any)?.workshop_id

  // Check workshop status for staff — block suspended/inactive workshops
  if (isStaff && workshopId) {
    const { data: ws } = await supabase
      .from('workshops')
      .select('status')
      .eq('id', workshopId)
      .single()

    if (ws && ws.status !== 'active') {
      return NextResponse.redirect(new URL('/suspended', request.url))
    }
  }

  // Authenticated users should not see auth pages
  if (isAuthRoute) {
    if (role === 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard/super-admin', request.url))
    }
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/dashboard/admin', request.url))
    }
    if (onboardingCompleted) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.redirect(new URL('/onboarding/profile', request.url))
  }

  // Admin zone shielding
  if (isAdminRoute) {
    if (isStaff) {
      return response
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Super admin zone shielding
  if (isSuperAdminRoute) {
    if (role === 'super_admin') {
      return response
    }
    return NextResponse.redirect(new URL('/dashboard/admin', request.url))
  }

  // Client dashboard: enforce onboarding and reroute staff
  if (isDashboardRoute) {
    if (role === 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard/super-admin', request.url))
    }
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/dashboard/admin', request.url))
    }
    if (!onboardingCompleted) {
      return NextResponse.redirect(new URL('/onboarding/profile', request.url))
    }
    return response
  }

  // Onboarding routes: prevent re-entry if already done
  if (isOnboardingRoute) {
    if (onboardingCompleted) {
      if (role === 'super_admin') {
        return NextResponse.redirect(new URL('/dashboard/super-admin', request.url))
      }
      return NextResponse.redirect(
        role === 'admin' ? new URL('/dashboard/admin', request.url) : new URL('/dashboard', request.url)
      )
    }
    return response
  }

  return response
}
