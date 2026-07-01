import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: Request) {
  try {
    const response = NextResponse.json({ success: true })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieHeader = request.headers.get('cookie') ?? ''
          return cookieHeader.split(';').map((cookie) => {
            const [name, ...valueParts] = cookie.trim().split('=')
            return { name, value: valueParts.join('=') }
          })
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              maxAge: 0,
            })
          })
        },
      },
    }
  )

  await supabase.auth.signOut()

  return response
  } catch (error) {
    console.error('[signout]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}