-- Billing Engine Foundation (Supabase Source of Truth)

-- 1) Ensure enums required by billing flows exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'subscription_status'
  ) THEN
    CREATE TYPE public.subscription_status AS ENUM (
      'trialing',
      'active',
      'incomplete',
      'incomplete_expired',
      'past_due',
      'canceled',
      'unpaid',
      'paused'
    );
  END IF;
END
$$;

-- 2) Core billing catalog and subscription tables
CREATE TABLE IF NOT EXISTS public.billing_products (
  id text PRIMARY KEY,
  name text NOT NULL,
  plan_tier public.plan_tier NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb,
  stripe_product_id text,
  stripe_synced boolean NOT NULL DEFAULT false,
  stripe_last_sync_at timestamptz,
  stripe_last_synced_at timestamptz,
  stripe_sync_lock boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.billing_prices (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES public.billing_products(id) ON DELETE CASCADE,
  unit_amount integer,
  currency text NOT NULL DEFAULT 'brl',
  recurring_interval text,
  trial_period_days integer,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb,
  stripe_price_id text,
  stripe_synced boolean NOT NULL DEFAULT false,
  stripe_last_sync_at timestamptz,
  stripe_last_synced_at timestamptz,
  stripe_sync_lock boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_prices_recurring_interval_chk
    CHECK (recurring_interval IS NULL OR recurring_interval IN ('month', 'year'))
);

CREATE TABLE IF NOT EXISTS public.billing_plan_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL REFERENCES public.billing_products(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  limit_value integer,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_plan_features_uniq UNIQUE (product_id, feature_key)
);

CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id text PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  price_id text NOT NULL REFERENCES public.billing_prices(id),
  status public.subscription_status NOT NULL,
  trial_start timestamptz,
  trial_end timestamptz,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at timestamptz,
  canceled_at timestamptz,
  ended_at timestamptz,
  metadata jsonb,
  stripe_default_payment_method text,
  stripe_latest_invoice_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.org_credits (
  org_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Integrity rules
CREATE UNIQUE INDEX IF NOT EXISTS billing_price_one_active
ON public.billing_prices(product_id)
WHERE is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS one_active_subscription_per_org
ON public.billing_subscriptions(org_id)
WHERE status IN ('active','trialing','past_due');

CREATE OR REPLACE FUNCTION public.enforce_billing_product_price_integrity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_TABLE_NAME = 'billing_prices' THEN
    IF NEW.is_active THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.billing_products bp
        WHERE bp.id = NEW.product_id AND bp.is_active
      ) THEN
        RAISE EXCEPTION 'Active price requires active product';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'billing_products' THEN
    IF NEW.is_active THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.billing_prices bpr
        WHERE bpr.product_id = NEW.id AND bpr.is_active
      ) THEN
        RAISE EXCEPTION 'Active product requires at least one active price';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_enforce_billing_prices_integrity ON public.billing_prices;
CREATE TRIGGER trg_enforce_billing_prices_integrity
BEFORE INSERT OR UPDATE OF is_active, product_id ON public.billing_prices
FOR EACH ROW EXECUTE FUNCTION public.enforce_billing_product_price_integrity();

DROP TRIGGER IF EXISTS trg_enforce_billing_products_integrity ON public.billing_products;
CREATE TRIGGER trg_enforce_billing_products_integrity
BEFORE UPDATE OF is_active ON public.billing_products
FOR EACH ROW EXECUTE FUNCTION public.enforce_billing_product_price_integrity();

-- 4) Organization activation follows subscription health
CREATE OR REPLACE FUNCTION public.sync_org_activation_from_subscription()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.organizations o
  SET
    is_active = CASE
      WHEN NEW.status IN ('active', 'trialing') THEN true
      ELSE false
    END,
    updated_at = now()
  WHERE o.id = NEW.org_id;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_sync_org_activation_from_subscription ON public.billing_subscriptions;
CREATE TRIGGER trg_sync_org_activation_from_subscription
AFTER INSERT OR UPDATE OF status ON public.billing_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.sync_org_activation_from_subscription();

-- 5) Features and feature resolution
CREATE OR REPLACE VIEW public.org_active_features AS
SELECT
  bs.org_id,
  bpf.feature_key,
  bpf.enabled,
  bpf.limit_value
FROM public.billing_subscriptions bs
JOIN public.billing_prices bp ON bp.id = bs.price_id
JOIN public.billing_plan_features bpf ON bpf.product_id = bp.product_id
WHERE bs.status IN ('active', 'trialing', 'past_due');

