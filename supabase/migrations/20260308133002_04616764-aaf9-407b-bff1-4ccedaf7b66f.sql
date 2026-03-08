-- Fix: phone_verifications - hide OTP code from SELECT policy
-- Drop existing permissive SELECT policy and replace with one that excludes the code column
-- Since we can't do column-level RLS, we drop the SELECT policy and create a secure view instead

DROP POLICY IF EXISTS "Users can view own verifications" ON public.phone_verifications;

-- New SELECT policy that still allows users to see their own rows
-- The code column remains accessible via SECURITY DEFINER functions (verify_phone_code)
-- but not directly via client queries
CREATE POLICY "Users can view own verifications status"
  ON public.phone_verifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- We need to use a view to hide the code column
CREATE OR REPLACE VIEW public.phone_verifications_status AS
  SELECT id, user_id, phone, created_at, attempts, expires_at, verified_at
  FROM public.phone_verifications;

-- Revoke direct access to phone_verifications from anon and authenticated
-- and grant access to the view instead
REVOKE SELECT ON public.phone_verifications FROM anon, authenticated;

-- Grant select on the safe view
GRANT SELECT ON public.phone_verifications_status TO authenticated;

-- Re-grant INSERT/UPDATE since they are needed for the verification flow
GRANT INSERT, UPDATE ON public.phone_verifications TO authenticated;