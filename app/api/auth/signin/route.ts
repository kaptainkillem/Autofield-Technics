import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';
import { createSuperAdminClient } from '@/lib/super-admin';
import { z } from 'zod';

const SignInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { allowed, remaining } = checkRateLimit(`auth:signin:${ip}`, {
    maxRequests: 5,
    windowMs: 60_000,
  })

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again in a minute.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
    );
  }

  let body: z.infer<typeof SignInSchema>;

  try {
    const raw = await request.json();
    body = SignInSchema.parse(raw);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.errors?.[0]?.message || 'Invalid request body.' },
      { status: 400 }
    );
  }

  const { email, password } = body;

  const response = NextResponse.json({ success: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieHeader = request.headers.get('cookie') ?? '';
          return cookieHeader.split(';').map((cookie) => {
            const [name, ...valueParts] = cookie.trim().split('=');
            return { name, value: valueParts.join('=') };
          });
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const adminClient = createSuperAdminClient();

    const { data: profile } = await adminClient
      .from('profiles')
      .select('workshop_id, role')
      .eq('id', user.id)
      .single();

    const isStaff = profile && (profile.role === 'admin' || profile.role === 'super_admin');
    const workshopId = (profile as any)?.workshop_id as string | null;

    // Cross-deployment workshop guard: block users whose workshop_id does not
    // match the deployment's workshop. super_admin bypasses this check.
    const deploymentSlug = process.env.NEXT_PUBLIC_DEFAULT_WORKSHOP_SLUG
    if (deploymentSlug && profile && profile.role !== 'super_admin' && workshopId) {
      const { data: deploymentWorkshop } = await adminClient
        .from('workshops')
        .select('id')
        .eq('slug', deploymentSlug)
        .maybeSingle()

      if (deploymentWorkshop && deploymentWorkshop.id !== workshopId) {
        await supabase.auth.signOut();
        return NextResponse.json(
          { error: 'This account is not registered for this workshop.' },
          { status: 403 }
        );
      }
    }

    if (isStaff && workshopId) {
      const { data: workshop } = await adminClient
        .from('workshops')
        .select('status')
        .eq('id', workshopId)
        .single();

      if (workshop && workshop.status !== 'active') {
        await supabase.auth.signOut();
        return NextResponse.json(
          { error: 'This workshop is currently unavailable. Please contact support.' },
          { status: 401 }
        );
      }
    }
  }

  return response;
}