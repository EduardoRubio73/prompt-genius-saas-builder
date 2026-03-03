
-- 1. Add stripe_payment_link column to billing_products
ALTER TABLE public.billing_products ADD COLUMN IF NOT EXISTS stripe_payment_link text;

-- 2. Admin RLS policies for write access

-- billing_products: admin full CRUD
CREATE POLICY "admin_products_all" ON public.billing_products FOR ALL TO authenticated
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- billing_prices: admin full CRUD  
CREATE POLICY "admin_prices_all" ON public.billing_prices FOR ALL TO authenticated
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- profiles: admin can select all profiles
CREATE POLICY "admin_profiles_select" ON public.profiles FOR SELECT TO authenticated
  USING (is_super_admin());

-- profiles: admin can update any profile
CREATE POLICY "admin_profiles_update" ON public.profiles FOR UPDATE TO authenticated
  USING (is_super_admin());

-- organizations: admin can select all orgs
CREATE POLICY "admin_orgs_select" ON public.organizations FOR SELECT TO authenticated
  USING (is_super_admin());

-- organizations: admin can update any org
CREATE POLICY "admin_orgs_update" ON public.organizations FOR UPDATE TO authenticated
  USING (is_super_admin());

-- audit_logs: super admin can select all
CREATE POLICY "admin_audit_logs_select" ON public.audit_logs FOR SELECT TO authenticated
  USING (is_super_admin());

-- prompt_memory: admin can select all and delete
CREATE POLICY "admin_prompts_select" ON public.prompt_memory FOR SELECT TO authenticated
  USING (is_super_admin());

CREATE POLICY "admin_prompts_delete" ON public.prompt_memory FOR DELETE TO authenticated
  USING (is_super_admin());

-- saas_specs: admin can select all and delete
CREATE POLICY "admin_specs_select" ON public.saas_specs FOR SELECT TO authenticated
  USING (is_super_admin());

CREATE POLICY "admin_specs_delete" ON public.saas_specs FOR DELETE TO authenticated
  USING (is_super_admin());
