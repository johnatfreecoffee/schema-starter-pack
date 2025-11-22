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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_name: string
          created_at: string
          id: string
          industry: string | null
          is_test_data: boolean | null
          notes: string | null
          portal_enabled: boolean | null
          portal_last_login: string | null
          source_lead_id: string | null
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          account_name: string
          created_at?: string
          id?: string
          industry?: string | null
          is_test_data?: boolean | null
          notes?: string | null
          portal_enabled?: boolean | null
          portal_last_login?: string | null
          source_lead_id?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          account_name?: string
          created_at?: string
          id?: string
          industry?: string | null
          is_test_data?: boolean | null
          notes?: string | null
          portal_enabled?: boolean | null
          portal_last_login?: string | null
          source_lead_id?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_source_lead_id_fkey"
            columns: ["source_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: Database["public"]["Enums"]["activity_action"]
          changes: Json | null
          company_id: string | null
          created_at: string
          entity_id: string
          entity_name: string | null
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          parent_entity_id: string | null
          parent_entity_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["activity_action"]
          changes?: Json | null
          company_id?: string | null
          created_at?: string
          entity_id: string
          entity_name?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          parent_entity_id?: string | null
          parent_entity_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["activity_action"]
          changes?: Json | null
          company_id?: string | null
          created_at?: string
          entity_id?: string
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          parent_entity_id?: string | null
          parent_entity_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      addresses: {
        Row: {
          account_id: string
          address_type: string | null
          city: string
          country: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          is_primary: boolean
          label: string | null
          state: string
          street_1: string
          street_2: string | null
          unit: string | null
          updated_at: string
          zip: string
        }
        Insert: {
          account_id: string
          address_type?: string | null
          city: string
          country?: string | null
          created_at?: string
          entity_id: string
          entity_type?: string
          id?: string
          is_primary?: boolean
          label?: string | null
          state: string
          street_1: string
          street_2?: string | null
          unit?: string | null
          updated_at?: string
          zip: string
        }
        Update: {
          account_id?: string
          address_type?: string | null
          city?: string
          country?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          is_primary?: boolean
          label?: string | null
          state?: string
          street_1?: string
          street_2?: string | null
          unit?: string | null
          updated_at?: string
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_guide_sessions: {
        Row: {
          collected_fields: Json
          company_id: string | null
          completed_at: string | null
          conversation_history: Json
          created_at: string
          current_field_index: number
          current_section: string
          id: string
          skipped_fields: Json
          updated_at: string
        }
        Insert: {
          collected_fields?: Json
          company_id?: string | null
          completed_at?: string | null
          conversation_history?: Json
          created_at?: string
          current_field_index?: number
          current_section?: string
          id?: string
          skipped_fields?: Json
          updated_at?: string
        }
        Update: {
          collected_fields?: Json
          company_id?: string | null
          completed_at?: string | null
          conversation_history?: Json
          created_at?: string
          current_field_index?: number
          current_section?: string
          id?: string
          skipped_fields?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_guide_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_model_configs: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          max_tokens: number
          model_name: string
          provider: string
          stage: string
          stage_order: number
          temperature: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens: number
          model_name: string
          provider: string
          stage: string
          stage_order: number
          temperature: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number
          model_name?: string
          provider?: string
          stage?: string
          stage_order?: number
          temperature?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_page_generation_jobs: {
        Row: {
          command: string
          completed_at: string | null
          created_at: string
          debug_data: Json | null
          error_message: string | null
          id: string
          mode: string
          page_id: string | null
          result_html: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          command: string
          completed_at?: string | null
          created_at?: string
          debug_data?: Json | null
          error_message?: string | null
          id?: string
          mode: string
          page_id?: string | null
          result_html?: string | null
          status: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          command?: string
          completed_at?: string | null
          created_at?: string
          debug_data?: Json | null
          error_message?: string | null
          id?: string
          mode?: string
          page_id?: string | null
          result_html?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_training: {
        Row: {
          brand_voice: string | null
          certifications: string | null
          competitive_advantages: string | null
          competitive_positioning: string | null
          created_at: string
          customer_promise: string | null
          emergency_response: string | null
          id: string
          mission_statement: string | null
          payment_options: string | null
          project_timeline: string | null
          service_area_coverage: string | null
          service_standards: string | null
          target_audience: string | null
          unique_selling_points: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_voice?: string | null
          certifications?: string | null
          competitive_advantages?: string | null
          competitive_positioning?: string | null
          created_at?: string
          customer_promise?: string | null
          emergency_response?: string | null
          id?: string
          mission_statement?: string | null
          payment_options?: string | null
          project_timeline?: string | null
          service_area_coverage?: string | null
          service_standards?: string | null
          target_audience?: string | null
          unique_selling_points?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_voice?: string | null
          certifications?: string | null
          competitive_advantages?: string | null
          competitive_positioning?: string | null
          created_at?: string
          customer_promise?: string | null
          emergency_response?: string | null
          id?: string
          mission_statement?: string | null
          payment_options?: string | null
          project_timeline?: string | null
          service_area_coverage?: string | null
          service_standards?: string | null
          target_audience?: string | null
          unique_selling_points?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      analytics_cache: {
        Row: {
          calculated_at: string | null
          expires_at: string | null
          id: string
          metric_key: string
          metric_value: Json
        }
        Insert: {
          calculated_at?: string | null
          expires_at?: string | null
          id?: string
          metric_key: string
          metric_value: Json
        }
        Update: {
          calculated_at?: string | null
          expires_at?: string | null
          id?: string
          metric_key?: string
          metric_value?: Json
        }
        Relationships: []
      }
      analytics_snapshots: {
        Row: {
          active_accounts: number | null
          active_projects: number | null
          completed_projects_today: number | null
          completed_tasks_today: number | null
          converted_leads_today: number | null
          created_at: string | null
          customer_form_submissions_today: number | null
          customer_logins_today: number | null
          id: string
          lead_conversion_rate: number | null
          new_accounts_today: number | null
          new_leads_today: number | null
          outstanding_invoices: number | null
          overdue_tasks: number | null
          revenue_today: number | null
          snapshot_date: string
          total_accounts: number | null
          total_invoices_value: number | null
          total_leads: number | null
          total_projects: number | null
          total_quotes_value: number | null
          total_tasks: number | null
          updated_at: string | null
        }
        Insert: {
          active_accounts?: number | null
          active_projects?: number | null
          completed_projects_today?: number | null
          completed_tasks_today?: number | null
          converted_leads_today?: number | null
          created_at?: string | null
          customer_form_submissions_today?: number | null
          customer_logins_today?: number | null
          id?: string
          lead_conversion_rate?: number | null
          new_accounts_today?: number | null
          new_leads_today?: number | null
          outstanding_invoices?: number | null
          overdue_tasks?: number | null
          revenue_today?: number | null
          snapshot_date: string
          total_accounts?: number | null
          total_invoices_value?: number | null
          total_leads?: number | null
          total_projects?: number | null
          total_quotes_value?: number | null
          total_tasks?: number | null
          updated_at?: string | null
        }
        Update: {
          active_accounts?: number | null
          active_projects?: number | null
          completed_projects_today?: number | null
          completed_tasks_today?: number | null
          converted_leads_today?: number | null
          created_at?: string | null
          customer_form_submissions_today?: number | null
          customer_logins_today?: number | null
          id?: string
          lead_conversion_rate?: number | null
          new_accounts_today?: number | null
          new_leads_today?: number | null
          outstanding_invoices?: number | null
          overdue_tasks?: number | null
          revenue_today?: number | null
          snapshot_date?: string
          total_accounts?: number | null
          total_invoices_value?: number | null
          total_leads?: number | null
          total_projects?: number | null
          total_quotes_value?: number | null
          total_tasks?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      archive_rules: {
        Row: {
          auto_archive: boolean
          created_at: string
          days_threshold: number
          id: string
          module: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auto_archive?: boolean
          created_at?: string
          days_threshold: number
          id?: string
          module: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auto_archive?: boolean
          created_at?: string
          days_threshold?: number
          id?: string
          module?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      archived_data: {
        Row: {
          archived_at: string
          archived_by: string | null
          data: Json
          id: string
          original_id: string
          original_table: string
        }
        Insert: {
          archived_at?: string
          archived_by?: string | null
          data: Json
          id?: string
          original_id: string
          original_table: string
        }
        Update: {
          archived_at?: string
          archived_by?: string | null
          data?: Json
          id?: string
          original_id?: string
          original_table?: string
        }
        Relationships: []
      }
      backup_schedules: {
        Row: {
          backup_type: string | null
          created_at: string | null
          email_notifications: boolean | null
          enabled: boolean | null
          frequency: string
          id: string
          last_run_at: string | null
          next_run_at: string | null
          notification_email: string | null
          retention_count: number | null
          time_of_day: string
          updated_at: string | null
        }
        Insert: {
          backup_type?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          enabled?: boolean | null
          frequency: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          notification_email?: string | null
          retention_count?: number | null
          time_of_day?: string
          updated_at?: string | null
        }
        Update: {
          backup_type?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          enabled?: boolean | null
          frequency?: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          notification_email?: string | null
          retention_count?: number | null
          time_of_day?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      backups: {
        Row: {
          backup_type: string
          created_at: string
          created_by: string | null
          error_message: string | null
          file_path: string | null
          file_size: number | null
          id: string
          record_counts: Json | null
          restored_at: string | null
          restored_by: string | null
          status: string
          tables_included: string[]
        }
        Insert: {
          backup_type: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          record_counts?: Json | null
          restored_at?: string | null
          restored_by?: string | null
          status?: string
          tables_included?: string[]
        }
        Update: {
          backup_type?: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          record_counts?: Json | null
          restored_at?: string | null
          restored_by?: string | null
          status?: string
          tables_included?: string[]
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          account_id: string | null
          appointment_type:
            | Database["public"]["Enums"]["appointment_type"]
            | null
          created_at: string
          created_by: string
          description: string | null
          end_time: string
          event_type: string | null
          id: string
          is_test_data: boolean | null
          location: string | null
          notes: string | null
          related_to_id: string | null
          related_to_type:
            | Database["public"]["Enums"]["related_entity_type"]
            | null
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          title: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          appointment_type?:
            | Database["public"]["Enums"]["appointment_type"]
            | null
          created_at?: string
          created_by: string
          description?: string | null
          end_time: string
          event_type?: string | null
          id?: string
          is_test_data?: boolean | null
          location?: string | null
          notes?: string | null
          related_to_id?: string | null
          related_to_type?:
            | Database["public"]["Enums"]["related_entity_type"]
            | null
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          appointment_type?:
            | Database["public"]["Enums"]["appointment_type"]
            | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string
          event_type?: string | null
          id?: string
          is_test_data?: boolean | null
          location?: string | null
          notes?: string | null
          related_to_id?: string | null
          related_to_type?:
            | Database["public"]["Enums"]["related_entity_type"]
            | null
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      canned_responses: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string
          id: string
          title: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          created_by: string
          id?: string
          title: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          title?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string
          address_city: string | null
          address_state: string | null
          address_street: string | null
          address_unit: string | null
          address_zip: string | null
          business_hours: string | null
          business_name: string
          business_slogan: string | null
          created_at: string
          description: string | null
          document_font: string | null
          document_footer_text: string | null
          document_header_color: string | null
          document_logo_position: string | null
          document_payment_instructions: string | null
          document_terms: string | null
          document_theme_color: string | null
          email: string
          email_from_address: string | null
          email_from_name: string | null
          email_notifications_enabled: boolean | null
          email_reply_to: string | null
          email_signature: string | null
          icon_url: string | null
          id: string
          license_numbers: string | null
          logo_url: string | null
          phone: string
          service_radius: number | null
          service_radius_unit: string | null
          show_logo_in_documents: boolean | null
          show_tagline_on_documents: boolean | null
          singleton_guard: boolean | null
          updated_at: string
          website_url: string | null
          years_experience: number | null
        }
        Insert: {
          address: string
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_unit?: string | null
          address_zip?: string | null
          business_hours?: string | null
          business_name: string
          business_slogan?: string | null
          created_at?: string
          description?: string | null
          document_font?: string | null
          document_footer_text?: string | null
          document_header_color?: string | null
          document_logo_position?: string | null
          document_payment_instructions?: string | null
          document_terms?: string | null
          document_theme_color?: string | null
          email: string
          email_from_address?: string | null
          email_from_name?: string | null
          email_notifications_enabled?: boolean | null
          email_reply_to?: string | null
          email_signature?: string | null
          icon_url?: string | null
          id?: string
          license_numbers?: string | null
          logo_url?: string | null
          phone: string
          service_radius?: number | null
          service_radius_unit?: string | null
          show_logo_in_documents?: boolean | null
          show_tagline_on_documents?: boolean | null
          singleton_guard?: boolean | null
          updated_at?: string
          website_url?: string | null
          years_experience?: number | null
        }
        Update: {
          address?: string
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_unit?: string | null
          address_zip?: string | null
          business_hours?: string | null
          business_name?: string
          business_slogan?: string | null
          created_at?: string
          description?: string | null
          document_font?: string | null
          document_footer_text?: string | null
          document_header_color?: string | null
          document_logo_position?: string | null
          document_payment_instructions?: string | null
          document_terms?: string | null
          document_theme_color?: string | null
          email?: string
          email_from_address?: string | null
          email_from_name?: string | null
          email_notifications_enabled?: boolean | null
          email_reply_to?: string | null
          email_signature?: string | null
          icon_url?: string | null
          id?: string
          license_numbers?: string | null
          logo_url?: string | null
          phone?: string
          service_radius?: number | null
          service_radius_unit?: string | null
          show_logo_in_documents?: boolean | null
          show_tagline_on_documents?: boolean | null
          singleton_guard?: boolean | null
          updated_at?: string
          website_url?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      company_social_media: {
        Row: {
          created_at: string
          custom_icon_url: string | null
          custom_name: string | null
          handle: string | null
          id: string
          link: string
          outlet_type_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_icon_url?: string | null
          custom_name?: string | null
          handle?: string | null
          id?: string
          link: string
          outlet_type_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_icon_url?: string | null
          custom_name?: string | null
          handle?: string | null
          id?: string
          link?: string
          outlet_type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_social_media_outlet_type_id_fkey"
            columns: ["outlet_type_id"]
            isOneToOne: false
            referencedRelation: "social_media_outlet_types"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          account_id: string
          created_at: string
          created_by: string | null
          department: string | null
          email: string
          first_name: string
          id: string
          is_primary: boolean
          is_test_data: boolean | null
          last_name: string
          mobile: string | null
          notes: string | null
          phone: string
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          email: string
          first_name: string
          id?: string
          is_primary?: boolean
          is_test_data?: boolean | null
          last_name: string
          mobile?: string | null
          notes?: string | null
          phone: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          email?: string
          first_name?: string
          id?: string
          is_primary?: boolean
          is_test_data?: boolean | null
          last_name?: string
          mobile?: string | null
          notes?: string | null
          phone?: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      data_health_logs: {
        Row: {
          check_type: string
          checked_at: string
          checked_by: string | null
          details: Json | null
          id: string
          issues_found: number
        }
        Insert: {
          check_type: string
          checked_at?: string
          checked_by?: string | null
          details?: Json | null
          id?: string
          issues_found?: number
        }
        Update: {
          check_type?: string
          checked_at?: string
          checked_by?: string | null
          details?: Json | null
          id?: string
          issues_found?: number
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          bcc_email: string | null
          body: string
          cc_email: string | null
          created_at: string | null
          created_by: string | null
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          id: string
          sent_at: string | null
          status: string | null
          subject: string
          template_id: string | null
          to_email: string
        }
        Insert: {
          bcc_email?: string | null
          body: string
          cc_email?: string | null
          created_at?: string | null
          created_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
          subject: string
          template_id?: string | null
          to_email: string
        }
        Update: {
          bcc_email?: string | null
          body?: string
          cc_email?: string | null
          created_at?: string | null
          created_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_id?: string | null
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          category: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string
          trigger_type: string | null
          updated_at: string | null
          updated_by: string | null
          variables: Json | null
        }
        Insert: {
          body: string
          category: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          trigger_type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          variables?: Json | null
        }
        Update: {
          body?: string
          category?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          trigger_type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      email_verification_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          new_email: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          new_email: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          new_email?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      event_participants: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      form_settings: {
        Row: {
          form_heading: string | null
          form_subheading: string | null
          form_type: string
          id: string
          service_options: string[]
          submit_button_text: string | null
          success_message: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          form_heading?: string | null
          form_subheading?: string | null
          form_type?: string
          id?: string
          service_options?: string[]
          submit_button_text?: string | null
          success_message?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          form_heading?: string | null
          form_subheading?: string | null
          form_type?: string
          id?: string
          service_options?: string[]
          submit_button_text?: string | null
          success_message?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      gemini_cache_metadata: {
        Row: {
          cache_key: string
          cache_name: string
          company_id: string | null
          created_at: string | null
          expires_at: string
          id: string
          static_context_hash: string
        }
        Insert: {
          cache_key: string
          cache_name: string
          company_id?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          static_context_hash: string
        }
        Update: {
          cache_key?: string
          cache_name?: string
          company_id?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          static_context_hash?: string
        }
        Relationships: []
      }
      generated_pages: {
        Row: {
          created_at: string
          id: string
          last_viewed_at: string | null
          meta_description: string | null
          needs_regeneration: boolean
          page_title: string
          rendered_html: string | null
          service_area_id: string
          service_id: string
          status: boolean
          updated_at: string
          url_path: string
          view_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_viewed_at?: string | null
          meta_description?: string | null
          needs_regeneration?: boolean
          page_title: string
          rendered_html?: string | null
          service_area_id: string
          service_id: string
          status?: boolean
          updated_at?: string
          url_path: string
          view_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_viewed_at?: string | null
          meta_description?: string | null
          needs_regeneration?: boolean
          page_title?: string
          rendered_html?: string | null
          service_area_id?: string
          service_id?: string
          status?: boolean
          updated_at?: string
          url_path?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "generated_pages_service_area_id_fkey"
            columns: ["service_area_id"]
            isOneToOne: false
            referencedRelation: "service_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_pages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      import_history: {
        Row: {
          created_at: string | null
          created_by: string | null
          error_log: Json | null
          failed_rows: number | null
          filename: string | null
          id: string
          module: string
          settings: Json | null
          successful_rows: number | null
          total_rows: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          error_log?: Json | null
          failed_rows?: number | null
          filename?: string | null
          id?: string
          module: string
          settings?: Json | null
          successful_rows?: number | null
          total_rows?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          error_log?: Json | null
          failed_rows?: number | null
          filename?: string | null
          id?: string
          module?: string
          settings?: Json | null
          successful_rows?: number | null
          total_rows?: number | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          invoice_id: string
          item_order: number
          quantity: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          item_order?: number
          quantity?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          item_order?: number
          quantity?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          account_id: string
          created_at: string
          created_by: string
          due_date: string
          id: string
          invoice_number: string
          is_test_data: boolean | null
          last_sent_at: string | null
          pdf_url: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          created_by: string
          due_date: string
          id?: string
          invoice_number: string
          is_test_data?: boolean | null
          last_sent_at?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          total_amount: number
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          created_by?: string
          due_date?: string
          id?: string
          invoice_number?: string
          is_test_data?: boolean | null
          last_sent_at?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_articles: {
        Row: {
          category_id: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category_id?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category_id?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "kb_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      lead_submission_rate_limit: {
        Row: {
          blocked_until: string | null
          created_at: string
          first_submission_at: string
          id: string
          ip_address: string
          last_submission_at: string
          submission_count: number
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string
          first_submission_at?: string
          id?: string
          ip_address: string
          last_submission_at?: string
          submission_count?: number
        }
        Update: {
          blocked_until?: string | null
          created_at?: string
          first_submission_at?: string
          id?: string
          ip_address?: string
          last_submission_at?: string
          submission_count?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          city: string
          city_context: string | null
          converted_account_id: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          is_emergency: boolean
          is_test_data: boolean | null
          last_name: string
          lead_source: string | null
          originating_url: string | null
          phone: string
          project_details: string | null
          service_id: string | null
          service_needed: string
          source: string | null
          state: string
          status: Database["public"]["Enums"]["lead_status"]
          street_address: string
          unit: string | null
          updated_at: string
          zip: string
        }
        Insert: {
          assigned_to?: string | null
          city: string
          city_context?: string | null
          converted_account_id?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_emergency?: boolean
          is_test_data?: boolean | null
          last_name: string
          lead_source?: string | null
          originating_url?: string | null
          phone: string
          project_details?: string | null
          service_id?: string | null
          service_needed: string
          source?: string | null
          state: string
          status?: Database["public"]["Enums"]["lead_status"]
          street_address: string
          unit?: string | null
          updated_at?: string
          zip: string
        }
        Update: {
          assigned_to?: string | null
          city?: string
          city_context?: string | null
          converted_account_id?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_emergency?: boolean
          is_test_data?: boolean | null
          last_name?: string
          lead_source?: string | null
          originating_url?: string | null
          phone?: string
          project_details?: string | null
          service_id?: string | null
          service_needed?: string
          source?: string | null
          state?: string
          status?: Database["public"]["Enums"]["lead_status"]
          street_address?: string
          unit?: string | null
          updated_at?: string
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_converted_account"
            columns: ["converted_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: unknown
          lockout_until: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: unknown
          lockout_until?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: unknown
          lockout_until?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          is_pinned: boolean | null
          related_to_id: string
          related_to_type: Database["public"]["Enums"]["related_entity_type"]
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_pinned?: boolean | null
          related_to_id: string
          related_to_type: Database["public"]["Enums"]["related_entity_type"]
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_pinned?: boolean | null
          related_to_id?: string
          related_to_type?: Database["public"]["Enums"]["related_entity_type"]
          updated_at?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          event_type: string
          id: string
          template_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          event_type: string
          id?: string
          template_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          event_type?: string
          id?: string
          template_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      page_edit_history: {
        Row: {
          ai_command: string
          created_at: string | null
          edit_description: string | null
          edited_by: string
          id: string
          new_content: string
          page_id: string
          page_type: string
          previous_content: string
        }
        Insert: {
          ai_command: string
          created_at?: string | null
          edit_description?: string | null
          edited_by: string
          id?: string
          new_content: string
          page_id: string
          page_type: string
          previous_content: string
        }
        Update: {
          ai_command?: string
          created_at?: string | null
          edit_description?: string | null
          edited_by?: string
          id?: string
          new_content?: string
          page_id?: string
          page_type?: string
          previous_content?: string
        }
        Relationships: []
      }
      page_seo: {
        Row: {
          canonical_url: string | null
          change_frequency: string | null
          created_at: string | null
          custom_head_tags: string | null
          id: string
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          og_description: string | null
          og_image: string | null
          og_title: string | null
          page_id: string | null
          page_type: string
          priority: number | null
          robots_directives: string | null
          schema_markup: string | null
          twitter_card_type: string | null
          updated_at: string | null
        }
        Insert: {
          canonical_url?: string | null
          change_frequency?: string | null
          created_at?: string | null
          custom_head_tags?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          page_id?: string | null
          page_type: string
          priority?: number | null
          robots_directives?: string | null
          schema_markup?: string | null
          twitter_card_type?: string | null
          updated_at?: string | null
        }
        Update: {
          canonical_url?: string | null
          change_frequency?: string | null
          created_at?: string | null
          custom_head_tags?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          page_id?: string | null
          page_type?: string
          priority?: number | null
          robots_directives?: string | null
          schema_markup?: string | null
          twitter_card_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          module: string
          name: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          module: string
          name: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          module?: string
          name?: string
        }
        Relationships: []
      }
      pipeline_state: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          model: string | null
          pipeline_id: string
          stage_name: string
          stage_number: number
          stage_result: Json
          static_context: string | null
          updated_at: string | null
          user_id: string
          user_request: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          model?: string | null
          pipeline_id: string
          stage_name: string
          stage_number: number
          stage_result: Json
          static_context?: string | null
          updated_at?: string | null
          user_id: string
          user_request?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          model?: string | null
          pipeline_id?: string
          stage_name?: string
          stage_number?: number
          stage_result?: Json
          static_context?: string | null
          updated_at?: string | null
          user_id?: string
          user_request?: string | null
        }
        Relationships: []
      }
      project_phases: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          phase_name: string
          phase_order: number | null
          project_id: string
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          phase_name: string
          phase_order?: number | null
          project_id: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          phase_name?: string
          phase_order?: number | null
          project_id?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          account_id: string
          actual_completion: string | null
          budget: number | null
          created_at: string
          created_by: string | null
          description: string | null
          estimated_completion: string | null
          id: string
          is_test_data: boolean | null
          project_manager: string | null
          project_name: string
          source_lead_id: string | null
          spent: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          account_id: string
          actual_completion?: string | null
          budget?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_completion?: string | null
          id?: string
          is_test_data?: boolean | null
          project_manager?: string | null
          project_name: string
          source_lead_id?: string | null
          spent?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          actual_completion?: string | null
          budget?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_completion?: string | null
          id?: string
          is_test_data?: boolean | null
          project_manager?: string | null
          project_name?: string
          source_lead_id?: string | null
          spent?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_source_lead_id_fkey"
            columns: ["source_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_test_submissions: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          result: string
          test_data: Json | null
          test_type: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          result: string
          test_data?: Json | null
          test_type: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          result?: string
          test_data?: Json | null
          test_type?: string
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          item_order: number
          quantity: number
          quote_id: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          id?: string
          item_order?: number
          quantity?: number
          quote_id: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          item_order?: number
          quantity?: number
          quote_id?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          account_id: string
          created_at: string
          created_by: string
          id: string
          is_test_data: boolean | null
          last_sent_at: string | null
          pdf_url: string | null
          quote_number: string
          status: Database["public"]["Enums"]["quote_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          created_by: string
          id?: string
          is_test_data?: boolean | null
          last_sent_at?: string | null
          pdf_url?: string | null
          quote_number: string
          status?: Database["public"]["Enums"]["quote_status"]
          total_amount: number
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          created_by?: string
          id?: string
          is_test_data?: boolean | null
          last_sent_at?: string | null
          pdf_url?: string | null
          quote_number?: string
          status?: Database["public"]["Enums"]["quote_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      redirects: {
        Row: {
          created_at: string | null
          from_path: string
          hit_count: number | null
          id: string
          is_active: boolean | null
          redirect_type: number | null
          to_path: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          from_path: string
          hit_count?: number | null
          id?: string
          is_active?: boolean | null
          redirect_type?: number | null
          to_path: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          from_path?: string
          hit_count?: number | null
          id?: string
          is_active?: boolean | null
          redirect_type?: number | null
          to_path?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      report_executions: {
        Row: {
          executed_at: string | null
          executed_by: string | null
          execution_time_ms: number | null
          id: string
          report_id: string | null
          result_count: number | null
        }
        Insert: {
          executed_at?: string | null
          executed_by?: string | null
          execution_time_ms?: number | null
          id?: string
          report_id?: string | null
          result_count?: number | null
        }
        Update: {
          executed_at?: string | null
          executed_by?: string | null
          execution_time_ms?: number | null
          id?: string
          report_id?: string | null
          result_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "report_executions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          chart_config: Json | null
          created_at: string | null
          created_by: string | null
          data_source: string
          description: string | null
          filters: Json | null
          grouping: Json | null
          id: string
          is_pinned: boolean | null
          is_public: boolean | null
          is_scheduled: boolean | null
          name: string
          pin_order: number | null
          schedule_frequency: string | null
          schedule_recipients: string[] | null
          selected_fields: Json
          shared_with: string[] | null
          updated_at: string | null
          visualization_type: string
        }
        Insert: {
          chart_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          data_source: string
          description?: string | null
          filters?: Json | null
          grouping?: Json | null
          id?: string
          is_pinned?: boolean | null
          is_public?: boolean | null
          is_scheduled?: boolean | null
          name: string
          pin_order?: number | null
          schedule_frequency?: string | null
          schedule_recipients?: string[] | null
          selected_fields: Json
          shared_with?: string[] | null
          updated_at?: string | null
          visualization_type: string
        }
        Update: {
          chart_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          data_source?: string
          description?: string | null
          filters?: Json | null
          grouping?: Json | null
          id?: string
          is_pinned?: boolean | null
          is_public?: boolean | null
          is_scheduled?: boolean | null
          name?: string
          pin_order?: number | null
          schedule_frequency?: string | null
          schedule_recipients?: string[] | null
          selected_fields?: Json
          shared_with?: string[] | null
          updated_at?: string | null
          visualization_type?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          account_id: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          customer_location: string | null
          customer_name: string
          display_on_website: boolean | null
          external_url: string | null
          featured: boolean | null
          flag_reason: string | null
          id: string
          is_flagged: boolean | null
          photo_url: string | null
          project_id: string | null
          rating: number
          response_at: string | null
          response_by: string | null
          response_text: string | null
          review_text: string
          review_title: string
          service_id: string | null
          source: Database["public"]["Enums"]["review_source"]
          status: Database["public"]["Enums"]["review_status"]
          submitted_at: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          customer_location?: string | null
          customer_name: string
          display_on_website?: boolean | null
          external_url?: string | null
          featured?: boolean | null
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          photo_url?: string | null
          project_id?: string | null
          rating: number
          response_at?: string | null
          response_by?: string | null
          response_text?: string | null
          review_text: string
          review_title: string
          service_id?: string | null
          source?: Database["public"]["Enums"]["review_source"]
          status?: Database["public"]["Enums"]["review_status"]
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          customer_location?: string | null
          customer_name?: string
          display_on_website?: boolean | null
          external_url?: string | null
          featured?: boolean | null
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          photo_url?: string | null
          project_id?: string | null
          rating?: number
          response_at?: string | null
          response_by?: string | null
          response_text?: string | null
          review_text?: string
          review_title?: string
          service_id?: string | null
          source?: Database["public"]["Enums"]["review_source"]
          status?: Database["public"]["Enums"]["review_status"]
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_system_role: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_views: {
        Row: {
          created_at: string | null
          filters: Json
          id: string
          is_default: boolean | null
          module: string
          updated_at: string | null
          user_id: string
          view_name: string
        }
        Insert: {
          created_at?: string | null
          filters: Json
          id?: string
          is_default?: boolean | null
          module: string
          updated_at?: string | null
          user_id: string
          view_name: string
        }
        Update: {
          created_at?: string | null
          filters?: Json
          id?: string
          is_default?: boolean | null
          module?: string
          updated_at?: string | null
          user_id?: string
          view_name?: string
        }
        Relationships: []
      }
      scheduled_exports: {
        Row: {
          created_at: string
          created_by: string | null
          filters: Json | null
          format: string
          id: string
          is_active: boolean
          last_run: string | null
          module: string
          name: string
          next_run: string | null
          schedule: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          filters?: Json | null
          format: string
          id?: string
          is_active?: boolean
          last_run?: string | null
          module: string
          name: string
          next_run?: string | null
          schedule: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          filters?: Json | null
          format?: string
          id?: string
          is_active?: boolean
          last_run?: string | null
          module?: string
          name?: string
          next_run?: string | null
          schedule?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          created_at: string
          details: Json | null
          event_category: string
          event_type: string
          id: string
          ip_address: unknown
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_category: string
          event_type: string
          id?: string
          ip_address?: unknown
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_category?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      seo_redirects: {
        Row: {
          created_at: string | null
          from_path: string
          hit_count: number | null
          id: string
          is_active: boolean | null
          redirect_type: number | null
          to_path: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          from_path: string
          hit_count?: number | null
          id?: string
          is_active?: boolean | null
          redirect_type?: number | null
          to_path: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          from_path?: string
          hit_count?: number | null
          id?: string
          is_active?: boolean | null
          redirect_type?: number | null
          to_path?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      seo_settings: {
        Row: {
          business_address: string | null
          business_city: string | null
          business_email: string | null
          business_hours: Json | null
          business_name: string | null
          business_phone: string | null
          business_state: string | null
          business_zip: string | null
          created_at: string | null
          default_meta_description: string | null
          default_meta_keywords: string | null
          default_meta_title: string | null
          default_og_image: string | null
          facebook_pixel_id: string | null
          google_analytics_id: string | null
          google_tag_manager_id: string | null
          id: string
          robots_txt: string | null
          schema_org_defaults: Json | null
          sitemap_settings: Json | null
          twitter_handle: string | null
          updated_at: string | null
        }
        Insert: {
          business_address?: string | null
          business_city?: string | null
          business_email?: string | null
          business_hours?: Json | null
          business_name?: string | null
          business_phone?: string | null
          business_state?: string | null
          business_zip?: string | null
          created_at?: string | null
          default_meta_description?: string | null
          default_meta_keywords?: string | null
          default_meta_title?: string | null
          default_og_image?: string | null
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          google_tag_manager_id?: string | null
          id?: string
          robots_txt?: string | null
          schema_org_defaults?: Json | null
          sitemap_settings?: Json | null
          twitter_handle?: string | null
          updated_at?: string | null
        }
        Update: {
          business_address?: string | null
          business_city?: string | null
          business_email?: string | null
          business_hours?: Json | null
          business_name?: string | null
          business_phone?: string | null
          business_state?: string | null
          business_zip?: string | null
          created_at?: string | null
          default_meta_description?: string | null
          default_meta_keywords?: string | null
          default_meta_title?: string | null
          default_og_image?: string | null
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          google_tag_manager_id?: string | null
          id?: string
          robots_txt?: string | null
          schema_org_defaults?: Json | null
          sitemap_settings?: Json | null
          twitter_handle?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      seo_templates: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          meta_description_pattern: string | null
          meta_title_pattern: string | null
          og_description_pattern: string | null
          og_title_pattern: string | null
          schema_template: string | null
          template_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          meta_description_pattern?: string | null
          meta_title_pattern?: string | null
          og_description_pattern?: string | null
          og_title_pattern?: string | null
          schema_template?: string | null
          template_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          meta_description_pattern?: string | null
          meta_title_pattern?: string | null
          og_description_pattern?: string | null
          og_title_pattern?: string | null
          schema_template?: string | null
          template_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      service_area_services: {
        Row: {
          completion_time: string | null
          created_at: string
          customer_count: number | null
          id: string
          is_active: boolean
          local_benefits: string[] | null
          local_description: string | null
          local_examples: string | null
          local_keywords: string[] | null
          meta_description_override: string | null
          meta_title_override: string | null
          pricing_notes: string | null
          response_time: string | null
          service_area_id: string
          service_id: string
          special_considerations: string | null
          updated_at: string | null
        }
        Insert: {
          completion_time?: string | null
          created_at?: string
          customer_count?: number | null
          id?: string
          is_active?: boolean
          local_benefits?: string[] | null
          local_description?: string | null
          local_examples?: string | null
          local_keywords?: string[] | null
          meta_description_override?: string | null
          meta_title_override?: string | null
          pricing_notes?: string | null
          response_time?: string | null
          service_area_id: string
          service_id: string
          special_considerations?: string | null
          updated_at?: string | null
        }
        Update: {
          completion_time?: string | null
          created_at?: string
          customer_count?: number | null
          id?: string
          is_active?: boolean
          local_benefits?: string[] | null
          local_description?: string | null
          local_examples?: string | null
          local_keywords?: string[] | null
          meta_description_override?: string | null
          meta_title_override?: string | null
          pricing_notes?: string | null
          response_time?: string | null
          service_area_id?: string
          service_id?: string
          special_considerations?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_area_services_service_area_id_fkey"
            columns: ["service_area_id"]
            isOneToOne: false
            referencedRelation: "service_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_area_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_areas: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          archived_by: string | null
          area_name: string | null
          city_name: string
          city_slug: string
          created_at: string
          display_name: string
          id: string
          is_default: boolean
          local_description: string | null
          state: string
          status: boolean
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          area_name?: string | null
          city_name: string
          city_slug: string
          created_at?: string
          display_name: string
          id?: string
          is_default?: boolean
          local_description?: string | null
          state?: string
          status?: boolean
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          area_name?: string | null
          city_name?: string
          city_slug?: string
          created_at?: string
          display_name?: string
          id?: string
          is_default?: boolean
          local_description?: string | null
          state?: string
          status?: boolean
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          archived_by: string | null
          category: Database["public"]["Enums"]["service_category"]
          content_focus: string | null
          created_at: string
          features: Json | null
          full_description: string | null
          id: string
          is_active: boolean
          is_emergency: boolean | null
          name: string
          primary_cta_type: string | null
          seo_keywords: Json | null
          short_description: string | null
          slug: string
          starting_price: number | null
          target_word_count: number | null
          template_id: string | null
          template_path: string | null
          updated_at: string
          urgency_level: string | null
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          category: Database["public"]["Enums"]["service_category"]
          content_focus?: string | null
          created_at?: string
          features?: Json | null
          full_description?: string | null
          id?: string
          is_active?: boolean
          is_emergency?: boolean | null
          name: string
          primary_cta_type?: string | null
          seo_keywords?: Json | null
          short_description?: string | null
          slug: string
          starting_price?: number | null
          target_word_count?: number | null
          template_id?: string | null
          template_path?: string | null
          updated_at?: string
          urgency_level?: string | null
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          category?: Database["public"]["Enums"]["service_category"]
          content_focus?: string | null
          created_at?: string
          features?: Json | null
          full_description?: string | null
          id?: string
          is_active?: boolean
          is_emergency?: boolean | null
          name?: string
          primary_cta_type?: string | null
          seo_keywords?: Json | null
          short_description?: string | null
          slug?: string
          starting_price?: number | null
          target_word_count?: number | null
          template_id?: string | null
          template_path?: string | null
          updated_at?: string
          urgency_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          accent_color: string
          bg_primary_color: string | null
          bg_secondary_color: string | null
          bg_tertiary_color: string | null
          border_color: string | null
          button_border_radius: number
          card_bg_color: string | null
          card_border_radius: number
          cta_color: string | null
          danger_color: string | null
          feature_color: string | null
          footer_bg_color: string
          footer_logo_size: number
          footer_text_color: string
          header_bg_color: string
          header_border_color: string
          header_logo_size: number
          icon_background_padding: number | null
          icon_background_style: string | null
          icon_stroke_width: number | null
          id: string
          info_color: string | null
          primary_color: string
          reviews_allow_photos: boolean | null
          reviews_default_sort: string | null
          reviews_enabled: boolean | null
          reviews_min_rating: number | null
          reviews_per_page: number | null
          reviews_require_approval: boolean | null
          reviews_show_last_name: boolean | null
          reviews_spam_filter_enabled: boolean | null
          secondary_color: string
          show_social_links: boolean
          social_border_style: string
          social_icon_custom_color: string | null
          social_icon_size: number
          social_icon_style: string
          success_color: string | null
          text_muted_color: string | null
          text_primary_color: string | null
          text_secondary_color: string | null
          updated_at: string
          updated_by: string | null
          use_standard_social_logos: boolean | null
          warning_color: string | null
        }
        Insert: {
          accent_color?: string
          bg_primary_color?: string | null
          bg_secondary_color?: string | null
          bg_tertiary_color?: string | null
          border_color?: string | null
          button_border_radius?: number
          card_bg_color?: string | null
          card_border_radius?: number
          cta_color?: string | null
          danger_color?: string | null
          feature_color?: string | null
          footer_bg_color?: string
          footer_logo_size?: number
          footer_text_color?: string
          header_bg_color?: string
          header_border_color?: string
          header_logo_size?: number
          icon_background_padding?: number | null
          icon_background_style?: string | null
          icon_stroke_width?: number | null
          id?: string
          info_color?: string | null
          primary_color?: string
          reviews_allow_photos?: boolean | null
          reviews_default_sort?: string | null
          reviews_enabled?: boolean | null
          reviews_min_rating?: number | null
          reviews_per_page?: number | null
          reviews_require_approval?: boolean | null
          reviews_show_last_name?: boolean | null
          reviews_spam_filter_enabled?: boolean | null
          secondary_color?: string
          show_social_links?: boolean
          social_border_style?: string
          social_icon_custom_color?: string | null
          social_icon_size?: number
          social_icon_style?: string
          success_color?: string | null
          text_muted_color?: string | null
          text_primary_color?: string | null
          text_secondary_color?: string | null
          updated_at?: string
          updated_by?: string | null
          use_standard_social_logos?: boolean | null
          warning_color?: string | null
        }
        Update: {
          accent_color?: string
          bg_primary_color?: string | null
          bg_secondary_color?: string | null
          bg_tertiary_color?: string | null
          border_color?: string | null
          button_border_radius?: number
          card_bg_color?: string | null
          card_border_radius?: number
          cta_color?: string | null
          danger_color?: string | null
          feature_color?: string | null
          footer_bg_color?: string
          footer_logo_size?: number
          footer_text_color?: string
          header_bg_color?: string
          header_border_color?: string
          header_logo_size?: number
          icon_background_padding?: number | null
          icon_background_style?: string | null
          icon_stroke_width?: number | null
          id?: string
          info_color?: string | null
          primary_color?: string
          reviews_allow_photos?: boolean | null
          reviews_default_sort?: string | null
          reviews_enabled?: boolean | null
          reviews_min_rating?: number | null
          reviews_per_page?: number | null
          reviews_require_approval?: boolean | null
          reviews_show_last_name?: boolean | null
          reviews_spam_filter_enabled?: boolean | null
          secondary_color?: string
          show_social_links?: boolean
          social_border_style?: string
          social_icon_custom_color?: string | null
          social_icon_size?: number
          social_icon_style?: string
          success_color?: string | null
          text_muted_color?: string | null
          text_primary_color?: string | null
          text_secondary_color?: string | null
          updated_at?: string
          updated_by?: string | null
          use_standard_social_logos?: boolean | null
          warning_color?: string | null
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string
          display_order: number
          id: string
          platform: string
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          platform: string
          url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          platform?: string
          url?: string
        }
        Relationships: []
      }
      social_media_outlet_types: {
        Row: {
          created_at: string
          icon_svg: string | null
          icon_url: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          icon_svg?: string | null
          icon_url: string
          id: string
          name: string
        }
        Update: {
          created_at?: string
          icon_svg?: string | null
          icon_url?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      static_pages: {
        Row: {
          archived: boolean
          content_html: string
          content_html_draft: string | null
          created_at: string
          created_by: string | null
          display_order: number | null
          id: string
          is_homepage: boolean | null
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          parent_page_id: string | null
          published_at: string | null
          show_in_menu: boolean | null
          slug: string
          status: boolean | null
          title: string
          updated_at: string
          updated_by: string | null
          url_path: string
        }
        Insert: {
          archived?: boolean
          content_html: string
          content_html_draft?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_homepage?: boolean | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          parent_page_id?: string | null
          published_at?: string | null
          show_in_menu?: boolean | null
          slug: string
          status?: boolean | null
          title: string
          updated_at?: string
          updated_by?: string | null
          url_path: string
        }
        Update: {
          archived?: boolean
          content_html?: string
          content_html_draft?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_homepage?: boolean | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          parent_page_id?: string | null
          published_at?: string | null
          show_in_menu?: boolean | null
          slug?: string
          status?: boolean | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          url_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "static_pages_parent_page_id_fkey"
            columns: ["parent_page_id"]
            isOneToOne: false
            referencedRelation: "static_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          is_test_data: boolean | null
          priority: Database["public"]["Enums"]["task_priority"]
          related_to_id: string | null
          related_to_type:
            | Database["public"]["Enums"]["related_entity_type"]
            | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_test_data?: boolean | null
          priority?: Database["public"]["Enums"]["task_priority"]
          related_to_id?: string | null
          related_to_type?:
            | Database["public"]["Enums"]["related_entity_type"]
            | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_test_data?: boolean | null
          priority?: Database["public"]["Enums"]["task_priority"]
          related_to_id?: string | null
          related_to_type?:
            | Database["public"]["Enums"]["related_entity_type"]
            | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          invite_expires_at: string
          invite_token: string
          invited_by: string | null
          job_title: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          invite_expires_at: string
          invite_token: string
          invited_by?: string | null
          job_title?: string | null
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          invite_expires_at?: string
          invite_token?: string
          invited_by?: string | null
          job_title?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          created_at: string
          id: string
          name: string
          published_at: string | null
          template_html: string
          template_html_draft: string | null
          template_type: Database["public"]["Enums"]["template_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          published_at?: string | null
          template_html: string
          template_html_draft?: string | null
          template_type: Database["public"]["Enums"]["template_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          published_at?: string | null
          template_html?: string
          template_html_draft?: string | null
          template_type?: Database["public"]["Enums"]["template_type"]
          updated_at?: string
        }
        Relationships: []
      }
      test_table: {
        Row: {
          created_at: string
          id: string
          test_one: string
          test_three: string
          test_two: string
        }
        Insert: {
          created_at?: string
          id?: string
          test_one: string
          test_three: string
          test_two: string
        }
        Update: {
          created_at?: string
          id?: string
          test_one?: string
          test_three?: string
          test_two?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          is_internal_note: boolean | null
          message: string
          read_at: string | null
          sender_id: string
          ticket_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal_note?: boolean | null
          message: string
          read_at?: string | null
          sender_id: string
          ticket_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal_note?: boolean | null
          message?: string
          read_at?: string | null
          sender_id?: string
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_templates: {
        Row: {
          category: Database["public"]["Enums"]["ticket_category"]
          created_at: string
          default_assignee: string | null
          id: string
          message_template: string
          name: string
          priority: Database["public"]["Enums"]["priority_level"]
          subject_template: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          default_assignee?: string | null
          id?: string
          message_template: string
          name: string
          priority?: Database["public"]["Enums"]["priority_level"]
          subject_template: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          default_assignee?: string | null
          id?: string
          message_template?: string
          name?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          subject_template?: string
          updated_at?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          account_id: string
          assigned_to: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          closed_at: string | null
          created_at: string
          id: string
          invoice_id: string | null
          last_message_at: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          project_id: string | null
          resolved_at: string | null
          satisfaction_comment: string | null
          satisfaction_rating: number | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          unread_by_agent: boolean | null
          unread_by_customer: boolean | null
          updated_at: string
        }
        Insert: {
          account_id: string
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          closed_at?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          last_message_at?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id?: string | null
          resolved_at?: string | null
          satisfaction_comment?: string | null
          satisfaction_rating?: number | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          unread_by_agent?: boolean | null
          unread_by_customer?: boolean | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          closed_at?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          last_message_at?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id?: string | null
          resolved_at?: string | null
          satisfaction_comment?: string | null
          satisfaction_rating?: number | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          ticket_number?: string
          unread_by_agent?: boolean | null
          unread_by_customer?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          module: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          ai_editor_preferences: Json | null
          created_at: string
          id: string
          sidebar_state: Json | null
          updated_at: string
          use_test_webhook: boolean
          user_id: string
        }
        Insert: {
          ai_editor_preferences?: Json | null
          created_at?: string
          id?: string
          sidebar_state?: Json | null
          updated_at?: string
          use_test_webhook?: boolean
          user_id: string
        }
        Update: {
          ai_editor_preferences?: Json | null
          created_at?: string
          id?: string
          sidebar_state?: Json | null
          updated_at?: string
          use_test_webhook?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          full_name: string
          id: string
          job_title: string | null
          last_login_at: string | null
          last_name: string | null
          phone: string | null
          require_password_change: boolean | null
          status: string
          two_factor_backup_codes: string | null
          two_factor_enabled: boolean | null
          two_factor_enabled_at: string | null
          two_factor_salt: string | null
          two_factor_secret: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name: string
          id: string
          job_title?: string | null
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          require_password_change?: boolean | null
          status?: string
          two_factor_backup_codes?: string | null
          two_factor_enabled?: boolean | null
          two_factor_enabled_at?: string | null
          two_factor_salt?: string | null
          two_factor_secret?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string
          id?: string
          job_title?: string | null
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          require_password_change?: boolean | null
          status?: string
          two_factor_backup_codes?: string | null
          two_factor_enabled?: boolean | null
          two_factor_enabled_at?: string | null
          two_factor_salt?: string | null
          two_factor_secret?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
          last_activity: string
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown
          last_activity?: string
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          last_activity?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          password_hash: string
          related_customer_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          password_hash: string
          related_customer_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          password_hash?: string
          related_customer_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_related_customer"
            columns: ["related_customer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_actions: {
        Row: {
          action_config: Json
          action_type: Database["public"]["Enums"]["workflow_action_type"]
          created_at: string | null
          delay_minutes: number | null
          execution_order: number
          id: string
          workflow_id: string | null
        }
        Insert: {
          action_config: Json
          action_type: Database["public"]["Enums"]["workflow_action_type"]
          created_at?: string | null
          delay_minutes?: number | null
          execution_order: number
          id?: string
          workflow_id?: string | null
        }
        Update: {
          action_config?: Json
          action_type?: Database["public"]["Enums"]["workflow_action_type"]
          created_at?: string | null
          delay_minutes?: number | null
          execution_order?: number
          id?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_actions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          error_message: string | null
          execution_data: Json | null
          id: string
          started_at: string | null
          status:
            | Database["public"]["Enums"]["workflow_execution_status"]
            | null
          trigger_module: string | null
          trigger_record_id: string | null
          workflow_id: string | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          execution_data?: Json | null
          id?: string
          started_at?: string | null
          status?:
            | Database["public"]["Enums"]["workflow_execution_status"]
            | null
          trigger_module?: string | null
          trigger_record_id?: string | null
          workflow_id?: string | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          execution_data?: Json | null
          id?: string
          started_at?: string | null
          status?:
            | Database["public"]["Enums"]["workflow_execution_status"]
            | null
          trigger_module?: string | null
          trigger_record_id?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          trigger_conditions: Json | null
          trigger_module: string | null
          trigger_type: Database["public"]["Enums"]["workflow_trigger_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_conditions?: Json | null
          trigger_module?: string | null
          trigger_type: Database["public"]["Enums"]["workflow_trigger_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_conditions?: Json | null
          trigger_module?: string | null
          trigger_type?: Database["public"]["Enums"]["workflow_trigger_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      user_role_cache: {
        Row: {
          is_system_role: boolean | null
          role_id: string | null
          role_name: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auth_has_role: { Args: { _role_names: string[] }; Returns: boolean }
      cleanup_expired_pipeline_states: { Args: never; Returns: undefined }
      generate_ticket_number: { Args: never; Returns: string }
      get_assignable_users: {
        Args: never
        Returns: {
          role_name: string
          user_id: string
        }[]
      }
      get_security_setting: { Args: { key: string }; Returns: Json }
      get_user_permissions: {
        Args: { _user_id: string }
        Returns: {
          action: string
          module: string
          permission_name: string
        }[]
      }
      is_user_locked_out: { Args: { user_email: string }; Returns: boolean }
      refresh_role_cache: { Args: never; Returns: undefined }
      rpc_get_current_user_role: { Args: never; Returns: string }
    }
    Enums: {
      account_status: "active" | "inactive" | "archived"
      activity_action:
        | "created"
        | "updated"
        | "deleted"
        | "status_changed"
        | "converted"
      appointment_status: "scheduled" | "completed" | "canceled" | "requested"
      appointment_type: "onsite" | "virtual" | "phone"
      invoice_status: "pending" | "paid" | "overdue" | "cancelled"
      lead_status: "new" | "contacted" | "qualified" | "converted" | "lost"
      priority_level: "low" | "medium" | "high" | "urgent"
      project_status:
        | "planning"
        | "active"
        | "completed"
        | "on_hold"
        | "cancelled"
      quote_status: "draft" | "sent" | "accepted" | "declined" | "expired"
      related_entity_type:
        | "lead"
        | "account"
        | "project"
        | "contact"
        | "task"
        | "appointment"
        | "quote"
        | "invoice"
      review_source: "portal" | "email" | "manual" | "google" | "facebook"
      review_status: "pending" | "approved" | "rejected" | "archived"
      service_category:
        | "Authority Hub"
        | "Emergency Services"
        | "Granular Services"
      task_priority: "low" | "medium" | "high"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
      template_type: "service" | "static"
      ticket_category: "support" | "billing" | "project" | "general"
      ticket_status: "new" | "open" | "pending" | "resolved" | "closed"
      user_role: "admin" | "crm_user" | "customer"
      workflow_action_type:
        | "send_email"
        | "update_field"
        | "create_task"
        | "create_note"
        | "assign_to_user"
        | "add_tag"
        | "webhook"
      workflow_execution_status: "pending" | "running" | "completed" | "failed"
      workflow_trigger_type:
        | "record_created"
        | "record_updated"
        | "field_changed"
        | "time_based"
        | "form_submitted"
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
    Enums: {
      account_status: ["active", "inactive", "archived"],
      activity_action: [
        "created",
        "updated",
        "deleted",
        "status_changed",
        "converted",
      ],
      appointment_status: ["scheduled", "completed", "canceled", "requested"],
      appointment_type: ["onsite", "virtual", "phone"],
      invoice_status: ["pending", "paid", "overdue", "cancelled"],
      lead_status: ["new", "contacted", "qualified", "converted", "lost"],
      priority_level: ["low", "medium", "high", "urgent"],
      project_status: [
        "planning",
        "active",
        "completed",
        "on_hold",
        "cancelled",
      ],
      quote_status: ["draft", "sent", "accepted", "declined", "expired"],
      related_entity_type: [
        "lead",
        "account",
        "project",
        "contact",
        "task",
        "appointment",
        "quote",
        "invoice",
      ],
      review_source: ["portal", "email", "manual", "google", "facebook"],
      review_status: ["pending", "approved", "rejected", "archived"],
      service_category: [
        "Authority Hub",
        "Emergency Services",
        "Granular Services",
      ],
      task_priority: ["low", "medium", "high"],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
      template_type: ["service", "static"],
      ticket_category: ["support", "billing", "project", "general"],
      ticket_status: ["new", "open", "pending", "resolved", "closed"],
      user_role: ["admin", "crm_user", "customer"],
      workflow_action_type: [
        "send_email",
        "update_field",
        "create_task",
        "create_note",
        "assign_to_user",
        "add_tag",
        "webhook",
      ],
      workflow_execution_status: ["pending", "running", "completed", "failed"],
      workflow_trigger_type: [
        "record_created",
        "record_updated",
        "field_changed",
        "time_based",
        "form_submitted",
      ],
    },
  },
} as const
