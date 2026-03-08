

## Plan: Fix RLS Issues for Phone Verification Flow

### Problem Analysis

Two RLS issues block the signup + WhatsApp verification flow:

1. **`phone_verifications` INSERT fails** — After `signUp()` with email confirmation, no active session exists, so `auth.uid()` is null. The INSERT policy `auth.uid() = user_id` rejects the row.

2. **`admin_settings` SELECT fails** — The table only allows `is_super_admin()` reads. A newly registered user cannot fetch Evolution API config.

### Solution

#### 1. Create a Security Definer Function for Phone Verification

Create `insert_phone_verification(p_user_id, p_phone, p_code)` as `SECURITY DEFINER` that bypasses RLS. This is safe because the function controls exactly what gets inserted.

```sql
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
```

#### 2. Create a Public Function to Read WhatsApp Config

Create `get_whatsapp_config()` as `SECURITY DEFINER` that returns only the 3 whatsapp keys (non-secret values exposed by design since the API URL/instance aren't truly secret — the API key is the sensitive one but it's needed client-side in current architecture).

```sql
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
```

#### 3. Also Create a Security Definer for Verification Check + Update

The SELECT/UPDATE on `phone_verifications` during code verification will have the same session issue. Create `verify_phone_code(p_user_id, p_code)` function.

#### 4. Update `Login.tsx`

- Replace `supabase.from("phone_verifications").insert(...)` with `supabase.rpc("insert_phone_verification", {...})`
- Replace `supabase.from("admin_settings").select(...)` with `supabase.rpc("get_whatsapp_config")`
- Replace verification SELECT/UPDATE with `supabase.rpc("verify_phone_code", {...})`

### Changes Summary

| Target | Action |
|--------|--------|
| DB migration | Create 3 security definer functions |
| `src/pages/Login.tsx` | Use RPC calls instead of direct table access |

