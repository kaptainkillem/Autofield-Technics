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
        Insert: {
          id?: string
          email: string
          phone?: string | null
          business_name?: string | null
          whatsapp_number?: string | null
          password_hash?: string | null
          bio?: string | null
          profile_image_url?: string | null
          notifications_enabled?: boolean
          auto_reply_message?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          phone?: string | null
          business_name?: string | null
          whatsapp_number?: string | null
          password_hash?: string | null
          bio?: string | null
          profile_image_url?: string | null
          notifications_enabled?: boolean
          auto_reply_message?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
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
        Insert: {
          id?: string
          name: string
          slug: string
          icon_name?: string | null
          display_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          icon_name?: string | null
          display_order?: number | null
          created_at?: string
          updated_at?: string
        }
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
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          category?: string | null
          category_id?: string | null
          base_price?: number | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          category?: string | null
          category_id?: string | null
          base_price?: number | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
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
        Insert: {
          id?: string
          user_id?: string
          customer_name: string
          customer_email?: string | null
          customer_phone: string
          vehicle_year?: number | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          description?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          customer_name?: string
          customer_email?: string | null
          customer_phone?: string
          vehicle_year?: number | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          description?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string | null
          quote_id: string | null
          customer_name: string
          customer_email: string | null
          rating: number
          comment: string
          status: string
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
          customer_email?: string | null
          rating: number
          comment: string
          status?: string
          moderation_notes?: string | null
          approved_at?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          quote_id?: string | null
          customer_name?: string
          customer_email?: string | null
          rating?: number
          comment?: string
          status?: string
          moderation_notes?: string | null
          approved_at?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
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
        Insert: {
          id?: string
          user_id?: string
          quote_id?: string | null
          amount_paid: number
          payment_method?: string | null
          job_date?: string | null
          issued_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          quote_id?: string | null
          amount_paid?: number
          payment_method?: string | null
          job_date?: string | null
          issued_at?: string | null
          deleted_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          role: string
          onboarding_completed: boolean
          company_name: string | null
          logo_url: string | null
          address: string | null
          whatsapp_number: string | null
          vat_number: string | null
          registration_number: string | null
          bank_name: string | null
          account_holder: string | null
          account_number: string | null
          branch_code: string | null
          hourly_rate: number | null
          callout_fee: number | null
          diagnostic_fee: number | null
          terms_conditions: string | null
          default_deposit_percent: number | null
          alternate_phone: string | null
          physical_address: string | null
          prefers_whatsapp: boolean | null
          service_reminders_opt_in: boolean | null
          client_status: string | null
          internal_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          role?: string
          onboarding_completed?: boolean
          company_name?: string | null
          logo_url?: string | null
          address?: string | null
          whatsapp_number?: string | null
          vat_number?: string | null
          registration_number?: string | null
          bank_name?: string | null
          account_holder?: string | null
          account_number?: string | null
          branch_code?: string | null
          hourly_rate?: number | null
          callout_fee?: number | null
          diagnostic_fee?: number | null
          terms_conditions?: string | null
          default_deposit_percent?: number | null
          alternate_phone?: string | null
          physical_address?: string | null
          prefers_whatsapp?: boolean | null
          service_reminders_opt_in?: boolean | null
          client_status?: string | null
          internal_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          role?: string
          onboarding_completed?: boolean
          company_name?: string | null
          logo_url?: string | null
          address?: string | null
          whatsapp_number?: string | null
          vat_number?: string | null
          registration_number?: string | null
          bank_name?: string | null
          account_holder?: string | null
          account_number?: string | null
          branch_code?: string | null
          hourly_rate?: number | null
          callout_fee?: number | null
          diagnostic_fee?: number | null
          terms_conditions?: string | null
          default_deposit_percent?: number | null
          alternate_phone?: string | null
          physical_address?: string | null
          prefers_whatsapp?: boolean | null
          service_reminders_opt_in?: boolean | null
          client_status?: string | null
          internal_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      vehicles: {
        Row: {
          id: string
          user_id: string
          make: string
          model: string
          year: number
          license_plate: string | null
          mileage: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          make: string
          model: string
          year: number
          license_plate?: string | null
          mileage?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          make?: string
          model?: string
          year?: number
          license_plate?: string | null
          mileage?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      leads: {
        Row: {
          id: string
          name: string | null
          phone: string | null
          vehicle_details: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          phone?: string | null
          vehicle_details?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          phone?: string | null
          vehicle_details?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      seo_registry: {
        Row: {
          id: string
          path_url: string
          page_type: string
          meta_title: string
          meta_description: string
          meta_keywords: string
          h1_heading: string
          province: string | null
          city: string | null
          suburb: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          path_url: string
          page_type?: string
          meta_title: string
          meta_description: string
          meta_keywords: string
          h1_heading: string
          province?: string | null
          city?: string | null
          suburb?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          path_url?: string
          page_type?: string
          meta_title?: string
          meta_description?: string
          meta_keywords?: string
          h1_heading?: string
          province?: string | null
          city?: string | null
          suburb?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
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
        Insert: {
          id?: string
          user_id: string
          month: number
          year: number
          total_revenue?: number | null
          total_jobs?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          month?: number
          year?: number
          total_revenue?: number | null
          total_jobs?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      appointments: {
        Row: {
          id: string
          user_id: string
          quote_id: string | null
          service_type: string
          scheduled_date: string
          scheduled_time: string
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quote_id?: string | null
          service_type: string
          scheduled_date: string
          scheduled_time: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          quote_id?: string | null
          service_type?: string
          scheduled_date?: string
          scheduled_time?: string
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
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