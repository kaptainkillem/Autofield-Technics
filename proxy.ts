import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response = NextResponse.next({
              request: { headers: request.headers },
            });
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Route Classification Bounds Layout Matrix
  const authRoutes = ['/signin', '/signup', '/forgot-password', '/reset-password'];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  
  const isAdminRoute = pathname.startsWith('/dashboard/admin');
  const isStaffDocumentRoute =
    pathname.startsWith('/dashboard/admin/quotes/create') ||
    pathname.startsWith('/dashboard/admin/quotes/drafts') ||
    pathname.startsWith('/dashboard/admin/invoices');
  
  // 🚀 Fixed: Captures both root /dashboard AND all standalone sub-routes cleanly
  const isDashboardRoute = pathname.startsWith('/dashboard') && !isAdminRoute;
  const isOnboardingRoute = pathname.startsWith('/onboarding');

  // 🛑 1. ANONYMOUS SESSIONS GATEKEEPING
  if (!user) {
    if (isAdminRoute || isDashboardRoute || isOnboardingRoute) {
      // Clear out deep paths and send unauthenticated clients straight to check credentials
      return NextResponse.redirect(new URL('/signin', request.url));
    }
    return response;
  }

  // 🔒 SECURE: Query profiles table server-side instead of reading user_metadata
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_completed')
    .eq('id', user.id)
    .single();

  // Fallback to safe defaults if profile missing — denies admin access by default
  const role = profile?.role ?? 'client';
  const isStaff = role === 'admin' || role === 'mechanic';
  const onboardingCompleted = profile?.onboarding_completed ?? false;

  // 🔒 2. AUTHENTICATED ENTRY PROTECTIONS (Prevents logged-in users from seeing signin/signup)
  if (isAuthRoute) {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/dashboard/admin', request.url));
    }
    if (onboardingCompleted) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/onboarding/profile', request.url));
  }

  // 🛡️ 3. ADMIN ZONE SHIELDING (Blocks regular clients from entry instantly)
  if (isAdminRoute) {
    if (role === 'admin' || (isStaffDocumentRoute && isStaff)) {
      return response;
    }
    // Cross-tenant protection: boot malicious or accidental traffic back to customer space
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 🚗 4. CLIENT DASHBOARD TRACKING (Guarantees onboarding completion)
  if (isDashboardRoute) {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/dashboard/admin', request.url));
    }
    if (!onboardingCompleted) {
      return NextResponse.redirect(new URL('/onboarding/profile', request.url));
    }
    return response;
  }

  // 📋 5. ONBOARDING REGISTRY CONTROL (Prevents re-running steps if done)
  if (isOnboardingRoute) {
    if (onboardingCompleted) {
      return NextResponse.redirect(
        role === 'admin' ? new URL('/dashboard/admin', request.url) : new URL('/dashboard', request.url)
      );
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/onboarding/:path*', 
    '/signin', 
    '/signup', 
    '/forgot-password', 
    '/reset-password',
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
