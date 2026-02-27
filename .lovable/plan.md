

## Plan: Fix missing SUPABASE_URL fallback in mode pages

The env var `VITE_SUPABASE_URL` is undefined at runtime, causing fetch calls to edge functions to hit an invalid URL that returns HTML instead of JSON.

### Fix

Add fallback values (same as in `client.ts`) to the 3 mode pages:

1. **`src/pages/misto/MistoMode.tsx`** (line 31-32) — Add fallback:
   ```ts
   const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://pcaebfncvuvdguyjmyxm.supabase.co";
   const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGci...";
   ```

2. **`src/pages/prompt/PromptMode.tsx`** (line 21-22) — Same fallback.

3. **`src/pages/saas/SaasMode.tsx`** (line 48-49) — Same fallback.