CREATE OR REPLACE FUNCTION public.has_org_feature(p_org_id uuid, p_feature_key text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(bool_or(oaf.enabled), false)
  FROM public.org_active_features oaf
  WHERE oaf.org_id = p_org_id
    AND oaf.feature_key = p_feature_key
$$;

-- 6) Credit engine: apply monthly_credits on period start / plan changes
CREATE OR REPLACE FUNCTION public.apply_plan_credits_on_period_start()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_monthly_credits integer := 0;
BEGIN
  IF NEW.status NOT IN ('active', 'trialing', 'past_due') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.current_period_start = OLD.current_period_start
     AND NEW.price_id = OLD.price_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(bpf.limit_value, 0)
  INTO v_monthly_credits
  FROM public.billing_prices bp
  JOIN public.billing_plan_features bpf ON bpf.product_id = bp.product_id
  WHERE bp.id = NEW.price_id
    AND bpf.feature_key = 'monthly_credits'
    AND bpf.enabled = true
  LIMIT 1;

  INSERT INTO public.org_credits (org_id, balance, updated_at)
  VALUES (NEW.org_id, v_monthly_credits, now())
  ON CONFLICT (org_id)
  DO UPDATE SET
    balance = EXCLUDED.balance,
    updated_at = now();

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_apply_plan_credits_on_period_start ON public.billing_subscriptions;
CREATE TRIGGER trg_apply_plan_credits_on_period_start
AFTER INSERT OR UPDATE OF current_period_start, price_id ON public.billing_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.apply_plan_credits_on_period_start();

-- 7) Status automation
CREATE OR REPLACE FUNCTION public.update_subscription_status_automatically()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.billing_subscriptions
  SET
    status = 'past_due',
    updated_at = now()
  WHERE status = 'active'
    AND current_period_end < now();

  UPDATE public.billing_subscriptions
  SET
    status = 'canceled',
    canceled_at = COALESCE(canceled_at, now()),
    ended_at = COALESCE(ended_at, now()),
    updated_at = now()
  WHERE status IN ('active', 'trialing', 'past_due')
    AND cancel_at IS NOT NULL
    AND cancel_at <= now();
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    IF NOT EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'billing-status-automation-every-5-minutes'
    ) THEN
      PERFORM cron.schedule(
        'billing-status-automation-every-5-minutes',
        '*/5 * * * *',
        $cron$SELECT public.update_subscription_status_automatically();$cron$
      );
    END IF;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- ignore in environments where cron is unavailable
  NULL;
END
$$;

-- 8) Plan switch function
CREATE OR REPLACE FUNCTION public.change_subscription_plan(p_org_id uuid, p_new_price_id text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_interval text;
  v_period_end timestamptz;
BEGIN
  SELECT recurring_interval INTO v_new_interval
  FROM public.billing_prices
  WHERE id = p_new_price_id;

  IF v_new_interval IS NULL THEN
    RAISE EXCEPTION 'New price not found or recurring interval is null';
  END IF;

  UPDATE public.billing_subscriptions
  SET
    status = 'canceled',
    canceled_at = now(),
    ended_at = now(),
    updated_at = now()
  WHERE org_id = p_org_id
    AND status IN ('active','trialing','past_due');

  v_period_end := CASE
    WHEN v_new_interval = 'year' THEN now() + interval '1 year'
    ELSE now() + interval '1 month'
  END;

  INSERT INTO public.billing_subscriptions (
    id,
    org_id,
    price_id,
    status,
    current_period_start,
    current_period_end,
    created_at,
    updated_at
  ) VALUES (
    'sub_' || replace(gen_random_uuid()::text, '-', ''),
    p_org_id,
    p_new_price_id,
    'active',
    now(),
    v_period_end,
    now(),
    now()
  );
END
$$;

-- 9) Billing dashboard
CREATE OR REPLACE VIEW public.billing_dashboard AS
SELECT
  o.id AS org_id,
  o.name AS org_name,
  o.is_active AS organization_active,
  bs.id AS subscription_id,
  bs.status AS subscription_status,
  bs.current_period_start,
  bs.current_period_end,
  bp.id AS product_id,
  bp.name AS product_name,
  bpr.id AS price_id,
  bpr.unit_amount,
  bpr.recurring_interval,
  oc.balance AS credit_balance,
  CASE
    WHEN bs.status IN ('active', 'trialing') THEN 'healthy'
    WHEN bs.status = 'past_due' THEN 'payment_issue'
    WHEN bs.status IN ('canceled', 'unpaid') THEN 'inactive'
    ELSE NULL
  END AS billing_health,
  CASE
    WHEN bs.current_period_end IS NULL THEN NULL
    ELSE bs.current_period_end - now()
  END AS time_remaining
FROM public.organizations o
LEFT JOIN LATERAL (
  SELECT *
  FROM public.billing_subscriptions s
  WHERE s.org_id = o.id
  ORDER BY s.created_at DESC
  LIMIT 1
) bs ON true
LEFT JOIN public.billing_prices bpr ON bpr.id = bs.price_id
LEFT JOIN public.billing_products bp ON bp.id = bpr.product_id
LEFT JOIN public.org_credits oc ON oc.org_id = o.id;

