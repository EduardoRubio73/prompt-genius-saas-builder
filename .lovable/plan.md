

# Enable Google Sign-In + Fix Build Error

## 1. Fix Build Error (Stripe import)

The `create-billing-portal/index.ts` uses `import Stripe from "npm:stripe@14.21.0"` which fails in the Deno environment. Need to switch to esm.sh import like other edge functions likely do.

**File:** `supabase/functions/create-billing-portal/index.ts`
- Change `import Stripe from "npm:stripe@14.21.0"` to `import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"`

## 2. Add Google Sign-In to Login Page

Google OAuth is already enabled in the Supabase dashboard (per the screenshot). Now we need to add the button to the frontend.

**File:** `src/pages/Login.tsx`

- Add a "Entrar com Google" button below the form (after the `</form>` tag, before the toggle link)
- Use `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/genius/dashboard' } })`
- Style with a Google-branded button (white bg, Google icon, border)
- Add a visual separator ("ou") between the form and the Google button

The redirect URL uses `/genius/dashboard` because the app has `basename="/genius"`.

**No database changes needed** — the `handle_new_user` trigger already creates profile/org for new users, which works for OAuth signups too.

**Important note:** The Google OAuth callback URL in the Supabase dashboard must point to `https://pcaebfncvuvdguyjmyxm.supabase.co/auth/v1/callback`, and the Site URL should be set to the published app URL. The screenshot shows this is already configured.

