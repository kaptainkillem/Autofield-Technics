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
          workshop_id: string
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
          workshop_id: string
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
          workshop_id?: string
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
          {
            foreignKeyName: "analytics_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string | null
          customer_name: string | null
          duration_minutes: number
          id: string
          notes: string | null
          proposed_date: string | null
          proposed_notes: string | null
          proposed_time: string | null
          quote_id: string | null
          scheduled_date: string
          scheduled_time: string | null
          service_type: string
          status: string
          updated_at: string | null
          user_id: string
          workshop_id: string
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          proposed_date?: string | null
          proposed_notes?: string | null
          proposed_time?: string | null
          quote_id?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          service_type: string
          status?: string
          updated_at?: string | null
          user_id: string
          workshop_id: string
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          proposed_date?: string | null
          proposed_notes?: string | null
          proposed_time?: string | null
          quote_id?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          service_type?: string
          status?: string
          updated_at?: string | null
          user_id?: string
          workshop_id?: string
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
          {
            foreignKeyName: "appointments_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
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
          workshop_id: string
        }
        Insert: {
          created_at?: string | null
          end_datetime: string
          id?: string
          mechanic_id?: string | null
          reason?: string | null
          start_datetime: string
          updated_at?: string | null
          workshop_id: string
        }
        Update: {
          created_at?: string | null
          end_datetime?: string
          id?: string
          mechanic_id?: string | null
          reason?: string | null
          start_datetime?: string
          updated_at?: string | null
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_slots_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_slots_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          accent_color: string
          account_holder: string | null
          account_number: string | null
          address: string | null
          bank_name: string | null
          branch_code: string | null
          business_hours: string | null
          business_type: string | null
          callout_fee: number | null
          city: string | null
          company_name: string | null
          contact_email: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          default_deposit_percent: number | null
          diagnostic_fee: number | null
          document_footer: string | null
          email_display_name: string | null
          email_from: string | null
          email_provider: string | null
          email_reply_to: string | null
          experience_tagline: string | null
          favicon_url: string | null
          footer_show_company_reg: boolean | null
          footer_show_email: boolean | null
          footer_show_social: boolean | null
          font_family: string | null
          hero_description: string | null
          hero_image_url: string | null
          hero_title: string | null
          home_page_content: Json | null
          hourly_rate: number | null
          logo_url: string | null
          nav_links: Json | null
          notification_email: boolean
          notification_push: boolean
          notification_whatsapp: boolean
          og_image_url: string | null
          phone: string | null
          primary_color: string
          primary_text_color: string | null
          registration_number: string | null
          region: string | null
          response_time: string | null
          secondary_text_color: string | null
          service_radius: string | null
          service_tagline: string | null
          site_name: string | null
          smtp_note: string | null
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_secure: boolean | null
          smtp_username: string | null
          admin_notification_email: string | null
          social_links: Json | null
          specializations: string[] | null
          terms_conditions: string | null
          updated_at: string | null
          vat_number: string | null
          whatsapp_auto_reply: string | null
          whatsapp_business_only: boolean
          whatsapp_number: string | null
          workshop_id: string
          years_experience: string | null
        }
        Insert: {
          accent_color?: string
          account_holder?: string | null
          account_number?: string | null
          address?: string | null
          bank_name?: string | null
          branch_code?: string | null
          business_hours?: string | null
          business_type?: string | null
          callout_fee?: number | null
          city?: string | null
          company_name?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          default_deposit_percent?: number | null
          diagnostic_fee?: number | null
          document_footer?: string | null
          email_display_name?: string | null
          email_from?: string | null
          email_provider?: string | null
          email_reply_to?: string | null
          experience_tagline?: string | null
          favicon_url?: string | null
          footer_show_company_reg?: boolean | null
          footer_show_email?: boolean | null
          footer_show_social?: boolean | null
          font_family?: string | null
          hero_description?: string | null
          hero_image_url?: string | null
          hero_title?: string | null
          home_page_content?: Json | null
          hourly_rate?: number | null
          logo_url?: string | null
          nav_links?: Json | null
          notification_email?: boolean
          notification_push?: boolean
          notification_whatsapp?: boolean
          og_image_url?: string | null
          phone?: string | null
          primary_color?: string
          primary_text_color?: string | null
          registration_number?: string | null
          region?: string | null
          response_time?: string | null
          secondary_text_color?: string | null
          service_radius?: string | null
          service_tagline?: string | null
          site_name?: string | null
          smtp_note?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean | null
          smtp_username?: string | null
          admin_notification_email?: string | null
          social_links?: Json | null
          specializations?: string[] | null
          terms_conditions?: string | null
          updated_at?: string | null
          vat_number?: string | null
          whatsapp_auto_reply?: string | null
          whatsapp_business_only?: boolean
          whatsapp_number?: string | null
          workshop_id?: string
          years_experience?: string | null
        }
        Update: {
          accent_color?: string
          account_holder?: string | null
          account_number?: string | null
          address?: string | null
          bank_name?: string | null
          branch_code?: string | null
          business_hours?: string | null
          business_type?: string | null
          callout_fee?: number | null
          city?: string | null
          company_name?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          default_deposit_percent?: number | null
          diagnostic_fee?: number | null
          document_footer?: string | null
          email_display_name?: string | null
          email_reply_to?: string | null
          experience_tagline?: string | null
          favicon_url?: string | null
          footer_show_company_reg?: boolean | null
          footer_show_email?: boolean | null
          footer_show_social?: boolean | null
          font_family?: string | null
          hero_description?: string | null
          hero_image_url?: string | null
          hero_title?: string | null
          home_page_content?: Json | null
          hourly_rate?: number | null
          logo_url?: string | null
          nav_links?: Json | null
          notification_email?: boolean
          notification_push?: boolean
          notification_whatsapp?: boolean
          og_image_url?: string | null
          phone?: string | null
          primary_color?: string
          primary_text_color?: string | null
          registration_number?: string | null
          region?: string | null
          response_time?: string | null
          secondary_text_color?: string | null
          service_radius?: string | null
          service_tagline?: string | null
          site_name?: string | null
          smtp_note?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean | null
          smtp_username?: string | null
          admin_notification_email?: string | null
          social_links?: Json | null
          specializations?: string[] | null
          terms_conditions?: string | null
          updated_at?: string | null
          vat_number?: string | null
          whatsapp_auto_reply?: string | null
          whatsapp_business_only?: boolean
          whatsapp_number?: string | null
          workshop_id?: string
          years_experience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_settings_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: true
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          display_order: number | null
          icon_name: string
          id: string
          name: string
          slug: string
          workshop_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          icon_name?: string
          id?: string
          name: string
          slug: string
          workshop_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          icon_name?: string
          id?: string
          name?: string
          slug?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          from_display: string | null
          id: string
          metadata: Json | null
          status: string
          subject: string
          template_key: string
          to_email: string
          workshop_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          from_display?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          subject: string
          template_key: string
          to_email: string
          workshop_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          from_display?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          subject?: string
          template_key?: string
          to_email?: string
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string | null
          html_body: string
          id: string
          is_default: boolean | null
          subject: string
          template_key: string
          text_body: string | null
          updated_at: string | null
          workshop_id: string | null
        }
        Insert: {
          created_at?: string | null
          html_body: string
          id?: string
          is_default?: boolean | null
          subject: string
          template_key: string
          text_body?: string | null
          updated_at?: string | null
          workshop_id?: string | null
        }
        Update: {
          created_at?: string | null
          html_body?: string
          id?: string
          is_default?: boolean | null
          subject?: string
          template_key?: string
          text_body?: string | null
          updated_at?: string | null
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
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
          workshop_id: string
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
          workshop_id: string
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
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
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
          workshop_id: string | null
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
          workshop_id?: string | null
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
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faqs_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
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
          pdf_url: string | null
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
          workshop_id: string
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
          pdf_url?: string | null
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
          workshop_id: string
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
          pdf_url?: string | null
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
          workshop_id?: string
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
          {
            foreignKeyName: "invoices_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
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
          workshop_id: string
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
          workshop_id: string
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
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
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
          workshop_id: string
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
          workshop_id: string
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
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          alternate_phone: string | null
          client_status: string | null
          created_at: string | null
          full_name: string | null
          id: string
          internal_notes: string | null
          notification_appointments_email: boolean | null
          notification_marketing: boolean | null
          notification_quotes_whatsapp: boolean | null
          onboarding_completed: boolean
          phone: string | null
          physical_address: string | null
          prefers_whatsapp: boolean | null
          role: string
          service_reminders_opt_in: boolean | null
          updated_at: string | null
          whatsapp_number: string | null
          workshop_id: string | null
        }
        Insert: {
          alternate_phone?: string | null
          client_status?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          internal_notes?: string | null
          notification_appointments_email?: boolean | null
          notification_marketing?: boolean | null
          notification_quotes_whatsapp?: boolean | null
          onboarding_completed?: boolean
          phone?: string | null
          physical_address?: string | null
          prefers_whatsapp?: boolean | null
          role?: string
          service_reminders_opt_in?: boolean | null
          updated_at?: string | null
          whatsapp_number?: string | null
          workshop_id?: string | null
        }
        Update: {
          alternate_phone?: string | null
          client_status?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          internal_notes?: string | null
          notification_appointments_email?: boolean | null
          notification_marketing?: boolean | null
          notification_quotes_whatsapp?: boolean | null
          onboarding_completed?: boolean
          phone?: string | null
          physical_address?: string | null
          prefers_whatsapp?: boolean | null
          role?: string
          service_reminders_opt_in?: boolean | null
          updated_at?: string | null
          whatsapp_number?: string | null
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          deleted_at: string | null
          deposit_amount: number | null
          deposit_percent: number | null
          description: string
          discount_percent: number
          estimated_quote: number | null
          expiry_date: string | null
          id: string
          quote_token: string | null
          line_items: Json
          notes: string | null
          pdf_url: string | null
          quote_number: string | null
          service_type: string | null
          source: string | null
          status: string | null
          subtotal: number
          total: number
          updated_at: string | null
          user_id: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
          whatsapp_message_id: string | null
          whatsapp_sent_at: string | null
          workshop_id: string
        }
        Insert: {
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          deleted_at?: string | null
          deposit_amount?: number | null
          deposit_percent?: number | null
          description: string
          discount_percent?: number
          estimated_quote?: number | null
          expiry_date?: string | null
          id?: string
          quote_token?: string | null
          line_items?: Json
          notes?: string | null
          pdf_url?: string | null
          quote_number?: string | null
          service_type?: string | null
          source?: string | null
          status?: string | null
          subtotal?: number
          total?: number
          updated_at?: string | null
          user_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          whatsapp_message_id?: string | null
          whatsapp_sent_at?: string | null
          workshop_id: string
        }
        Update: {
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          deleted_at?: string | null
          deposit_amount?: number | null
          deposit_percent?: number | null
          description?: string
          discount_percent?: number
          estimated_quote?: number | null
          expiry_date?: string | null
          id?: string
          quote_token?: string | null
          line_items?: Json
          notes?: string | null
          pdf_url?: string | null
          quote_number?: string | null
          service_type?: string | null
          source?: string | null
          status?: string | null
          subtotal?: number
          total?: number
          updated_at?: string | null
          user_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          whatsapp_message_id?: string | null
          whatsapp_sent_at?: string | null
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
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
          workshop_id: string
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
          workshop_id: string
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
          workshop_id?: string
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
          {
            foreignKeyName: "receipts_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
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
          workshop_id: string
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
          workshop_id: string
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
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
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
          workshop_id: string
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
          workshop_id: string
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
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_locations_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
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
          workshop_id: string | null
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
          workshop_id?: string | null
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
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_registry_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
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
          workshop_id: string
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
          workshop_id: string
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
          workshop_id?: string
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
          {
            foreignKeyName: "services_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
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
          workshop_id: string
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
          workshop_id: string
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
          workshop_id?: string
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
          {
            foreignKeyName: "vehicles_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          event_type: string
          id: string
          new_status: string | null
          notes: string | null
          old_status: string | null
          work_order_id: string
          workshop_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_type: string
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          work_order_id: string
          workshop_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_type?: string
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          work_order_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_events_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_events_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          additional_work_items: Json
          additional_work_total: number
          appointment_id: string | null
          client_visible_notes: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          mechanic_notes: string | null
          quote_id: string
          revision_approved: boolean | null
          revision_responded_at: string | null
          started_at: string | null
          status: string
          updated_at: string | null
          workshop_id: string
        }
        Insert: {
          additional_work_items?: Json
          additional_work_total?: number
          appointment_id?: string | null
          client_visible_notes?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mechanic_notes?: string | null
          quote_id: string
          revision_approved?: boolean | null
          revision_responded_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          workshop_id: string
        }
        Update: {
          additional_work_items?: Json
          additional_work_total?: number
          appointment_id?: string | null
          client_visible_notes?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mechanic_notes?: string | null
          quote_id?: string
          revision_approved?: boolean | null
          revision_responded_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
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
          workshop_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
          updated_at?: string | null
          workshop_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
          updated_at?: string | null
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_new_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshops: {
        Row: {
          billing_status: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          domain: string | null
          id: string
          name: string
          owner_id: string
          slug: string
          status: string
          suspended_at: string | null
          suspension_reason: string | null
          updated_at: string | null
        }
        Insert: {
          billing_status?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string
          name: string
          owner_id: string
          slug: string
          status?: string
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_status?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string
          name?: string
          owner_id?: string
          slug?: string
          status?: string
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_notifications: { Args: never; Returns: undefined }
      current_user_role: { Args: never; Returns: string }
      current_workshop_id: { Args: never; Returns: string }
      get_admin_ids: {
        Args: never
        Returns: {
          id: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      notify_admins: {
        Args: {
          p_message?: string
          p_reference_id: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      notify_user: {
        Args: {
          p_message?: string
          p_reference_id: string
          p_title: string
          p_type: string
          p_user_id: string
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
