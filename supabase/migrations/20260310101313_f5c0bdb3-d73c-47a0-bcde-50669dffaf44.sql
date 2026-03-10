CREATE POLICY "admin_credit_transactions_select"
ON public.credit_transactions
FOR SELECT
TO authenticated
USING (is_super_admin());