
-- Revoke direct INSERT, SELECT, UPDATE on phone_verifications from client roles
REVOKE INSERT ON public.phone_verifications FROM anon, authenticated;
REVOKE SELECT ON public.phone_verifications FROM anon, authenticated;
REVOKE UPDATE ON public.phone_verifications FROM anon, authenticated;

-- Drop orphaned RLS policies
DROP POLICY IF EXISTS "Users can insert own verifications" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can view own verifications status" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can update own verifications" ON public.phone_verifications;
