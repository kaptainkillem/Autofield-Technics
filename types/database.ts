export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics: {
        Row: {
          created_at: string | null
          id: string
          month: number
          total_jobs: number | null
          total_revenue: number | null
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          month: number
          total_jobs?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          month?: number
          total_jobs?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string | null
          duration_minutes: number
          id: string
          notes: string | null
          quote_id: string | null
          scheduled_date: string
          scheduled_time: string | null
          service_type: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          quote_id?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          service_type: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          quote_id?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          service_type?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_slots: {
        Row: {
          created_at: string | null
          end_datetime: string
          id: string
          mechanic_id: string | null
          reason: string | null
          start_datetime: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_datetime: string
          id?: string
          mechanic_id?: string | null
          reason?: string | null
          start_datetime: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_datetime?: string
          id?: string
          mechanic_id?: string | null
          reason?: string | null
          start_datetime?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_slots_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          accent_color: string
          email_display_name: string | null
          email_reply_to: string | null
          favicon_url: string | null
          id: string
          notification_email: boolean
          notification_push: boolean
          notification_whatsapp: boolean
          primary_color: string
          smtp_note: string | null
          site_name: string | null
          phone: string | null
          city: string | null
          hero_title: string | null
          hero_description: string | null
          contact_email: string | null
          created_at: string | null
          document_footer: string | null
          updated_at: string | null
          whatsapp_auto_reply: string | null
          whatsapp_business_only: boolean
        }
        Insert: {
          accent_color?: string
          email_display_name?: string | null
          email_reply_to?: string | null
          favicon_url?: string | null
          id?: string
          notification_email?: boolean
          notification_push?: boolean
          notification_whatsapp?: boolean
          primary_color?: string
          smtp_note?: string | null
          site_name?: string | null
          phone?: string | null
          city?: string | null
          hero_title?: string | null
          hero_description?: string | null
          contact_email?: string | null
          created_at?: string | null
          document_footer?: string | null
          updated_at?: string | null
          whatsapp_auto_reply?: string | null
          whatsapp_business_only?: boolean
        }
        Update: {
          accent_color?: string
          email_display_name?: string | null
          email_reply_to?: string | null
          favicon_url?: string | null
          id?: string
          notification_email?: boolean
          notification_push?: boolean
          notification_whatsapp?: boolean
          primary_color?: string
          smtp_note?: string | null
          site_name?: string | null
          phone?: string | null
          city?: string | null
          hero_title?: string | null
          hero_description?: string | null
          contact_email?: string | null
          created_at?: string | null
          document_footer?: string | null
          updated_at?: string | null
          whatsapp_auto_reply?: string | null
          whatsapp_business_only?: boolean
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          display_order: number | null
          icon_name: string
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          icon_name?: string
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          icon_name?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          deleted_at: string | null
          description: string | null
          expense_date: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          deleted_at: string | null
          description: string | null
          discount_percent: number
          id: string
          invoice_number: string | null
          line_items: Json
          notes: string | null
          payment_method: string | null
          quote_id: string | null
          service_type: string | null
          status: string | null
          subtotal: number
          total: number
          updated_at: string | null
          user_id: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
        }
        Insert: {
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          deleted_at?: string | null
          description?: string | null
          discount_percent?: number
          id?: string
          invoice_number?: string | null
          line_items?: Json
          notes?: string | null
          payment_method?: string | null
          quote_id?: string | null
          service_type?: string | null
          status?: string | null
          subtotal?: number
          total?: number
          updated_at?: string | null
          user_id: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          deleted_at?: string | null
          description?: string | null
          discount_percent?: number
          id?: string
          invoice_number?: string | null
          line_items?: Json
          notes?: string | null
          payment_method?: string | null
          quote_id?: string | null
          service_type?: string | null
          status?: string | null
          subtotal?: number
          total?: number
          updated_at?: string | null
          user_id?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      // DEPRECATED — leads table removed from UI, unified into quotes table. Retained for backward DB compat.
      leads: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          notes: string | null
          phone: string | null
          status: string | null
          vehicle_details: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          vehicle_details?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          vehicle_details?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean
          message: string | null
          reference_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          reference_id?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_holder: string | null
          account_number: string | null
          address: string | null
          alternate_phone: string | null
          bank_name: string | null
          branch_code: string | null
          callout_fee: number | null
          client_status: string | null
          company_name: string | null
          created_at: string | null
          default_deposit_percent: number | null
          diagnostic_fee: number | null
          full_name: string | null
          hourly_rate: number | null
          id: string
          internal_notes: string | null
          logo_url: string | null
          notification_appointments_email: boolean | null
          notification_marketing: boolean | null
          notification_quotes_whatsapp: boolean | null
          onboarding_completed: boolean
          phone: string | null
          physical_address: string | null
          prefers_whatsapp: boolean | null
          registration_number: string | null
          role: string
          service_reminders_opt_in: boolean | null
          terms_conditions: string | null
          updated_at: string | null
          vat_number: string | null
          whatsapp_number: string | null
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          address?: string | null
          alternate_phone?: string | null
          bank_name?: string | null
          branch_code?: string | null
          callout_fee?: number | null
          client_status?: string | null
          company_name?: string | null
          created_at?: string | null
          default_deposit_percent?: number | null
          diagnostic_fee?: number | null
          full_name?: string | null
          hourly_rate?: number | null
          id: string
          internal_notes?: string | null
          logo_url?: string | null
          notification_appointments_email?: boolean | null
          notification_marketing?: boolean | null
          notification_quotes_whatsapp?: boolean | null
          onboarding_completed?: boolean
          phone?: string | null
          physical_address?: string | null
          prefers_whatsapp?: boolean | null
          registration_number?: string | null
          role?: string
          service_reminders_opt_in?: boolean | null
          terms_conditions?: string | null
          updated_at?: string | null
          vat_number?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          address?: string | null
          alternate_phone?: string | null
          bank_name?: string | null
          branch_code?: string | null
          callout_fee?: number | null
          client_status?: string | null
          company_name?: string | null
          created_at?: string | null
          default_deposit_percent?: number | null
          diagnostic_fee?: number | null
          full_name?: string | null
          hourly_rate?: number | null
          id?: string
          internal_notes?: string | null
          logo_url?: string | null
          notification_appointments_email?: boolean | null
          notification_marketing?: boolean | null
          notification_quotes_whatsapp?: boolean | null
          onboarding_completed?: boolean
          phone?: string | null
          physical_address?: string | null
          prefers_whatsapp?: boolean | null
          registration_number?: string | null
          role?: string
          service_reminders_opt_in?: boolean | null
          terms_conditions?: string | null
          updated_at?: string | null
          vat_number?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          deleted_at: string | null
          description: string
          discount_percent: number | null
          estimated_quote: number | null
          id: string
          line_items: Json | null
          notes: string | null
          pdf_url: string | null
          quote_number: string | null
          service_type: string | null
          source: string | null
          status: string | null
          subtotal: number | null
          total: number | null
          updated_at: string | null
          user_id: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
          whatsapp_message_id: string | null
          whatsapp_sent_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          deleted_at?: string | null
          description: string
          discount_percent?: number | null
          estimated_quote?: number | null
          id?: string
          line_items?: Json | null
          notes?: string | null
          pdf_url?: string | null
          quote_number?: string | null
          service_type?: string | null
          source?: string | null
          status?: string | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          whatsapp_message_id?: string | null
          whatsapp_sent_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          deleted_at?: string | null
          description?: string
          discount_percent?: number | null
          estimated_quote?: number | null
          id?: string
          line_items?: Json | null
          notes?: string | null
          pdf_url?: string | null
          quote_number?: string | null
          service_type?: string | null
          source?: string | null
          status?: string | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
          user_id?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          whatsapp_message_id?: string | null
          whatsapp_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount_paid: number
          created_at: string | null
          customer_name: string | null
          deleted_at: string | null
          id: string
          invoice_number: string | null
          job_date: string
          notes: string | null
          payment_method: string | null
          quote_id: string | null
          source: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          customer_name?: string | null
          deleted_at?: string | null
          id?: string
          invoice_number?: string | null
          job_date: string
          notes?: string | null
          payment_method?: string | null
          quote_id?: string | null
          source?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          customer_name?: string | null
          deleted_at?: string | null
          id?: string
          invoice_number?: string | null
          job_date?: string
          notes?: string | null
          payment_method?: string | null
          quote_id?: string | null
          source?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          approved_at: string | null
          comment: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string
          deleted_at: string | null
          id: string
          moderation_notes: string | null
          quote_id: string | null
          rating: number
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          comment?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          deleted_at?: string | null
          id?: string
          moderation_notes?: string | null
          quote_id?: string | null
          rating: number
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          comment?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          deleted_at?: string | null
          id?: string
          moderation_notes?: string | null
          quote_id?: string | null
          rating?: number
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_locations: {
        Row: {
          city: string
          content_body: string
          created_at: string
          h1_heading: string
          id: string
          is_active: boolean | null
          meta_description: string
          meta_title: string
          province: string
          suburb: string
          updated_at: string
        }
        Insert: {
          city: string
          content_body: string
          created_at?: string
          h1_heading: string
          id?: string
          is_active?: boolean | null
          meta_description: string
          meta_title: string
          province: string
          suburb: string
          updated_at?: string
        }
        Update: {
          city?: string
          content_body?: string
          created_at?: string
          h1_heading?: string
          id?: string
          is_active?: boolean | null
          meta_description?: string
          meta_title?: string
          province?: string
          suburb?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo_registry: {
        Row: {
          city: string | null
          created_at: string
          h1_heading: string | null
          id: string
          is_active: boolean | null
          meta_description: string
          meta_keywords: string | null
          meta_title: string
          page_type: string
          path_url: string
          province: string | null
          suburb: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          h1_heading?: string | null
          id?: string
          is_active?: boolean | null
          meta_description: string
          meta_keywords?: string | null
          meta_title: string
          page_type: string
          path_url: string
          province?: string | null
          suburb?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          h1_heading?: string | null
          id?: string
          is_active?: boolean | null
          meta_description?: string
          meta_keywords?: string | null
          meta_title?: string
          page_type?: string
          path_url?: string
          province?: string | null
          suburb?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          base_price: number | null
          category: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          base_price?: number | null
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          base_price?: number | null
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      // DEPRECATED — unused in application code
      users: {
        Row: {
          auto_reply_message: string | null
          bio: string | null
          business_name: string | null
          created_at: string | null
          deleted_at: string | null
          email: string
          id: string
          notifications_enabled: boolean | null
          password_hash: string | null
          phone: string | null
          profile_image_url: string | null
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          auto_reply_message?: string | null
          bio?: string | null
          business_name?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email: string
          id?: string
          notifications_enabled?: boolean | null
          password_hash?: string | null
          phone?: string | null
          profile_image_url?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          auto_reply_message?: string | null
          bio?: string | null
          business_name?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          id?: string
          notifications_enabled?: boolean | null
          password_hash?: string | null
          phone?: string | null
          profile_image_url?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string | null
          id: string
          license_plate: string | null
          make: string
          mileage: string | null
          model: string
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          license_plate?: string | null
          make: string
          mileage?: string | null
          model: string
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          license_plate?: string | null
          make?: string
          mileage?: string | null
          model?: string
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      working_hours: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_dashboard_summary: {
        Row: {
          business_name: string | null
          completed_jobs: number | null
          total_earnings: number | null
          total_quotes: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_notifications: { Args: never; Returns: undefined }
      get_admin_ids: {
        Args: never
        Returns: {
          id: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      notify_admins: {
        Args: {
          p_message?: string
          p_reference_id: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
