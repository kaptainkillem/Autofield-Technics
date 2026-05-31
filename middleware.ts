import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
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

  const authRoutes = ['/signin', '/signup', '/forgot-password', '/reset-password'];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isOnboardingRoute = pathname.startsWith('/onboarding');

  if (!user) {
    if (isAdminRoute || isDashboardRoute || isOnboardingRoute) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
    return response;
  }

  const meta = user.user_metadata ?? {};
  const role = meta.role ?? 'client';
  const onboardingCompleted = meta.onboarding_completed ?? false;

  if (isAuthRoute) {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (onboardingCompleted) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/onboarding/profile', request.url));
  }

  if (isAdminRoute) {
    if (role === 'admin') {
      return response;
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isDashboardRoute) {
    if (!onboardingCompleted) {
      return NextResponse.redirect(new URL('/onboarding/profile', request.url));
    }
    return response;
  }

  if (isOnboardingRoute) {
    if (onboardingCompleted) {
      return NextResponse.redirect(
        role === 'admin' ? new URL('/admin', request.url) : new URL('/dashboard', request.url)
      );
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/onboarding/:path*', '/signin', '/signup', '/forgot-password', '/reset-password'],
};