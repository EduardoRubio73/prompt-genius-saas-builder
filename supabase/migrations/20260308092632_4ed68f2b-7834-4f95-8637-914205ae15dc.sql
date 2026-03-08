
-- 1. Insert phone verification (bypasses RLS for signup flow)
CREATE OR REPLACE FUNCTION public.insert_phone_verification(
  p_user_id uuid, p_phone text, p_code text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.phone_verifications (user_id, phone, code, expires_at)
  VALUES (p_user_id, p_phone, p_code, now() + interval '10 minutes');
END;
$$;

-- 2. Get WhatsApp config (public access to specific admin_settings)
CREATE OR REPLACE FUNCTION public.get_whatsapp_config()
RETURNS TABLE(key text, value text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.key, s.value
  FROM public.admin_settings s
  WHERE s.category = 'whatsapp'
    AND s.key IN ('evolution_api_url', 'evolution_api_key', 'evolution_instance');
$$;

-- 3. Verify phone code (handles SELECT + UPDATE atomically)
CREATE OR REPLACE FUNCTION public.verify_phone_code(p_user_id uuid, p_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_record record;
BEGIN
  SELECT id, code, expires_at, attempts
  INTO v_record
  FROM public.phone_verifications
  WHERE user_id = p_user_id
    AND verified_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 'expired';
  END IF;

  IF v_record.attempts >= 5 THEN
    RETURN 'too_many_attempts';
  END IF;

  IF v_record.code != p_code THEN
    UPDATE public.phone_verifications
    SET attempts = COALESCE(v_record.attempts, 0) + 1
    WHERE id = v_record.id;
    RETURN 'wrong_code:' || (COALESCE(v_record.attempts, 0) + 1)::text;
  END IF;

  -- Mark as verified
  UPDATE public.phone_verifications
  SET verified_at = now()
  WHERE id = v_record.id;

  -- Update profile celular
  UPDATE public.profiles
  SET celular = (
    SELECT phone FROM public.phone_verifications WHERE id = v_record.id
  )
  WHERE id = p_user_id;

  RETURN 'ok';
END;
$$;
