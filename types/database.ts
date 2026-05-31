export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          phone: string | null
          business_name: string | null
          whatsapp_number: string | null
          password_hash: string | null
          bio: string | null
          profile_image_url: string | null
          notifications_enabled: boolean
          auto_reply_message: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['users']['Row']> & { email: string }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      services: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          category: string | null
          base_price: number | null
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['services']['Row']> & { name: string; user_id: string }
        Update: Partial<Database['public']['Tables']['services']['Insert']>
      }
      quotes: {
        Row: {
          id: string
          user_id: string
          customer_name: string
          customer_email: string | null
          customer_phone: string
          vehicle_year: number | null
          vehicle_make: string | null
          vehicle_model: string | null
          service_type: string | null
          description: string
          estimated_quote: number | null
          status: 'pending' | 'sent' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
          notes: string | null
          whatsapp_sent_at: string | null
          whatsapp_message_id: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['quotes']['Row']> & { 
          user_id: string
          customer_name: string
          customer_phone: string
          description: string 
        }
        Update: Partial<Database['public']['Tables']['quotes']['Insert']>
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          quote_id: string | null
          rating: number
          comment: string | null
          customer_name: string
          customer_email: string | null
          status: 'pending' | 'approved' | 'rejected'
          moderation_notes: string | null
          created_at: string
          updated_at: string
          approved_at: string | null
          deleted_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['reviews']['Row']> & { user_id: string; rating: number; customer_name: string }
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
      }
      receipts: {
        Row: {
          id: string
          user_id: string
          quote_id: string | null
          job_date: string
          amount_paid: number
          payment_method: string | null
          notes: string | null
          invoice_number: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['receipts']['Row']> & { user_id: string; job_date: string; amount_paid: number }
        Update: Partial<Database['public']['Tables']['receipts']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          role: 'client' | 'admin'
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      vehicles: {
        Row: {
          id: string
          user_id: string
          make: string
          model: string
          year: number
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['vehicles']['Row']> & { user_id: string; make: string; model: string; year: number }
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>
      }
      analytics: {
        Row: {
          id: string
          user_id: string
          year: number
          month: number
          total_quotes: number
          completed_quotes: number
          quote_conversion_rate: number | null
          total_earnings: number
          average_job_price: number | null
          average_rating: number | null
          total_reviews: number
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['analytics']['Row']> & { user_id: string; year: number; month: number }
        Update: Partial<Database['public']['Tables']['analytics']['Insert']>
      }
    }
    Views: {
      v_monthly_earnings: {
        Row: {
          user_id: string
          month: string
          num_jobs: number
          total_earnings: number
          avg_job_price: number
          last_job_date: string
        }
      }
      v_quote_metrics: {
        Row: {
          user_id: string
          total_quotes: number
          completed_quotes: number
          accepted_quotes: number
          rejected_quotes: number
          conversion_rate: number
        }
      }
      v_review_stats: {
        Row: {
          user_id: string
          total_reviews: number
          approved_reviews: number
          average_rating: number
          min_rating: number
          max_rating: number
        }
      }
      v_dashboard_summary: {
        Row: {
          user_id: string
          business_name: string | null
          total_quotes: number
          completed_jobs: number
          total_earnings: number
        }
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}