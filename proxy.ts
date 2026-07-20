import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getRoleFromJWT } from '@/lib/supabaseServer'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Inject workshop context from environment
  const defaultWorkshopSlug = process.env.NEXT_PUBLIC_DEFAULT_WORKSHOP_SLUG
  if (defaultWorkshopSlug) {
    response.headers.set('x-workshop-slug', defaultWorkshopSlug)
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (siteUrl) {
    response.headers.set('x-site-url', siteUrl)
  }

  const supabase = createServerClient(
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
            response = NextResponse.next({
              request: { headers: request.headers },
            })
            response.cookies.set(name, value, {
              ...options,
              secure: process.env.NODE_ENV === 'production',
              httpOnly: true,
              sameSite: 'lax' as const,
            })
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = request.nextUrl

  // Route classification
  const authRoutes = ['/signin', '/signup', '/forgot-password', '/reset-password']
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  const isAdminRoute = pathname.startsWith('/dashboard/admin')
  const isSuperAdminRoute = pathname.startsWith('/dashboard/super-admin')
  const isDashboardRoute = pathname.startsWith('/dashboard') && !isAdminRoute && !isSuperAdminRoute
  const isOnboardingRoute = pathname.startsWith('/onboarding')

  // 1. No session cookie: redirect to signin for protected routes
  if (!session) {
    if (isAdminRoute || isSuperAdminRoute || isDashboardRoute || isOnboardingRoute) {
      return NextResponse.redirect(new URL('/signin', request.url))
    }
    return response
  }

  // 1b. Validate session is authentic via the Auth server
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    if (isAdminRoute || isSuperAdminRoute || isDashboardRoute || isOnboardingRoute) {
      return NextResponse.redirect(new URL('/signin', request.url))
    }
    return response
  }

  // 2. Authenticated: read role from JWT
  const role = getRoleFromJWT(session)
  const isStaff = role === 'admin' || role === 'super_admin'
  const userId = user.id

  // Query profile for onboarding status
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', userId)
    .single()

  const onboardingCompleted = profile?.onboarding_completed ?? false

  // 3. Authenticated users should not see auth pages
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

  // 4. Admin zone shielding
  if (isAdminRoute) {
    if (isStaff) {
      return response
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 4b. Super admin zone shielding
  if (isSuperAdminRoute) {
    if (role === 'super_admin') {
      return response
    }
    return NextResponse.redirect(new URL('/dashboard/admin', request.url))
  }

  // 5. Client dashboard: enforce onboarding and reroute staff
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

  // 6. Onboarding routes: prevent re-entry if already done
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

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/signin',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ],
}
