import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

const slugToIdCache = new Map<string, { id: string; expiresAt: number }>();
const CACHE_TTL_MS = 60_000; // 1 minute

async function getAnonClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch { /* server component */ }
        },
      },
    }
  );
}

export async function resolveWorkshopBySlug(slug: string): Promise<{ id: string; name: string; slug: string } | null> {
  const cached = slugToIdCache.get(slug);
  if (cached && cached.expiresAt > Date.now()) {
    return { id: cached.id, name: '', slug };
  }

  const supabase = await getAnonClient();
  const { data } = await supabase
    .from('workshops')
    .select('id, name, slug')
    .eq('slug', slug)
    .single();

  if (data) {
    slugToIdCache.set(slug, { id: data.id, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  }

  return null;
}

export async function resolveWorkshopIdFromRequest(): Promise<string | null> {
  const supabase = await getAnonClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null
  try {
    const payload = JSON.parse(atob(session.access_token.split('.')[1]))
    return (payload?.app_metadata?.workshop_id as string) ?? null
  } catch {
    return null
  }
}
