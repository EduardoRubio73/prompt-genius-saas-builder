

## Plan: Implement WhatsApp Verification on Login.tsx

### What will be done

Replace `src/pages/Login.tsx` entirely with the code from the uploaded instruction file. This adds:

1. **New signup fields**: Full name + WhatsApp number (with DDD)
2. **WhatsApp verification modal**: 6 individual digit inputs with keyboard navigation, paste support, backspace handling, and resend cooldown (60s)
3. **Evolution API integration**: Sends 6-digit verification code via WhatsApp using env vars (`VITE_EVOLUTION_API_URL`, `VITE_EVOLUTION_API_KEY`, `VITE_EVOLUTION_INSTANCE`)
4. **Verification flow**: Code stored in `phone_verifications` table (already exists in DB), validated against expiry and attempt limits (max 5)

### Security Note

The current implementation calls the Evolution API directly from the frontend, exposing the API key in client-side code. This is acceptable for development/staging per the project context, but should be moved to an Edge Function before production.

### Changes

| File | Action |
|------|--------|
| `src/pages/Login.tsx` | Full replacement with new code from instruction |

No other files need to be modified. All imports already exist in the project. The DB schema changes (`phone_verifications` table, `celular` column type) are already applied per the instruction.

### Environment Variables Required

The user must configure these in Lovable secrets:
- `VITE_EVOLUTION_API_URL`
- `VITE_EVOLUTION_API_KEY`
- `VITE_EVOLUTION_INSTANCE`

