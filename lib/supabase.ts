// lib/supabase.ts
// Supabase client setup for Next.js application

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';


// Client-side Supabase client (for browser/public usage)
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Server-side Supabase client (for API routes - use service role key)
// Guarded: only created when SUPABASE_SERVICE_ROLE_KEY is available (server-side)
export const supabaseServer = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : null;

// Helper functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _supabase = supabase as any;

export const supabaseHelpers = {
  // Auth helpers
  auth: {
    signUp: async (email: string, password: string) => {
      return _supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    },
    signIn: async (email: string, password: string) => {
      return _supabase.auth.signInWithPassword({ email, password });
    },
    signOut: async () => {
      return _supabase.auth.signOut();
    },
    getSession: async () => {
      return _supabase.auth.getSession();
    },
    resetPassword: async (email: string) => {
      return _supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    },
    updatePassword: async (password: string) => {
      return _supabase.auth.updateUser({ password });
    },
  },

  // Profile helpers
  profiles: {
    get: async () => {
      const { data: { user } } = await _supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return _supabase.from('profiles').select('*').eq('id', user.id).single();
    },
    upsert: async (updates: Record<string, any>) => {
      const { data: { user } } = await _supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return _supabase.from('profiles').upsert({ id: user.id, ...updates });
    },
    updateOnboarding: async (completed: boolean) => {
      const { data: { user } } = await _supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return _supabase.from('profiles').update({ onboarding_completed: completed }).eq('id', user.id);
    },
  },

  // Vehicle helpers
  vehicles: {
    create: async (vehicleData: Record<string, any>) => {
      const { data: { user } } = await _supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return _supabase.from('vehicles').insert({ user_id: user.id, ...vehicleData });
    },
    getUserVehicles: async () => {
      const { data: { user } } = await _supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return _supabase.from('vehicles').select('*').eq('user_id', user.id);
    },
  },

  // Quote helpers
  quotes: {
    create: async (mechanicId: string, quoteData: any) => {
      return _supabase.from('quotes').insert({
        user_id: mechanicId,
        ...quoteData,
      });
    },

    getUserQuotes: async (userId: string) => {
      return _supabase
        .from('quotes')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
    },

    getById: async (quoteId: string) => {
      return _supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();
    },

    update: async (quoteId: string, updates: any) => {
      return _supabase
        .from('quotes')
        .update(updates)
        .eq('id', quoteId);
    },

    updateStatus: async (quoteId: string, status: string) => {
      return _supabase
        .from('quotes')
        .update({ status })
        .eq('id', quoteId);
    },

    delete: async (quoteId: string) => {
      return _supabase
        .from('quotes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', quoteId);
    },
  },

  // Service helpers
  services: {
    getAll: async () => {
      return _supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');
    },

    getById: async (serviceId: string) => {
      return _supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();
    },

    getUserServices: async (userId: string) => {
      return _supabase
        .from('services')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('name');
    },

    create: async (serviceData: any) => {
      const { data: { user } } = await _supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      return _supabase.from('services').insert({
        user_id: user.id,
        ...serviceData,
      });
    },

    update: async (serviceId: string, updates: any) => {
      return _supabase
        .from('services')
        .update(updates)
        .eq('id', serviceId);
    },

    delete: async (serviceId: string) => {
      return _supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', serviceId);
    },
  },

  // Review helpers
  reviews: {
    getApproved: async () => {
      return _supabase
        .from('reviews')
        .select('*')
        .eq('status', 'approved')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
    },

    getUserReviews: async (userId: string) => {
      return _supabase
        .from('reviews')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
    },

    getPending: async (userId: string) => {
      return _supabase
        .from('reviews')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    },

    create: async (mechanicId: string, reviewData: any) => {
      return _supabase.from('reviews').insert({
        user_id: mechanicId,
        ...reviewData,
      });
    },

    approve: async (reviewId: string) => {
      return _supabase
        .from('reviews')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', reviewId);
    },

    reject: async (reviewId: string) => {
      return _supabase
        .from('reviews')
        .update({ status: 'rejected' })
        .eq('id', reviewId);
    },
  },

  // Receipt helpers
  receipts: {
    getUserReceipts: async (userId: string) => {
      return _supabase
        .from('receipts')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('job_date', { ascending: false });
    },

    getByDateRange: async (userId: string, startDate: string, endDate: string) => {
      return _supabase
        .from('receipts')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .gte('job_date', startDate)
        .lte('job_date', endDate)
        .order('job_date', { ascending: false });
    },

    create: async (receiptData: any) => {
      const { data: { user } } = await _supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      return _supabase.from('receipts').insert({
        user_id: user.id,
        ...receiptData,
      });
    },

    update: async (receiptId: string, updates: any) => {
      return _supabase
        .from('receipts')
        .update(updates)
        .eq('id', receiptId);
    },

    delete: async (receiptId: string) => {
      return _supabase
        .from('receipts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', receiptId);
    },
  },

  // Analytics helpers
  analytics: {
    getMonthlyStats: async (userId: string, month: number, year: number) => {
      return _supabase
        .from('analytics')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
        .eq('year', year)
        .single();
    },

    getAll: async (userId: string) => {
      return _supabase
        .from('analytics')
        .select('*')
        .eq('user_id', userId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });
    },
  },

  // View-based helpers (for dashboards)
  views: {
    getDashboardSummary: async (userId: string) => {
      return _supabase
        .from('v_dashboard_summary')
        .select('*')
        .eq('user_id', userId)
        .single();
    },

    getMonthlyEarnings: async (userId: string) => {
      return _supabase
        .from('v_monthly_earnings')
        .select('*')
        .eq('user_id', userId)
        .order('month', { ascending: false });
    },

    getQuoteMetrics: async (userId: string) => {
      return _supabase
        .from('v_quote_metrics')
        .select('*')
        .eq('user_id', userId)
        .single();
    },

    getReviewStats: async (userId: string) => {
      return _supabase
        .from('v_review_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
    },
  },
};

export default supabase;