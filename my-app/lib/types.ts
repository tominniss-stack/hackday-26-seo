// Database types for Supabase tables
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          company_name: string
          primary_color_hex: string | null
          logo_url: string | null
          logo_storage_path: string | null
          custom_ai_prompt: string | null
          secure_access_token: string
          contact_name: string | null
          contact_email: string | null
          is_archived: boolean
          approval_required: boolean
          theme_overrides: Record<string, string> | null
          jira_api_key: string | null
          jira_email: string | null
          jira_project_key: string | null
          ga4_property_id: string | null
          gsc_property_url: string | null
          seranking_api_key: string | null
          seranking_domain: string | null
          seranking_project_id: string | null
          seranking_endpoint_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_name: string
          primary_color_hex?: string | null
          logo_url?: string | null
          logo_storage_path?: string | null
          custom_ai_prompt?: string | null
          secure_access_token?: string
          contact_name?: string | null
          contact_email?: string | null
          is_archived?: boolean
          approval_required?: boolean
          theme_overrides?: Record<string, string> | null
          jira_api_key?: string | null
          jira_email?: string | null
          jira_project_key?: string | null
          ga4_property_id?: string | null
          gsc_property_url?: string | null
          seranking_api_key?: string | null
          seranking_domain?: string | null
          seranking_project_id?: string | null
          seranking_endpoint_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          primary_color_hex?: string | null
          logo_url?: string | null
          logo_storage_path?: string | null
          custom_ai_prompt?: string | null
          secure_access_token?: string
          contact_name?: string | null
          contact_email?: string | null
          is_archived?: boolean
          approval_required?: boolean
          theme_overrides?: Record<string, string> | null
          jira_api_key?: string | null
          jira_email?: string | null
          jira_project_key?: string | null
          ga4_property_id?: string | null
          gsc_property_url?: string | null
          seranking_api_key?: string | null
          seranking_domain?: string | null
          seranking_project_id?: string | null
          seranking_endpoint_url?: string | null
          created_at?: string
        }
      }
      agency_users: {
        Row: {
          id: string
          email: string
          name: string
          can_approve_reports: boolean
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          can_approve_reports?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          can_approve_reports?: boolean
          created_at?: string
        }
      }
      client_users: {
        Row: {
          id: string
          client_id: string
          name: string
          email: string
          avatar_url: string | null
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          email: string
          avatar_url?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          email?: string
          avatar_url?: string | null
          role?: string
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          client_id: string
          reporting_month: string
          report_category: 'SEO' | 'PPC'
          published_status: 'draft' | 'pending_approval' | 'published'
          report_context_prompt: string | null
          analyst_notes: Record<string, string> | null
          report_type: 'monthly' | 'quarterly'
          visible_widgets: Record<string, boolean> | null
          raw_sf_file_url: string | null
          manual_priorities: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          reporting_month: string
          report_category?: 'SEO' | 'PPC'
          published_status?: 'draft' | 'pending_approval' | 'published'
          report_context_prompt?: string | null
          analyst_notes?: Record<string, string> | null
          report_type?: 'monthly' | 'quarterly'
          visible_widgets?: Record<string, boolean> | null
          raw_sf_file_url?: string | null
          manual_priorities?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          reporting_month?: string
          report_category?: 'SEO' | 'PPC'
          published_status?: 'draft' | 'pending_approval' | 'published'
          report_context_prompt?: string | null
          analyst_notes?: Record<string, string> | null
          report_type?: 'monthly' | 'quarterly'
          visible_widgets?: Record<string, boolean> | null
          raw_sf_file_url?: string | null
          manual_priorities?: Json | null
          created_at?: string
        }
      }
      app_settings: {
        Row: {
          id: string
          key: string
          value: string | null
          value_json: unknown | null
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value?: string | null
          value_json?: unknown | null
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string | null
          value_json?: unknown | null
          updated_at?: string
        }
      }
      metrics_snapshots: {
        Row: {
          id: string
          report_id: string
          metric_category: string
          data_json: Json
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          metric_category: string
          data_json: Json
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          metric_category?: string
          data_json?: Json
          created_at?: string
        }
      }
      narratives: {
        Row: {
          id: string
          report_id: string
          section: 'executive' | 'technical' | 'traffic'
          final_text: string
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          section?: 'executive' | 'technical' | 'traffic'
          final_text: string
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          section?: 'executive' | 'technical' | 'traffic'
          final_text?: string
          created_at?: string
        }
      }
    }
  }
}

// Helper types for easier use
export type Client = Database['public']['Tables']['clients']['Row'];
export type Report = Database['public']['Tables']['reports']['Row'];
export type MetricSnapshot = Database['public']['Tables']['metrics_snapshots']['Row'];
export type Narrative = Database['public']['Tables']['narratives']['Row'];
export type AgencyUser = Database['public']['Tables']['agency_users']['Row'];
export type ClientUser = Database['public']['Tables']['client_users']['Row'];
