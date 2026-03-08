-- Set all remaining views to SECURITY INVOKER to respect RLS
ALTER VIEW public.billing_dashboard SET (security_invoker = true);
ALTER VIEW public.org_active_features SET (security_invoker = true);
ALTER VIEW public.org_credit_history SET (security_invoker = true);
ALTER VIEW public.org_dashboard_stats SET (security_invoker = true);
ALTER VIEW public.org_usage_view SET (security_invoker = true);
ALTER VIEW public.v_active_stripe_plans SET (security_invoker = true);
ALTER VIEW public.v_user_plan_balance SET (security_invoker = true);
ALTER VIEW public.admin_billing_overview SET (security_invoker = true);
ALTER VIEW public.admin_prompts_overview SET (security_invoker = true);
ALTER VIEW public.admin_saas_specs_overview SET (security_invoker = true);
ALTER VIEW public.admin_users_overview SET (security_invoker = true);