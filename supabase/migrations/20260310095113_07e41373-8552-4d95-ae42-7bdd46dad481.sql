CREATE POLICY "admin_org_members_select"
ON public.org_members
FOR SELECT
TO authenticated
USING (is_super_admin());