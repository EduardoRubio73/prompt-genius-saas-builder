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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_api_credentials: {
        Row: {
          api_key: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          label: string
          last_used: string | null
          notes: string | null
          provider: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          api_key: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label: string
          last_used?: string | null
          notes?: string | null
          provider: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          api_key?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string
          last_used?: string | null
          notes?: string | null
          provider?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      admin_feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          flag: string
          id: string
          label: string
          rollout_pct: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag: string
          id?: string
          label: string
          rollout_pct?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag?: string
          id?: string
          label?: string
          rollout_pct?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      admin_model_configs: {
        Row: {
          action_type: string
          cost_per_1k_input: number | null
          cost_per_1k_output: number | null
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          is_default: boolean
          max_tokens: number
          model_id: string
          notes: string | null
          provider: string
          temperature: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          action_type: string
          cost_per_1k_input?: number | null
          cost_per_1k_output?: number | null
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          max_tokens?: number
          model_id: string
          notes?: string | null
          provider: string
          temperature?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          action_type?: string
          cost_per_1k_input?: number | null
          cost_per_1k_output?: number | null
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          max_tokens?: number
          model_id?: string
          notes?: string | null
          provider?: string
          temperature?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_secret: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_secret?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_secret?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      Atualização_Automatica_n8n: {
        Row: {
          created_at: string
          id: number
          update_at: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          update_at?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          update_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: number
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          org_id: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: number
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          org_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: number
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          org_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_billing_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_users_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_invoices: {
        Row: {
          amount_due: number
          amount_paid: number
          created_at: string
          currency: string
          hosted_invoice_url: string | null
          id: string
          invoice_pdf: string | null
          org_id: string
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          status: string
          subscription_id: string | null
        }
        Insert: {
          amount_due: number
          amount_paid?: number
          created_at?: string
          currency?: string
          hosted_invoice_url?: string | null
          id: string
          invoice_pdf?: string | null
          org_id: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status: string
          subscription_id?: string | null
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          created_at?: string
          currency?: string
          hosted_invoice_url?: string | null
          id?: string
          invoice_pdf?: string | null
          org_id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_billing_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "billing_invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_users_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "billing_invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "admin_billing_overview"
            referencedColumns: ["subscription_id"]
          },
          {
            foreignKeyName: "billing_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "billing_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_prices: {
        Row: {
          created_at: string
          currency: string
          id: string
          is_active: boolean
          metadata: Json | null
          product_id: string
          recurring_interval: string | null
          trial_period_days: number | null
          unit_amount: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id: string
          is_active?: boolean
          metadata?: Json | null
          product_id: string
          recurring_interval?: string | null
          trial_period_days?: number | null
          unit_amount?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          product_id?: string
          recurring_interval?: string | null
          trial_period_days?: number | null
          unit_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "billing_products"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          plan_tier: Database["public"]["Enums"]["plan_tier"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          plan_tier: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      billing_subscriptions: {
        Row: {
          cancel_at: string | null
          canceled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          ended_at: string | null
          id: string
          metadata: Json | null
          org_id: string
          price_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_default_payment_method: string | null
          stripe_latest_invoice_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
        }
        Insert: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start: string
          ended_at?: string | null
          id: string
          metadata?: Json | null
          org_id: string
          price_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_default_payment_method?: string | null
          stripe_latest_invoice_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string
          price_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_default_payment_method?: string | null
          stripe_latest_invoice_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_billing_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "billing_subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_users_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "billing_subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "billing_prices"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_token_usage: {
        Row: {
          action_type: string | null
          completion_tokens: number | null
          created_at: string
          estimated_cost_usd: number | null
          id: string
          mode: string | null
          org_id: string
          period_end: string | null
          period_start: string | null
          prompt_tokens: number | null
          session_id: string | null
          session_mode: Database["public"]["Enums"]["session_mode"] | null
          tokens_input: number
          tokens_output: number
          tokens_total: number
          total_tokens: number | null
          user_id: string
        }
        Insert: {
          action_type?: string | null
          completion_tokens?: number | null
          created_at?: string
          estimated_cost_usd?: number | null
          id?: string
          mode?: string | null
          org_id: string
          period_end?: string | null
          period_start?: string | null
          prompt_tokens?: number | null
          session_id?: string | null
          session_mode?: Database["public"]["Enums"]["session_mode"] | null
          tokens_input?: number
          tokens_output?: number
          tokens_total?: number
          total_tokens?: number | null
          user_id: string
        }
        Update: {
          action_type?: string | null
          completion_tokens?: number | null
          created_at?: string
          estimated_cost_usd?: number | null
          id?: string
          mode?: string | null
          org_id?: string
          period_end?: string | null
          period_start?: string | null
          prompt_tokens?: number | null
          session_id?: string | null
          session_mode?: Database["public"]["Enums"]["session_mode"] | null
          tokens_input?: number
          tokens_output?: number
          tokens_total?: number
          total_tokens?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_token_usage_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_billing_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "billing_token_usage_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_users_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "billing_token_usage_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      build_projects: {
        Row: {
          answers: Json
          branding: Json
          created_at: string
          id: string
          is_favorite: boolean
          org_id: string
          outputs: Json
          project_name: string | null
          rating: number | null
          rating_comment: string | null
          session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          branding?: Json
          created_at?: string
          id?: string
          is_favorite?: boolean
          org_id: string
          outputs?: Json
          project_name?: string | null
          rating?: number | null
          rating_comment?: string | null
          session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          branding?: Json
          created_at?: string
          id?: string
          is_favorite?: boolean
          org_id?: string
          outputs?: Json
          project_name?: string | null
          rating?: number | null
          rating_comment?: string | null
          session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "build_projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_billing_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "build_projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_users_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "build_projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "build_projects_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packs: {
        Row: {
          created_at: string
          credits: number
          display_name: string
          id: string
          is_active: boolean
          is_featured: boolean
          price_brl: number
          size: Database["public"]["Enums"]["credit_pack_size"]
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits: number
          display_name: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          price_brl: number
          size: Database["public"]["Enums"]["credit_pack_size"]
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits?: number
          display_name?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          price_brl?: number
          size?: Database["public"]["Enums"]["credit_pack_size"]
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      credit_purchases: {
        Row: {
          amount_paid_brl: number
          created_at: string
          credits_granted: number
          id: string
          org_id: string
          pack_id: string
          paid_at: string | null
          status: string
          stripe_checkout_session: string | null
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid_brl: number
          created_at?: string
          credits_granted: number
          id?: string
          org_id: string
          pack_id: string
          paid_at?: string | null
          status?: string
          stripe_checkout_session?: string | null
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid_brl?: number
          created_at?: string
          credits_granted?: number
          id?: string
          org_id?: string
          pack_id?: string
          paid_at?: string | null
          status?: string
          stripe_checkout_session?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_purchases_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_billing_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "credit_purchases_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_users_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "credit_purchases_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_purchases_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "credit_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          description: string | null
          id: string
          is_bonus: boolean
          org_id: string
          origin: Database["public"]["Enums"]["credit_origin"]
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_bonus?: boolean
          org_id: string
          origin: Database["public"]["Enums"]["credit_origin"]
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_bonus?: boolean
          org_id?: string
          origin?: Database["public"]["Enums"]["credit_origin"]
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_billing_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "credit_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_users_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "credit_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_by: string | null
          org_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_by?: string | null
          org_id: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_by?: string | null
          org_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_billing_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_users_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          bonus_credits_total: number
          bonus_credits_used: number
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          max_members: number
          monthly_token_limit: number
          name: string
          plan_credits_reset_at: string | null
          plan_credits_total: number
          plan_credits_used: number
          plan_tier: Database["public"]["Enums"]["plan_tier"]
          slug: string
          stripe_customer_id: string | null
          trial_ends_at: string | null
          trial_expired_notified_at: string | null
          trial_started_at: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          bonus_credits_total?: number
          bonus_credits_used?: number
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          max_members?: number
          monthly_token_limit?: number
          name: string
          plan_credits_reset_at?: string | null
          plan_credits_total?: number
          plan_credits_used?: number
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          slug: string
          stripe_customer_id?: string | null
          trial_ends_at?: string | null
          trial_expired_notified_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          bonus_credits_total?: number
          bonus_credits_used?: number
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          max_members?: number
          monthly_token_limit?: number
          name?: string
          plan_credits_reset_at?: string | null
          plan_credits_total?: number
          plan_credits_used?: number
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          slug?: string
          stripe_customer_id?: string | null
          trial_ends_at?: string | null
          trial_expired_notified_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      platform_configs: {
        Row: {
          created_at: string
          display_name: string
          formato_preferido: string | null
          id: string
          instrucoes_tecnicas: string | null
          is_active: boolean
          max_tokens_hint: number | null
          platform: Database["public"]["Enums"]["destination_platform"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          formato_preferido?: string | null
          id?: string
          instrucoes_tecnicas?: string | null
          is_active?: boolean
          max_tokens_hint?: number | null
          platform: Database["public"]["Enums"]["destination_platform"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          formato_preferido?: string | null
          id?: string
          instrucoes_tecnicas?: string | null
          is_active?: boolean
          max_tokens_hint?: number | null
          platform?: Database["public"]["Enums"]["destination_platform"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          onboarded: boolean
          personal_org_id: string | null
          preferred_lang: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          onboarded?: boolean
          personal_org_id?: string | null
          preferred_lang?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          onboarded?: boolean
          personal_org_id?: string | null
          preferred_lang?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_personal_org_id_fkey"
            columns: ["personal_org_id"]
            isOneToOne: false
            referencedRelation: "admin_billing_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "profiles_personal_org_id_fkey"
            columns: ["personal_org_id"]
            isOneToOne: false
            referencedRelation: "admin_users_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "profiles_personal_org_id_fkey"
            columns: ["personal_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_memory: {
        Row: {
          categoria: string | null
          contexto: string | null
          created_at: string
          destino: Database["public"]["Enums"]["destination_platform"] | null
          embedding: string | null
          especialidade: string | null
          formato: string | null
          id: string
          is_favorite: boolean
          objetivo: string | null
          org_id: string
          persona: string | null
          prompt_gerado: string
          rating: number | null
          rating_comment: string | null
          referencias: string | null
          restricoes: string | null
          session_id: string | null
          tags: string[] | null
          tarefa: string | null
          tokens_consumed: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria?: string | null
          contexto?: string | null
          created_at?: string
          destino?: Database["public"]["Enums"]["destination_platform"] | null
          embedding?: string | null
          especialidade?: string | null
          formato?: string | null
          id?: string
          is_favorite?: boolean
          objetivo?: string | null
          org_id: string
          persona?: string | null
          prompt_gerado: string
          rating?: number | null
          rating_comment?: string | null
          referencias?: string | null
          restricoes?: string | null
          session_id?: string | null
          tags?: string[] | null
          tarefa?: string | null
          tokens_consumed?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string | null
          contexto?: string | null
          created_at?: string
          destino?: Database["public"]["Enums"]["destination_platform"] | null
          embedding?: string | null
          especialidade?: string | null
          formato?: string | null
          id?: string
          is_favorite?: boolean
          objetivo?: string | null
          org_id?: string
          persona?: string | null
          prompt_gerado?: string
          rating?: number | null
          rating_comment?: string | null
          referencias?: string | null
          restricoes?: string | null
          session_id?: string | null
          tags?: string[] | null
          tarefa?: string | null
          tokens_consumed?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_memory_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_billing_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "prompt_memory_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_users_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "prompt_memory_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_memory_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          org_id: string
          user_id: string
          uses_limit: number | null
          uses_total: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          org_id: string
          user_id: string
          uses_limit?: number | null
          uses_total?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          org_id?: string
          user_id?: string
          uses_limit?: number | null
          uses_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_billing_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "referral_codes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_users_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "referral_codes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          credits_to_invitee: number
          credits_to_referrer: number
          expires_at: string
          id: string
          invitee_email: string | null
          invitee_org_id: string | null
          invitee_user_id: string | null
          referrer_code_id: string
          referrer_org_id: string
          referrer_user_id: string
          rewarded_at: string | null
          status: Database["public"]["Enums"]["referral_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits_to_invitee?: number
          credits_to_referrer?: number
          expires_at?: string
          id?: string
          invitee_email?: string | null
          invitee_org_id?: string | null
          invitee_user_id?: string | null
          referrer_code_id: string
          referrer_org_id: string
          referrer_user_id: string
          rewarded_at?: string | null
          status?: Database["public"]["Enums"]["referral_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits_to_invitee?: number
          credits_to_referrer?: number
          expires_at?: string
          id?: string
          invitee_email?: string | null
          invitee_org_id?: string | null
          invitee_user_id?: string | null
          referrer_code_id?: string
          referrer_org_id?: string
          referrer_user_id?: string
          rewarded_at?: string | null
          status?: Database["public"]["Enums"]["referral_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_invitee_org_id_fkey"
            columns: ["invitee_org_id"]
            isOneToOne: false
            referencedRelation: "admin_billing_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "referrals_invitee_org_id_fkey"
            columns: ["invitee_org_id"]
            isOneToOne: false
            referencedRelation: "admin_users_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "referrals_invitee_org_id_fkey"
            columns: ["invitee_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_code_id_fkey"
            columns: ["referrer_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_org_id_fkey"
            columns: ["referrer_org_id"]
            isOneToOne: false
            referencedRelation: "admin_billing_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "referrals_referrer_org_id_fkey"
            columns: ["referrer_org_id"]
            isOneToOne: false
            referencedRelation: "admin_users_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "referrals_referrer_org_id_fkey"
            columns: ["referrer_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_specs: {
        Row: {
          answers: Json
          created_at: string
          id: string
          is_favorite: boolean
          org_id: string
          project_name: string | null
          prompt_memory_id: string | null
          rating: number | null
          rating_comment: string | null
          session_id: string | null
          spec_md: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers: Json
          created_at?: string
          id?: string
          is_favorite?: boolean
          org_id: string
          project_name?: string | null
          prompt_memory_id?: string | null
          rating?: number | null
          rating_comment?: string | null
          session_id?: string | null
          spec_md: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          is_favorite?: boolean
          org_id?: string
          project_name?: string | null
          prompt_memory_id?: string | null
          rating?: number | null
          rating_comment?: string | null
          session_id?: string | null
          spec_md?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saas_specs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_billing_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "saas_specs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_users_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "saas_specs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_specs_prompt_memory_id_fkey"
            columns: ["prompt_memory_id"]
            isOneToOne: false
            referencedRelation: "admin_prompts_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_specs_prompt_memory_id_fkey"
            columns: ["prompt_memory_id"]
            isOneToOne: false
            referencedRelation: "prompt_memory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_specs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          mode: Database["public"]["Enums"]["session_mode"]
          org_id: string
          raw_input: string | null
          tokens_total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          mode: Database["public"]["Enums"]["session_mode"]
          org_id: string
          raw_input?: string | null
          tokens_total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          mode?: Database["public"]["Enums"]["session_mode"]
          org_id?: string
          raw_input?: string | null
          tokens_total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_billing_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "admin_users_overview"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_billing_overview: {
        Row: {
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          last_payment_amount: number | null
          last_payment_at: string | null
          org_id: string | null
          org_name: string | null
          plan_tier: Database["public"]["Enums"]["plan_tier"] | null
          product_name: string | null
          recurring_interval: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id: string | null
          subscription_id: string | null
          trial_end: string | null
          unit_amount: number | null
        }
        Relationships: []
      }
      admin_prompts_overview: {
        Row: {
          categoria: string | null
          created_at: string | null
          destino: Database["public"]["Enums"]["destination_platform"] | null
          especialidade: string | null
          id: string | null
          is_favorite: boolean | null
          org_name: string | null
          persona: string | null
          plan_tier: Database["public"]["Enums"]["plan_tier"] | null
          prompt_gerado: string | null
          rating: number | null
          session_mode: Database["public"]["Enums"]["session_mode"] | null
          tags: string[] | null
          tarefa: string | null
          tokens_consumed: number | null
          user_email: string | null
          user_name: string | null
        }
        Relationships: []
      }
      admin_saas_specs_overview: {
        Row: {
          created_at: string | null
          id: string | null
          is_favorite: boolean | null
          is_misto_mode: boolean | null
          org_name: string | null
          plan_tier: Database["public"]["Enums"]["plan_tier"] | null
          project_name: string | null
          rating: number | null
          revenue_model: string | null
          stack_backend: string | null
          stack_database: string | null
          stack_frontend: string | null
          user_email: string | null
          user_name: string | null
        }
        Relationships: []
      }
      admin_users_overview: {
        Row: {
          email: string | null
          full_name: string | null
          onboarded: boolean | null
          org_active: boolean | null
          org_id: string | null
          org_name: string | null
          plan_tier: Database["public"]["Enums"]["plan_tier"] | null
          registered_at: string | null
          role: Database["public"]["Enums"]["member_role"] | null
          subscription_ends_at: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          tokens_this_month: number | null
          total_prompts: number | null
          total_sessions: number | null
          total_specs: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_get_kpis: {
        Args: never
        Returns: {
          active_subs: number
          mrr_brl: number
          new_users_today: number
          tokens_this_month: number
          total_orgs: number
          total_prompts: number
          total_specs: number
          total_users: number
        }[]
      }
      admin_get_token_usage_series: {
        Args: { p_days?: number }
        Returns: {
          day: string
          session_mode: string
          tokens_total: number
        }[]
      }
      admin_get_user_growth: {
        Args: { p_days?: number }
        Returns: {
          cumulative: number
          day: string
          new_users: number
        }[]
      }
      admin_toggle_feature: {
        Args: { p_enabled: boolean; p_flag: string }
        Returns: undefined
      }
      admin_upsert_setting: {
        Args: {
          p_category?: string
          p_description?: string
          p_is_secret?: boolean
          p_key: string
          p_value: string
        }
        Returns: undefined
      }
      consume_credit: {
        Args: { p_org_id: string; p_session_id: string; p_user_id: string }
        Returns: string
      }
      generate_referral_code: {
        Args: { p_org_id: string; p_user_id: string }
        Returns: string
      }
      get_credit_balance: {
        Args: { p_org_id: string }
        Returns: {
          account_status: string
          bonus_remaining: number
          bonus_total: number
          bonus_used: number
          plan_remaining: number
          plan_total: number
          plan_used: number
          reset_at: string
          total_remaining: number
          trial_ends_at: string
        }[]
      }
      get_few_shot_examples: {
        Args: { p_categoria?: string; p_limit?: number; p_org_id: string }
        Returns: {
          categoria: string
          especialidade: string
          prompt_gerado: string
          rating: number
        }[]
      }
      get_org_stats: {
        Args: { p_org_id: string }
        Returns: {
          avg_prompt_rating: number
          favorite_prompts: number
          favorite_specs: number
          tokens_this_month: number
          total_prompts: number
          total_saas_specs: number
          total_sessions: number
        }[]
      }
      get_token_budget: {
        Args: { p_org_id: string }
        Returns: {
          consumed: number
          limit_total: number
          period_end: string
          period_start: string
          remaining: number
        }[]
      }
      get_user_org_ids: { Args: never; Returns: string[] }
      is_org_admin: { Args: { p_org_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      process_credit_purchase: {
        Args: { p_purchase_id: string; p_stripe_pi_id: string }
        Returns: undefined
      }
      process_referral: {
        Args: { p_code: string; p_invitee_org: string; p_invitee_user: string }
        Returns: string
      }
      reset_monthly_credits: { Args: { p_org_id: string }; Returns: undefined }
    }
    Enums: {
      account_status:
        | "active"
        | "trial"
        | "trial_expired"
        | "suspended"
        | "churned"
      credit_origin:
        | "purchase"
        | "referral_gave"
        | "referral_got"
        | "bonus"
        | "plan_reset"
      credit_pack_size: "pack_5" | "pack_15" | "pack_40"
      destination_platform:
        | "lovable"
        | "chatgpt"
        | "claude"
        | "gemini"
        | "cursor"
        | "v0"
        | "outro"
      member_role: "owner" | "admin" | "member" | "viewer"
      plan_tier: "free" | "starter" | "pro" | "enterprise"
      referral_status: "pending" | "completed" | "rewarded" | "expired"
      session_mode: "prompt" | "saas" | "misto" | "build"
      subscription_status:
        | "trialing"
        | "active"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "paused"
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
      account_status: [
        "active",
        "trial",
        "trial_expired",
        "suspended",
        "churned",
      ],
      credit_origin: [
        "purchase",
        "referral_gave",
        "referral_got",
        "bonus",
        "plan_reset",
      ],
      credit_pack_size: ["pack_5", "pack_15", "pack_40"],
      destination_platform: [
        "lovable",
        "chatgpt",
        "claude",
        "gemini",
        "cursor",
        "v0",
        "outro",
      ],
      member_role: ["owner", "admin", "member", "viewer"],
      plan_tier: ["free", "starter", "pro", "enterprise"],
      referral_status: ["pending", "completed", "rewarded", "expired"],
      session_mode: ["prompt", "saas", "misto", "build"],
      subscription_status: [
        "trialing",
        "active",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "canceled",
        "unpaid",
        "paused",
      ],
    },
  },
} as const
