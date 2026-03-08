-- 1. Restrict get_whatsapp_config to super_admin only (no longer returns api_key)
CREATE OR REPLACE FUNCTION public.get_whatsapp_config()
RETURNS TABLE(key text, value text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.key, s.value
  FROM public.admin_settings s
  WHERE s.category = 'whatsapp'
    AND s.key IN ('evolution_api_url', 'evolution_instance')
    AND public.is_super_admin();
$$;

-- 2. Fix update_profile_celular: add auth.uid() check
CREATE OR REPLACE FUNCTION public.update_profile_celular(p_user_id uuid, p_celular text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.profiles
  SET celular = p_celular,
      updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- 3. Fix check_phone_verified: restrict to self-check only
CREATE OR REPLACE FUNCTION public.check_phone_verified(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN auth.uid() = p_user_id THEN
      EXISTS (
        SELECT 1
        FROM public.phone_verifications
        WHERE user_id = p_user_id
          AND verified_at IS NOT NULL
      )
    ELSE FALSE
  END;
$$;

-- 4. Revoke anon access to get_whatsapp_config
REVOKE EXECUTE ON FUNCTION public.get_whatsapp_config() FROM anon;