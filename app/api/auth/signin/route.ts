import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const SignInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: Request) {
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

  return response;
}