
-- Add display columns to billing_products
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS total_quotas_label text;
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS prompts_label text;
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS prompts_detail text;
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS saas_specs_label text;
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS saas_specs_detail text;
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS misto_label text;
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS misto_detail text;
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS build_label text;
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS build_detail text;
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS members_label text;
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS trial_label text;
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS period_label text;
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS cta_label text;
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Create Free product (doesn't exist yet)
INSERT INTO public.billing_products (id, name, plan_tier, description, is_active)
VALUES ('prod_free', 'Free', 'free', 'Plano gratuito com trial de 7 dias', true)
ON CONFLICT (id) DO NOTHING;

-- Create Free price (R$0)
INSERT INTO public.billing_prices (id, product_id, unit_amount, currency, recurring_interval, is_active)
VALUES ('price_free_monthly', 'prod_free', 0, 'brl', 'month', true)
ON CONFLICT (id) DO NOTHING;
