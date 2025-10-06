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
          source_lead_id: string | null
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
        }
        Insert: {
          account_name: string
          created_at?: string
          id?: string
          source_lead_id?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Update: {
          account_name?: string
          created_at?: string
          id?: string
          source_lead_id?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
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
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          parent_entity_id: string | null
          parent_entity_type: string | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["activity_action"]
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          parent_entity_id?: string | null
          parent_entity_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["activity_action"]
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
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
          city: string
          created_at: string
          id: string
          is_primary: boolean
          state: string
          street_address: string
          unit: string | null
          updated_at: string
          zip: string
        }
        Insert: {
          account_id: string
          city: string
          created_at?: string
          id?: string
          is_primary?: boolean
          state: string
          street_address: string
          unit?: string | null
          updated_at?: string
          zip: string
        }
        Update: {
          account_id?: string
          city?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          state?: string
          street_address?: string
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
      calendar_events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_time: string
          id: string
          related_to_id: string | null
          related_to_type:
            | Database["public"]["Enums"]["related_entity_type"]
            | null
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_time: string
          id?: string
          related_to_id?: string | null
          related_to_type?:
            | Database["public"]["Enums"]["related_entity_type"]
            | null
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string
          id?: string
          related_to_id?: string | null
          related_to_type?:
            | Database["public"]["Enums"]["related_entity_type"]
            | null
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
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
          email: string
          icon_url: string | null
          id: string
          logo_url: string | null
          phone: string
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          address: string
          business_name: string
          business_slogan?: string | null
          created_at?: string
          description?: string | null
          email: string
          icon_url?: string | null
          id?: string
          logo_url?: string | null
          phone: string
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          address?: string
          business_name?: string
          business_slogan?: string | null
          created_at?: string
          description?: string | null
          email?: string
          icon_url?: string | null
          id?: string
          logo_url?: string | null
          phone?: string
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          account_id: string
          created_at: string
          email: string
          first_name: string
          id: string
          is_primary: boolean
          last_name: string
          phone: string
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_primary?: boolean
          last_name: string
          phone: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_primary?: boolean
          last_name?: string
          phone?: string
          updated_at?: string
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
      generated_pages: {
        Row: {
          created_at: string
          id: string
          meta_description: string | null
          page_title: string
          rendered_html: string | null
          service_area_id: string
          service_id: string
          status: boolean
          updated_at: string
          url_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta_description?: string | null
          page_title: string
          rendered_html?: string | null
          service_area_id: string
          service_id: string
          status?: boolean
          updated_at?: string
          url_path: string
        }
        Update: {
          created_at?: string
          id?: string
          meta_description?: string | null
          page_title?: string
          rendered_html?: string | null
          service_area_id?: string
          service_id?: string
          status?: boolean
          updated_at?: string
          url_path?: string
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
      invoices: {
        Row: {
          account_id: string
          created_at: string
          created_by: string
          due_date: string
          id: string
          invoice_number: string
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
          state: string
          status: Database["public"]["Enums"]["lead_status"]
          street_address: string
          unit: string | null
          updated_at: string
          zip: string
        }
        Insert: {
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
          state: string
          status?: Database["public"]["Enums"]["lead_status"]
          street_address: string
          unit?: string | null
          updated_at?: string
          zip: string
        }
        Update: {
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
          related_to_id: string
          related_to_type: Database["public"]["Enums"]["related_entity_type"]
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          related_to_id: string
          related_to_type: Database["public"]["Enums"]["related_entity_type"]
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
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
      projects: {
        Row: {
          account_id: string
          created_at: string
          estimated_completion: string | null
          id: string
          project_name: string
          source_lead_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          estimated_completion?: string | null
          id?: string
          project_name: string
          source_lead_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          estimated_completion?: string | null
          id?: string
          project_name?: string
          source_lead_id?: string | null
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
      quotes: {
        Row: {
          account_id: string
          created_at: string
          created_by: string
          id: string
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
      tasks: {
        Row: {
          assigned_to: string | null
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
      invoice_status: "pending" | "paid" | "overdue" | "cancelled"
      lead_status: "new" | "contacted" | "qualified" | "converted" | "lost"
      project_status:
        | "planning"
        | "active"
        | "completed"
        | "on_hold"
        | "cancelled"
      quote_status: "draft" | "sent" | "accepted" | "declined" | "expired"
      related_entity_type: "lead" | "account" | "project" | "contact" | "task"
      service_category:
        | "Authority Hub"
        | "Emergency Services"
        | "Granular Services"
      task_priority: "low" | "medium" | "high"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
      template_type: "service" | "static"
      user_role: "admin" | "crm_user" | "customer"
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
      related_entity_type: ["lead", "account", "project", "contact", "task"],
      service_category: [
        "Authority Hub",
        "Emergency Services",
        "Granular Services",
      ],
      task_priority: ["low", "medium", "high"],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
      template_type: ["service", "static"],
      user_role: ["admin", "crm_user", "customer"],
    },
  },
} as const
