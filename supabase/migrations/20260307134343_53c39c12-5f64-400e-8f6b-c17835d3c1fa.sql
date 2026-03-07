-- Enable RLS on stripe_events_processed
ALTER TABLE public.stripe_events_processed ENABLE ROW LEVEL SECURITY;

-- Only service role / super admin can read stripe events
CREATE POLICY stripe_events_service_only ON public.stripe_events_processed
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Enable RLS on referral_clicks
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

-- Only super admin can read referral clicks
CREATE POLICY referral_clicks_admin_only ON public.referral_clicks
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Replace overly permissive credit_packs policy with authenticated-only
DROP POLICY IF EXISTS credit_packs_select_all ON public.credit_packs;

CREATE POLICY credit_packs_select_authenticated ON public.credit_packs
  FOR SELECT TO authenticated
  USING (true);

-- Fix search_path on functions missing it
ALTER FUNCTION public.check_org_credits(uuid) SET search_path = 'public';
ALTER FUNCTION public.get_org_dashboard(uuid) SET search_path = 'public';
ALTER FUNCTION public.api_consume_credit(uuid, uuid, uuid) SET search_path = 'public';
ALTER FUNCTION public.add_extra_credits(uuid, integer, text) SET search_path = 'public';
ALTER FUNCTION public.consume_credit(uuid, uuid, uuid) SET search_path = 'public';
ALTER FUNCTION public.sync_org_credits_balance() SET search_path = 'public';