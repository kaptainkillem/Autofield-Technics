// lib/supabase.ts
// Supabase client setup for Next.js application

import { createBrowserClient } from '@supabase/ssr';
import { Database, type TablesInsert } from '@/types/database';

// Client-side Supabase client using @supabase/ssr for cookie-based session sync
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Service role key is NO LONGER exposed through this module.
// Use lib/super-admin.ts exclusively for auth-admin operations (delete-account, super-admin invite).
// All user-facing queries must use the authenticated session client (supabase) or createSupabaseServerClient().

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function getCurrentWorkshopId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return getWorkshopIdFromSession(session);
}

/**
 * Extract the user's workshop_id from their session JWT.
 * The custom-access-token Auth Hook injects `app_metadata.workshop_id`
 * into every issued JWT. Use this on the client side where you need
 * the current user's workshop context.
 */
export function getWorkshopIdFromSession(session: { access_token?: string } | null): string | null {
  if (!session?.access_token) return null
  try {
    const payload = JSON.parse(atob(session.access_token.split('.')[1]))
    return payload?.app_metadata?.workshop_id ?? null
  } catch {
    return null
  }
}

export function getRoleFromSession(session: { access_token?: string } | null): string {
  if (!session?.access_token) return 'client'
  try {
    const payload = JSON.parse(atob(session.access_token.split('.')[1]))
    return payload?.app_metadata?.role ?? 'client'
  } catch {
    return 'client'
  }
}

export const supabaseHelpers = {
  auth: {
    signUp: async (email: string, password: string, workshopId?: string) => {
      return supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: workshopId ? { workshop_id: workshopId } : undefined,
        },
      });
    },
    resetPassword: async (email: string) => {
      return supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    },
    updatePassword: async (password: string) => {
      return supabase.auth.updateUser({ password });
    },
  },

  profiles: {
    upsert: async (updates: Omit<TablesInsert<'profiles'>, 'id'>) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      return supabase.from('profiles').upsert({ id: userId, ...updates } as TablesInsert<'profiles'>);
    },
    updateOnboarding: async (completed: boolean) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      return supabase.from('profiles').update({ onboarding_completed: completed }).eq('id', userId);
    },
  },

  vehicles: {
    create: async (vehicleData: Omit<TablesInsert<'vehicles'>, 'user_id' | 'workshop_id' | 'id' | 'created_at' | 'updated_at'>) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      const workshopId = await getCurrentWorkshopId();
      if (!workshopId) throw new Error('No workshop context');
      return supabase.from('vehicles').insert({ user_id: userId, workshop_id: workshopId, ...vehicleData });
    },
  },
};

export default supabase;
