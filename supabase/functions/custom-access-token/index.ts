import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Verify the request is from Supabase Auth
  const authHeader = req.headers.get('Authorization')
  const expectedSecret = Deno.env.get('AUTH_HOOK_SECRET')
  if (expectedSecret) {
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (token !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userId = body?.user_id;
  const claims = body?.claims ?? {};

  if (!userId) {
    console.error('custom-access-token: missing user_id');
    return new Response(JSON.stringify({ claims }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('workshop_id, role')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.log('custom-access-token: profile not found for', userId, profileError.code);
  }

  claims.app_metadata = {
    ...(claims.app_metadata || {}),
    workshop_id: profile?.workshop_id ?? null,
    role: profile?.role ?? 'client',
  };

  return new Response(JSON.stringify({ claims }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
