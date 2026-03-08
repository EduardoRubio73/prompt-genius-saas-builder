

## Plan: Move WhatsApp Verification from Signup to Login

### Current Problem
The WhatsApp OTP verification currently happens **during signup** (after `signUp()`), which fails because:
1. The user has no active session yet (email not confirmed)
2. The Evolution API config may not be set up, causing "Falha ao enviar WhatsApp"
3. It blocks account creation unnecessarily

### Correct Flow
The user wants verification to happen at **first login**, not at signup:

1. **Signup**: Create account with name + celular, save celular to profile. Show success message asking user to confirm email. **No WhatsApp code sent.**
2. **Login**: After successful `signInWithPassword`, check if the user's phone is verified (via `phone_verifications` table). If not verified, send WhatsApp code and show the OTP modal. Only allow navigation to `/dashboard` after verification.

### Changes

#### 1. Update `Login.tsx` - Signup Flow
- Remove `createAndSendCode()` call from signup block
- Remove the verify modal trigger from signup
- Just show a toast: "Conta criada! Confirme seu e-mail para acessar."

#### 2. Update `Login.tsx` - Login Flow
After successful `signInWithPassword` + active account check:
- Query `phone_verifications` to check if user has a verified record (`verified_at IS NOT NULL`)
- If **not verified**: fetch celular from `profiles`, call `createAndSendCode()`, show the OTP modal
- If **verified**: proceed to `/dashboard` as normal

#### 3. Update Verify Success Handler
- After successful OTP verification during login, navigate to `/dashboard` instead of just showing a toast

#### 4. Create a Security Definer Function
Create `check_phone_verified(p_user_id)` to check if a user has completed phone verification, since the user is authenticated at login time we could also query directly, but a function keeps it clean.

### Files Changed

| File | Change |
|------|--------|
| DB migration | Create `check_phone_verified` function |
| `src/pages/Login.tsx` | Move WhatsApp verification from signup to login flow |

