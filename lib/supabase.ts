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
export const supabaseServer = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Helper functions
export const supabaseHelpers = {
  // Auth helpers
  auth: {
    signUp: async (email: string, password: string) => {
      return supabase.auth.signUp({ email, password });
    },
    signIn: async (email: string, password: string) => {
      return supabase.auth.signInWithPassword({ email, password });
    },
    signOut: async () => {
      return supabase.auth.signOut();
    },
    getSession: async () => {
      return supabase.auth.getSession();
    },
  },

  // Quote helpers
  quotes: {
    // FIXED: Anyone can submit a quote request to a specific mechanic without logging in!
    create: async (mechanicId: string, quoteData: any) => {
      return supabase.from('quotes').insert({
        user_id: mechanicId, // Links directly to Osweld's account profile
        ...quoteData,
      });
    },

    // Get user's quotes
    getUserQuotes: async (userId: string) => {
      return supabase
        .from('quotes')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
    },

    // Get single quote
    getById: async (quoteId: string) => {
      return supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();
    },

    // Update quote
    update: async (quoteId: string, updates: any) => {
      return supabase
        .from('quotes')
        .update(updates)
        .eq('id', quoteId);
    },

    // Update quote status
    updateStatus: async (quoteId: string, status: string) => {
      return supabase
        .from('quotes')
        .update({ status })
        .eq('id', quoteId);
    },

    // Delete quote (soft delete)
    delete: async (quoteId: string) => {
      return supabase
        .from('quotes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', quoteId);
    },
  },

  // Service helpers
  services: {
    // Get all active services
    getAll: async () => {
      return supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');
    },

    // Get user's services
    getUserServices: async (userId: string) => {
      return supabase
        .from('services')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('name');
    },

    // Create service
    create: async (serviceData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      return supabase.from('services').insert({
        user_id: user.id,
        ...serviceData,
      });
    },

    // Update service
    update: async (serviceId: string, updates: any) => {
      return supabase
        .from('services')
        .update(updates)
        .eq('id', serviceId);
    },

    // Delete service
    delete: async (serviceId: string) => {
      return supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', serviceId);
    },
  },

  // Review helpers
  reviews: {
    // Get approved reviews
    getApproved: async () => {
      return supabase
        .from('reviews')
        .select('*')
        .eq('status', 'approved')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
    },

    // Get user's reviews
    getUserReviews: async (userId: string) => {
      return supabase
        .from('reviews')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
    },

    // Get pending reviews
    getPending: async (userId: string) => {
      return supabase
        .from('reviews')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    },

    // FIXED: Pass mechanicId to review context so DB constraint doesn't throw a validation error
    create: async (mechanicId: string, reviewData: any) => {
      return supabase.from('reviews').insert({
        user_id: mechanicId,
        ...reviewData
      });
    },

    // Approve review
    approve: async (reviewId: string) => {
      return supabase
        .from('reviews')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', reviewId);
    },

    // Reject review
    reject: async (reviewId: string) => {
      return supabase
        .from('reviews')
        .update({ status: 'rejected' })
        .eq('id', reviewId);
    },
  },

  // Receipt helpers
  receipts: {
    // Get user's receipts
    getUserReceipts: async (userId: string) => {
      return supabase
        .from('receipts')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('job_date', { ascending: false });
    },

    // Get receipts for date range
    getByDateRange: async (userId: string, startDate: string, endDate: string) => {
      return supabase
        .from('receipts')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .gte('job_date', startDate)
        .lte('job_date', endDate)
        .order('job_date', { ascending: false });
    },

    // Create receipt
    create: async (receiptData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      return supabase.from('receipts').insert({
        user_id: user.id,
        ...receiptData,
      });
    },

    // Update receipt
    update: async (receiptId: string, updates: any) => {
      return supabase
        .from('receipts')
        .update(updates)
        .eq('id', receiptId);
    },

    // Delete receipt
    delete: async (receiptId: string) => {
      return supabase
        .from('receipts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', receiptId);
    },
  },

  // Analytics helpers
  analytics: {
    // Get user's monthly analytics
    getMonthlyStats: async (userId: string, month: number, year: number) => {
      return supabase
        .from('analytics')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
        .eq('year', year)
        .single();
    },

    // Get all analytics for user
    getAll: async (userId: string) => {
      return supabase
        .from('analytics')
        .select('*')
        .eq('user_id', userId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });
    },
  },

  // View-based helpers (for dashboards)
  views: {
    // Get dashboard summary
    getDashboardSummary: async (userId: string) => {
      return supabase
        .from('v_dashboard_summary')
        .select('*')
        .eq('user_id', userId)
        .single();
    },

    // Get monthly earnings
    getMonthlyEarnings: async (userId: string) => {
      return supabase
        .from('v_monthly_earnings')
        .select('*')
        .eq('user_id', userId)
        .order('month', { ascending: false });
    },

    // Get quote metrics
    getQuoteMetrics: async (userId: string) => {
      return supabase
        .from('v_quote_metrics')
        .select('*')
        .eq('user_id', userId)
        .single();
    },

    // Get review stats
    getReviewStats: async (userId: string) => {
      return supabase
        .from('v_review_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
    },
  },
};

export default supabase;