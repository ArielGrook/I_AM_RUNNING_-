// =====================================================
// I AM RUNNING - Database Types v4.0
// Auto-generated from Supabase schema
// Дата: 12.02.2026
// =====================================================

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
      users: {
        Row: {
          id: string
          user_number: number
          email: string
          full_name: string | null
          avatar: string | null
          company: string | null
          account_type: 'regular' | 'freelancer'
          freelancer_tier: 'frontend' | 'full_stack' | 'professional' | null
          freelancer_price: number | null
          freelancer_status: 'active' | 'trial' | 'expired' | 'cancelled' | null
          freelancer_trial_ends_at: string | null
          freelancer_next_billing: string | null
          deployment_project_name: string | null
          deployment_tier: string | null
          deployment_price: number | null
          deployment_status: 'active' | 'expired' | 'cancelled' | null
          deployment_next_billing: string | null
          first_month_free_used: boolean
          projects_created: number
          projects_completed: number
          total_spent: number
          referral_code: string | null
          referred_by: string | null
          total_referrals: number
          freelancer_rank: number | null
          current_discount_percent: number
          display_name: string | null
          ai_requests_today: number
          ai_requests_limit: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_number?: never
          email: string
          full_name?: string | null
          avatar?: string | null
          company?: string | null
          account_type?: 'regular' | 'freelancer'
          freelancer_tier?: 'frontend' | 'full_stack' | 'professional' | null
          freelancer_price?: number | null
          freelancer_status?: 'active' | 'trial' | 'expired' | 'cancelled' | null
          freelancer_trial_ends_at?: string | null
          freelancer_next_billing?: string | null
          deployment_project_name?: string | null
          deployment_tier?: string | null
          deployment_price?: number | null
          deployment_status?: 'active' | 'expired' | 'cancelled' | null
          deployment_next_billing?: string | null
          first_month_free_used?: boolean
          projects_created?: number
          projects_completed?: number
          total_spent?: number
          referral_code?: string | null
          referred_by?: string | null
          total_referrals?: number
          freelancer_rank?: number | null
          current_discount_percent?: number
          display_name?: string | null
          ai_requests_today?: number
          ai_requests_limit?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_number?: never
          email?: string
          full_name?: string | null
          avatar?: string | null
          company?: string | null
          account_type?: 'regular' | 'freelancer'
          freelancer_tier?: 'frontend' | 'full_stack' | 'professional' | null
          freelancer_price?: number | null
          freelancer_status?: 'active' | 'trial' | 'expired' | 'cancelled' | null
          freelancer_trial_ends_at?: string | null
          freelancer_next_billing?: string | null
          deployment_project_name?: string | null
          deployment_tier?: string | null
          deployment_price?: number | null
          deployment_status?: 'active' | 'expired' | 'cancelled' | null
          deployment_next_billing?: string | null
          first_month_free_used?: boolean
          projects_created?: number
          projects_completed?: number
          total_spent?: number
          referral_code?: string | null
          referred_by?: string | null
          total_referrals?: number
          freelancer_rank?: number | null
          current_discount_percent?: number
          display_name?: string | null
          ai_requests_today?: number
          ai_requests_limit?: number
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          project_number: number
          user_id: string
          name: string
          description: string | null
          thumbnail: string | null
          data: Json // LEGACY - use contract
          contract: Json
          is_public: boolean
          is_template: boolean
          source: 'interactive' | 'editor'
          status: 'draft' | 'paid' | 'deployed'
          preview_token: string | null
          assembled_html: string | null
          assembled_css: string | null
          assembled_js: string | null
          backend_blocks: Json
          has_promo_banner: boolean
          discount_percent: number
          original_price: number
          final_price: number
          deployment_strategy: 'static' | 'docker' | null
          delivery_method: 'managed' | 'diy' | null
          deployment_tier: string | null
          deployment_price: number | null
          server_project_name: string | null
          hosting_tier: string | null
          hosting_status: string
          first_month_free_used: boolean
          tags: string[]
          category: string
          visibility: 'private' | 'public' | 'unlisted'
          version: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_number?: never
          user_id: string
          name: string
          description?: string | null
          thumbnail?: string | null
          data?: Json
          contract?: Json
          is_public?: boolean
          is_template?: boolean
          source?: 'interactive' | 'editor'
          status?: 'draft' | 'paid' | 'deployed'
          preview_token?: string | null
          assembled_html?: string | null
          assembled_css?: string | null
          assembled_js?: string | null
          backend_blocks?: Json
          has_promo_banner?: boolean
          discount_percent?: number
          original_price?: number
          final_price?: number
          deployment_strategy?: 'static' | 'docker' | null
          delivery_method?: 'managed' | 'diy' | null
          deployment_tier?: string | null
          deployment_price?: number | null
          server_project_name?: string | null
          hosting_tier?: string | null
          hosting_status?: string
          first_month_free_used?: boolean
          tags?: string[]
          category?: string
          visibility?: 'private' | 'public' | 'unlisted'
          version?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_number?: never
          user_id?: string
          name?: string
          description?: string | null
          thumbnail?: string | null
          data?: Json
          contract?: Json
          is_public?: boolean
          is_template?: boolean
          source?: 'interactive' | 'editor'
          status?: 'draft' | 'paid' | 'deployed'
          preview_token?: string | null
          assembled_html?: string | null
          assembled_css?: string | null
          assembled_js?: string | null
          backend_blocks?: Json
          has_promo_banner?: boolean
          discount_percent?: number
          original_price?: number
          final_price?: number
          deployment_strategy?: 'static' | 'docker' | null
          delivery_method?: 'managed' | 'diy' | null
          deployment_tier?: string | null
          deployment_price?: number | null
          server_project_name?: string | null
          hosting_tier?: string | null
          hosting_status?: string
          first_month_free_used?: boolean
          tags?: string[]
          category?: string
          visibility?: 'private' | 'public' | 'unlisted'
          version?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      components: {
        Row: {
          id: string
          component_number: number
          name: string
          category: 'header' | 'hero' | 'footer' | 'section' | 'button' | 'form' | 'navigation' | 'custom' | 'auth' | 'database' | 'product-card' | 'cart'
          block_type: string | null
          variant_name: string | null
          style: string | null
          html: string
          css: string | null
          js: string | null
          type: string | null
          description: string | null
          preview_img: string | null
          tags: string[] | null
          style_tags: string[]
          business_tags: string[]
          feature_tags: string[]
          editable_areas: Json
          dependencies: Json | null
          slots: Json | null
          input_props: Json | null
          meta: Json | null
          user_id: string | null // LEGACY - use created_by
          created_by: string | null
          is_public: boolean
          is_premium: boolean
          usage_count: number
          slug: string | null
          component_path: string | null
          animation_preset: string | null
          has_mobile_variant: boolean
          accessibility_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          component_number?: never
          name: string
          category: 'header' | 'hero' | 'footer' | 'section' | 'button' | 'form' | 'navigation' | 'custom' | 'auth' | 'database' | 'product-card' | 'cart'
          block_type?: string | null
          variant_name?: string | null
          style?: string | null
          html: string
          css?: string | null
          js?: string | null
          type?: string | null
          description?: string | null
          preview_img?: string | null
          tags?: string[] | null
          style_tags?: string[]
          business_tags?: string[]
          feature_tags?: string[]
          editable_areas?: Json
          dependencies?: Json | null
          slots?: Json | null
          input_props?: Json | null
          meta?: Json | null
          user_id?: string | null
          created_by?: string | null
          is_public?: boolean
          is_premium?: boolean
          usage_count?: number
          slug?: string | null
          component_path?: string | null
          animation_preset?: string | null
          has_mobile_variant?: boolean
          accessibility_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          component_number?: never
          name?: string
          category?: 'header' | 'hero' | 'footer' | 'section' | 'button' | 'form' | 'navigation' | 'custom' | 'auth' | 'database' | 'product-card' | 'cart'
          block_type?: string | null
          variant_name?: string | null
          style?: string | null
          html?: string
          css?: string | null
          js?: string | null
          type?: string | null
          description?: string | null
          preview_img?: string | null
          tags?: string[] | null
          style_tags?: string[]
          business_tags?: string[]
          feature_tags?: string[]
          editable_areas?: Json
          dependencies?: Json | null
          slots?: Json | null
          input_props?: Json | null
          meta?: Json | null
          user_id?: string | null
          created_by?: string | null
          is_public?: boolean
          is_premium?: boolean
          usage_count?: number
          slug?: string | null
          component_path?: string | null
          animation_preset?: string | null
          has_mobile_variant?: boolean
          accessibility_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      backend_blocks: {
        Row: {
          id: string
          slug: string
          category: string
          name_en: string
          name_ru: string | null
          name_he: string | null
          description_en: string | null
          description_ru: string | null
          description_he: string | null
          price: number
          api_endpoints: Json
          database_tables: Json
          env_vars_required: string[]
          files: Json
          icon: string | null
          preview_image: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          category: string
          name_en: string
          name_ru?: string | null
          name_he?: string | null
          description_en?: string | null
          description_ru?: string | null
          description_he?: string | null
          price: number
          api_endpoints?: Json
          database_tables?: Json
          env_vars_required?: string[]
          files?: Json
          icon?: string | null
          preview_image?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          category?: string
          name_en?: string
          name_ru?: string | null
          name_he?: string | null
          description_en?: string | null
          description_ru?: string | null
          description_he?: string | null
          price?: number
          api_endpoints?: Json
          database_tables?: Json
          env_vars_required?: string[]
          files?: Json
          icon?: string | null
          preview_image?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          payment_number: number
          user_id: string
          user_number: number | null
          project_id: string | null
          payment_type: 'site_package' | 'backend_block' | 'deployment' | 'hosting' | 'freelancer_subscription' | 'domain'
          item_name: string
          amount: number
          currency: 'USD' | 'ILS' | 'RUB'
          stripe_payment_id: string | null
          stripe_invoice_id: string | null
          status: 'pending' | 'succeeded' | 'failed' | 'refunded'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          payment_number?: never
          user_id: string
          user_number?: number | null
          project_id?: string | null
          payment_type: 'site_package' | 'backend_block' | 'deployment' | 'hosting' | 'freelancer_subscription' | 'domain'
          item_name: string
          amount: number
          currency?: 'USD' | 'ILS' | 'RUB'
          stripe_payment_id?: string | null
          stripe_invoice_id?: string | null
          status?: 'pending' | 'succeeded' | 'failed' | 'refunded'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          payment_number?: never
          user_id?: string
          user_number?: number | null
          project_id?: string | null
          payment_type?: 'site_package' | 'backend_block' | 'deployment' | 'hosting' | 'freelancer_subscription' | 'domain'
          item_name?: string
          amount?: number
          currency?: 'USD' | 'ILS' | 'RUB'
          stripe_payment_id?: string | null
          stripe_invoice_id?: string | null
          status?: 'pending' | 'succeeded' | 'failed' | 'refunded'
          created_at?: string
          updated_at?: string
        }
      }
      freelancer_clients: {
        Row: {
          id: string
          client_number: number
          freelancer_id: string
          freelancer_user_number: number | null
          client_name: string
          client_email: string
          client_phone: string | null
          company_name: string | null
          project_id: string | null
          status: 'active' | 'completed' | 'cancelled'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_number?: never
          freelancer_id: string
          freelancer_user_number?: number | null
          client_name: string
          client_email: string
          client_phone?: string | null
          company_name?: string | null
          project_id?: string | null
          status?: 'active' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_number?: never
          freelancer_id?: string
          freelancer_user_number?: number | null
          client_name?: string
          client_email?: string
          client_phone?: string | null
          company_name?: string | null
          project_id?: string | null
          status?: 'active' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      freelancer_referrals: {
        Row: {
          id: string
          referrer_id: string
          referrer_user_number: number | null
          referred_id: string
          referred_user_number: number | null
          commission_earned: number
          commission_status: 'pending' | 'paid' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referrer_user_number?: number | null
          referred_id: string
          referred_user_number?: number | null
          commission_earned?: number
          commission_status?: 'pending' | 'paid' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referrer_user_number?: number | null
          referred_id?: string
          referred_user_number?: number | null
          commission_earned?: number
          commission_status?: 'pending' | 'paid' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      chat_insights: {
        Row: {
          id: string
          session_id: string
          user_id: string | null
          insights: Json
          conversation_history: Json | null
          language: string | null
          message_count: number | null
          duration_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id?: string | null
          insights: Json
          conversation_history?: Json | null
          language?: string | null
          message_count?: number | null
          duration_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string | null
          insights?: Json
          conversation_history?: Json | null
          language?: string | null
          message_count?: number | null
          duration_seconds?: number | null
          created_at?: string
        }
      }
      // LEGACY TABLES (keep for now)
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company: string | null
          role: number | null
          ai_requests_today: number
          ai_requests_limit: number
          subscription_expires: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company?: string | null
          role?: number | null
          ai_requests_today?: number
          ai_requests_limit?: number
          subscription_expires?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company?: string | null
          role?: number | null
          ai_requests_today?: number
          ai_requests_limit?: number
          subscription_expires?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_packages: {
        Row: {
          id: string
          user_id: string | null
          package_type: 'landing' | 'multipage' | 'ecommerce'
          order_id: string | null
          status: 'pending' | 'active' | 'expired' | 'cancelled'
          activated_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          package_type: 'landing' | 'multipage' | 'ecommerce'
          order_id?: string | null
          status?: 'pending' | 'active' | 'expired' | 'cancelled'
          activated_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          package_type?: 'landing' | 'multipage' | 'ecommerce'
          order_id?: string | null
          status?: 'pending' | 'active' | 'expired' | 'cancelled'
          activated_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// =====================================================
// HELPER TYPES
// =====================================================

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// =====================================================
// КОНКРЕТНЫЕ ТИПЫ ДЛЯ ИСПОЛЬЗОВАНИЯ В КОДЕ
// =====================================================

export type User = Tables<'users'>
export type Project = Tables<'projects'>
export type Component = Tables<'components'>
export type BackendBlock = Tables<'backend_blocks'>
export type Payment = Tables<'payments'>
export type FreelancerClient = Tables<'freelancer_clients'>
export type FreelancerReferral = Tables<'freelancer_referrals'>
export type ChatInsight = Tables<'chat_insights'>

// LEGACY
export type Profile = Tables<'profiles'>
export type UserPackage = Tables<'user_packages'>