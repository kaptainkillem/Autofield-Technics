import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

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
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Route classification
  const authRoutes = ['/signin', '/signup', '/forgot-password', '/reset-password']
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  const isAdminRoute = pathname.startsWith('/dashboard/admin')
  const isDashboardRoute = pathname.startsWith('/dashboard') && !isAdminRoute
  const isOnboardingRoute = pathname.startsWith('/onboarding')

  // 1. Anonymous sessions: protect private routes
  if (!user) {
    if (isAdminRoute || isDashboardRoute || isOnboardingRoute) {
      return NextResponse.redirect(new URL('/signin', request.url))
    }
    return response
  }

  // 2. Authenticated: query profile for role and onboarding status
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_completed')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'client'
  const isStaff = role === 'admin' || role === 'mechanic'
  const onboardingCompleted = profile?.onboarding_completed ?? false

  // 3. Authenticated users should not see auth pages
  if (isAuthRoute) {
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

  // 5. Client dashboard: enforce onboarding
  if (isDashboardRoute) {
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
