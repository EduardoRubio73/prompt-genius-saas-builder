-- Secure admin views by adding is_super_admin() WHERE clause
-- This prevents non-admin users from reading any data even if they query the view directly

CREATE OR REPLACE VIEW public.admin_billing_overview AS
SELECT bs.id AS subscription_id,
    bs.status,
    bs.current_period_start,
    bs.current_period_end,
    bs.trial_end,
    o.id AS org_id,
    o.name AS org_name,
    o.stripe_customer_id,
    o.plan_tier,
    bp.name AS product_name,
    bpr.unit_amount,
    bpr.currency,
    bpr.recurring_interval,
    ( SELECT bi.amount_paid
           FROM billing_invoices bi
          WHERE bi.subscription_id = bs.id AND bi.status = 'paid'
          ORDER BY bi.created_at DESC
         LIMIT 1) AS last_payment_amount,
    ( SELECT bi.paid_at
           FROM billing_invoices bi
          WHERE bi.subscription_id = bs.id AND bi.status = 'paid'
          ORDER BY bi.created_at DESC
         LIMIT 1) AS last_payment_at
   FROM billing_subscriptions bs
     JOIN organizations o ON o.id = bs.org_id
     JOIN billing_prices bpr ON bpr.id = bs.price_id
     JOIN billing_products bp ON bp.id = bpr.product_id
   WHERE public.is_super_admin();

CREATE OR REPLACE VIEW public.admin_prompts_overview AS
SELECT pm.id,
    pm.created_at,
    pm.especialidade,
    pm.persona,
    pm.tarefa,
    pm.destino,
    pm.rating,
    pm.categoria,
    pm.tags,
    pm.tokens_consumed,
    pm.is_favorite,
    pm.prompt_gerado,
    p.email AS user_email,
    p.full_name AS user_name,
    o.name AS org_name,
    o.plan_tier,
    s.mode AS session_mode
   FROM prompt_memory pm
     JOIN profiles p ON p.id = pm.user_id
     JOIN organizations o ON o.id = pm.org_id
     LEFT JOIN sessions s ON s.id = pm.session_id
   WHERE public.is_super_admin()
   ORDER BY pm.created_at DESC;

CREATE OR REPLACE VIEW public.admin_saas_specs_overview AS
SELECT ss.id,
    ss.created_at,
    ss.project_name,
    ss.rating,
    ss.is_favorite,
    ss.answers ->> 'frontend' AS stack_frontend,
    ss.answers ->> 'backend' AS stack_backend,
    ss.answers ->> 'database' AS stack_database,
    ss.answers ->> 'model' AS revenue_model,
    p.email AS user_email,
    p.full_name AS user_name,
    o.name AS org_name,
    o.plan_tier,
    (ss.prompt_memory_id IS NOT NULL) AS is_misto_mode
   FROM saas_specs ss
     JOIN profiles p ON p.id = ss.user_id
     JOIN organizations o ON o.id = ss.org_id
   WHERE public.is_super_admin()
   ORDER BY ss.created_at DESC;

CREATE OR REPLACE VIEW public.admin_users_overview AS
SELECT p.id AS user_id,
    p.email,
    p.full_name,
    p.onboarded,
    p.created_at AS registered_at,
    o.id AS org_id,
    o.name AS org_name,
    o.plan_tier,
    o.is_active AS org_active,
    om.role,
    ( SELECT count(*) FROM prompt_memory WHERE prompt_memory.user_id = p.id) AS total_prompts,
    ( SELECT count(*) FROM saas_specs WHERE saas_specs.user_id = p.id) AS total_specs,
    ( SELECT count(*) FROM sessions WHERE sessions.user_id = p.id) AS total_sessions,
    ( SELECT COALESCE(sum(billing_token_usage.tokens_total), 0::bigint)
           FROM billing_token_usage
          WHERE billing_token_usage.user_id = p.id AND billing_token_usage.period_start >= date_trunc('month', now())) AS tokens_this_month,
    ( SELECT bs.status
           FROM billing_subscriptions bs
          WHERE bs.org_id = o.id AND bs.status IN ('active', 'trialing')
          ORDER BY bs.created_at DESC
         LIMIT 1) AS subscription_status,
    ( SELECT bs.current_period_end
           FROM billing_subscriptions bs
          WHERE bs.org_id = o.id AND bs.status IN ('active', 'trialing')
          ORDER BY bs.created_at DESC
         LIMIT 1) AS subscription_ends_at
   FROM profiles p
     JOIN org_members om ON om.user_id = p.id
     JOIN organizations o ON o.id = om.org_id
   WHERE om.role = 'owner' AND public.is_super_admin();

-- Also secure the phone_verifications_status view with SECURITY INVOKER
ALTER VIEW public.phone_verifications_status SET (security_invoker = true);