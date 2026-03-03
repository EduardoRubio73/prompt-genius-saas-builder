-- Checkout guard helpers: enforce org context from JWT claims + membership

CREATE OR REPLACE FUNCTION public.get_request_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() ->> 'org_id', '')::uuid
$$;

CREATE OR REPLACE FUNCTION public.assert_org_context_access(p_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claim_org_id uuid;
BEGIN
  IF auth.uid() IS NULL OR p_org_id IS NULL THEN
    RETURN false;
  END IF;

  v_claim_org_id := public.get_request_org_id();

  -- If JWT carries an org claim, it must match requested context.
  IF v_claim_org_id IS NOT NULL AND v_claim_org_id <> p_org_id THEN
    RETURN false;
  END IF;

  RETURN p_org_id = ANY(public.get_user_org_ids());
END;
$$;

REVOKE ALL ON FUNCTION public.get_request_org_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assert_org_context_access(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_request_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assert_org_context_access(uuid) TO authenticated;