-- 10) Stripe Sync dispatch helpers (Supabase -> Stripe)
CREATE OR REPLACE FUNCTION public.dispatch_stripe_sync_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_headers jsonb;
  v_payload jsonb;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.updated_at <= COALESCE(NEW.stripe_last_synced_at, to_timestamp(0)) THEN
    RETURN NEW;
  END IF;

  IF COALESCE(NEW.stripe_sync_lock, false) THEN
    RETURN NEW;
  END IF;

  v_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-webhook-source', 'supabase-db-trigger'
  );

  v_payload := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'event', TG_OP,
    'new_record', to_jsonb(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END
  );

  IF current_setting('app.settings.stripe_sync_webhook_url', true) IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM supabase_functions.http_request(
      current_setting('app.settings.stripe_sync_webhook_url', true),
      'POST',
      v_headers,
      v_payload,
      '1000'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Keep source-of-truth writes successful even when webhook dispatch fails.
    NULL;
  END;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_dispatch_stripe_product_sync ON public.billing_products;
CREATE TRIGGER trg_dispatch_stripe_product_sync
AFTER INSERT OR UPDATE ON public.billing_products
FOR EACH ROW EXECUTE FUNCTION public.dispatch_stripe_sync_event();

DROP TRIGGER IF EXISTS trg_dispatch_stripe_price_sync ON public.billing_prices;
CREATE TRIGGER trg_dispatch_stripe_price_sync
AFTER INSERT OR UPDATE ON public.billing_prices
FOR EACH ROW EXECUTE FUNCTION public.dispatch_stripe_sync_event();

-- 11) RLS and policies for org ownership + super admin on organizations and billing tables
ALTER TABLE public.billing_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_credits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizations' AND policyname = 'orgs_select_personal_or_admin'
  ) THEN
    CREATE POLICY orgs_select_personal_or_admin
    ON public.organizations
    FOR SELECT
    TO authenticated
    USING (
      is_super_admin()
      OR id = (SELECT p.personal_org_id FROM public.profiles p WHERE p.id = auth.uid())
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizations' AND policyname = 'orgs_update_personal_or_admin'
  ) THEN
    CREATE POLICY orgs_update_personal_or_admin
    ON public.organizations
    FOR UPDATE
    TO authenticated
    USING (
      is_super_admin()
      OR id = (SELECT p.personal_org_id FROM public.profiles p WHERE p.id = auth.uid())
    )
    WITH CHECK (
      is_super_admin()
      OR id = (SELECT p.personal_org_id FROM public.profiles p WHERE p.id = auth.uid())
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'billing_products' AND policyname = 'billing_products_read_all'
  ) THEN
    CREATE POLICY billing_products_read_all
    ON public.billing_products
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'billing_products' AND policyname = 'billing_products_admin_write'
  ) THEN
    CREATE POLICY billing_products_admin_write
    ON public.billing_products
    FOR ALL
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'billing_prices' AND policyname = 'billing_prices_read_all'
  ) THEN
    CREATE POLICY billing_prices_read_all
    ON public.billing_prices
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'billing_prices' AND policyname = 'billing_prices_admin_write'
  ) THEN
    CREATE POLICY billing_prices_admin_write
    ON public.billing_prices
    FOR ALL
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'billing_plan_features' AND policyname = 'billing_plan_features_read_all'
  ) THEN
    CREATE POLICY billing_plan_features_read_all
    ON public.billing_plan_features
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'billing_plan_features' AND policyname = 'billing_plan_features_admin_write'
  ) THEN
    CREATE POLICY billing_plan_features_admin_write
    ON public.billing_plan_features
    FOR ALL
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'billing_subscriptions' AND policyname = 'billing_subscriptions_own_org_or_admin'
  ) THEN
    CREATE POLICY billing_subscriptions_own_org_or_admin
    ON public.billing_subscriptions
    FOR SELECT
    TO authenticated
    USING (is_super_admin() OR org_id = ANY(get_user_org_ids()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'billing_subscriptions' AND policyname = 'billing_subscriptions_admin_write'
  ) THEN
    CREATE POLICY billing_subscriptions_admin_write
    ON public.billing_subscriptions
    FOR ALL
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'org_credits' AND policyname = 'org_credits_own_org_or_admin'
  ) THEN
    CREATE POLICY org_credits_own_org_or_admin
    ON public.org_credits
    FOR SELECT
    TO authenticated
    USING (is_super_admin() OR org_id = ANY(get_user_org_ids()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'org_credits' AND policyname = 'org_credits_admin_write'
  ) THEN
    CREATE POLICY org_credits_admin_write
    ON public.org_credits
    FOR ALL
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());
  END IF;
END
$$;
