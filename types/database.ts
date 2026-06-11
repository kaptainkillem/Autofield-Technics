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
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          icon_name: string | null
          display_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['categories']['Row']> & { name: string; slug: string }
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      services: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          category: string | null
          category_id: string | null
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
          description: string | null
          status: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['quotes']['Row']> & { customer_name: string; customer_phone: string }
        Update: Partial<Database['public']['Tables']['quotes']['Insert']>
      }
      reviews: {
        Row: {
          id: string
          user_id: string | null
          quote_id: string | null
          customer_name: string
          vehicle_serviced: string | null
          rating: number
          review_text: string
          status: 'pending' | 'approved' | 'rejected'
          moderation_notes: string | null
          approved_at: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          quote_id?: string | null
          customer_name: string
          vehicle_serviced?: string | null
          rating: number
          review_text: string
          status?: 'pending' | 'approved' | 'rejected'
          moderation_notes?: string | null
          approved_at?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
      }
      receipts: {
        Row: {
          id: string
          user_id: string
          quote_id: string | null
          amount_paid: number
          payment_method: string | null
          job_date: string | null
          issued_at: string | null
          deleted_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['receipts']['Row']> & { amount_paid: number }
        Update: Partial<Database['public']['Tables']['receipts']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          role: string
          onboarding_completed: boolean
          created_at: string | null
          updated_at: string | null
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
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['vehicles']['Row']> & { user_id: string; make: string; model: string; year: number }
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>
      }
      analytics: {
        Row: {
          id: string
          user_id: string
          month: number
          year: number
          total_revenue: number | null
          total_jobs: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['analytics']['Row']> & { user_id: string; month: number; year: number }
        Update: Partial<Database['public']['Tables']['analytics']['Insert']>
      }
      appointments: {
  Row: {
    id: string
    user_id: string
    quote_id: string | null
    service_type: string
    scheduled_date: string
    scheduled_time: string
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
    notes: string | null
    created_at: string
    updated_at: string
  }
  Insert: Partial<Database['public']['Tables']['appointments']['Row']> & {
    user_id: string
    service_type: string
    scheduled_date: string
    scheduled_time: string
  }
  Update: Partial<Database['public']['Tables']['appointments']['Insert']>
}
    }
    Views: {
      v_dashboard_summary: {
        Row: Record<string, unknown>
      }
      v_monthly_earnings: {
        Row: Record<string, unknown>
      }
      v_quote_metrics: {
        Row: Record<string, unknown>
      }
      v_review_stats: {
        Row: Record<string, unknown>
      }
    }
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      [key: string]: never
    }
  }
}
