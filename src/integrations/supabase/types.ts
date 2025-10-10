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
          created_at: string
          entity_id: string
          entity_name: string | null
          entity_type: string
          id: string
          metadata: Json | null
          parent_entity_id: string | null
          parent_entity_type: string | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["activity_action"]
          changes?: Json | null
          created_at?: string
          entity_id: string
          entity_name?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          parent_entity_id?: string | null
          parent_entity_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["activity_action"]
          changes?: Json | null
          created_at?: string
          entity_id?: string
          entity_name?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          parent_entity_id?: string | null
          parent_entity_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      company_settings: {
        Row: {
          address: string
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
          email: string
          icon_url: string | null
          id: string
          logo_url: string | null
          phone: string
          show_tagline_on_documents: boolean | null
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          address: string
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
          email: string
          icon_url?: string | null
          id?: string
          logo_url?: string | null
          phone: string
          show_tagline_on_documents?: boolean | null
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          address?: string
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
          email?: string
          icon_url?: string | null
          id?: string
          logo_url?: string | null
          phone?: string
          show_tagline_on_documents?: boolean | null
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: []
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
          updated_at?: string | null
          updated_by?: string | null
          variables?: Json | null
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
      leads: {
        Row: {
          assigned_to: string | null
          city: string
          converted_account_id: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          is_emergency: boolean
          last_name: string
          phone: string
          project_details: string | null
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
          converted_account_id?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_emergency?: boolean
          last_name: string
          phone: string
          project_details?: string | null
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
          converted_account_id?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_emergency?: boolean
          last_name?: string
          phone?: string
          project_details?: string | null
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
        ]
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
        Relationships: [
          {
            foreignKeyName: "notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      service_area_services: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          service_area_id: string
          service_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          service_area_id: string
          service_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          service_area_id?: string
          service_id?: string
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
          city_name: string
          city_slug: string
          created_at: string
          display_name: string
          id: string
          local_description: string | null
          status: boolean
          updated_at: string
        }
        Insert: {
          city_name: string
          city_slug: string
          created_at?: string
          display_name: string
          id?: string
          local_description?: string | null
          status?: boolean
          updated_at?: string
        }
        Update: {
          city_name?: string
          city_slug?: string
          created_at?: string
          display_name?: string
          id?: string
          local_description?: string | null
          status?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category: Database["public"]["Enums"]["service_category"]
          created_at: string
          full_description: string | null
          id: string
          name: string
          slug: string
          starting_price: number | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["service_category"]
          created_at?: string
          full_description?: string | null
          id?: string
          name: string
          slug: string
          starting_price?: number | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["service_category"]
          created_at?: string
          full_description?: string | null
          id?: string
          name?: string
          slug?: string
          starting_price?: number | null
          template_id?: string | null
          updated_at?: string
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
          button_border_radius: number
          card_border_radius: number
          footer_bg_color: string
          footer_logo_size: number
          footer_text_color: string
          header_bg_color: string
          header_border_color: string
          header_logo_size: number
          id: string
          primary_color: string
          secondary_color: string
          show_social_links: boolean
          social_border_style: string
          social_icon_custom_color: string | null
          social_icon_size: number
          social_icon_style: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accent_color?: string
          button_border_radius?: number
          card_border_radius?: number
          footer_bg_color?: string
          footer_logo_size?: number
          footer_text_color?: string
          header_bg_color?: string
          header_border_color?: string
          header_logo_size?: number
          id?: string
          primary_color?: string
          secondary_color?: string
          show_social_links?: boolean
          social_border_style?: string
          social_icon_custom_color?: string | null
          social_icon_size?: number
          social_icon_style?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accent_color?: string
          button_border_radius?: number
          card_border_radius?: number
          footer_bg_color?: string
          footer_logo_size?: number
          footer_text_color?: string
          header_bg_color?: string
          header_border_color?: string
          header_logo_size?: number
          id?: string
          primary_color?: string
          secondary_color?: string
          show_social_links?: boolean
          social_border_style?: string
          social_icon_custom_color?: string | null
          social_icon_size?: number
          social_icon_style?: string
          updated_at?: string
          updated_by?: string | null
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
      static_pages: {
        Row: {
          content_html: string
          created_at: string
          created_by: string | null
          display_order: number | null
          id: string
          is_homepage: boolean | null
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          show_in_menu: boolean | null
          slug: string
          status: boolean | null
          title: string
          updated_at: string
          updated_by: string | null
          url_path: string
        }
        Insert: {
          content_html: string
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_homepage?: boolean | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          show_in_menu?: boolean | null
          slug: string
          status?: boolean | null
          title: string
          updated_at?: string
          updated_by?: string | null
          url_path: string
        }
        Update: {
          content_html?: string
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_homepage?: boolean | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          show_in_menu?: boolean | null
          slug?: string
          status?: boolean | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          url_path?: string
        }
        Relationships: []
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
          template_html: string
          template_type: Database["public"]["Enums"]["template_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          template_html: string
          template_type: Database["public"]["Enums"]["template_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          template_html?: string
          template_type?: Database["public"]["Enums"]["template_type"]
          updated_at?: string
        }
        Relationships: []
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
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          job_title: string | null
          last_login_at: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          job_title?: string | null
          last_login_at?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          job_title?: string | null
          last_login_at?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
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
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_status: "active" | "inactive" | "archived"
      activity_action: "created" | "updated" | "deleted"
      appointment_status: "scheduled" | "completed" | "canceled" | "requested"
      appointment_type: "onsite" | "virtual" | "phone"
      invoice_status: "pending" | "paid" | "overdue" | "cancelled"
      lead_status: "new" | "contacted" | "qualified" | "converted" | "lost"
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
      service_category:
        | "Authority Hub"
        | "Emergency Services"
        | "Granular Services"
      task_priority: "low" | "medium" | "high"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
      template_type: "service" | "static"
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
      activity_action: ["created", "updated", "deleted"],
      appointment_status: ["scheduled", "completed", "canceled", "requested"],
      appointment_type: ["onsite", "virtual", "phone"],
      invoice_status: ["pending", "paid", "overdue", "cancelled"],
      lead_status: ["new", "contacted", "qualified", "converted", "lost"],
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
      service_category: [
        "Authority Hub",
        "Emergency Services",
        "Granular Services",
      ],
      task_priority: ["low", "medium", "high"],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
      template_type: ["service", "static"],
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
