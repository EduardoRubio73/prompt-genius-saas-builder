

## Plan: Fix referral code generation + share button

### Root Cause

The `generate_referral_code` database function has a bug on this line:

```sql
select plan into v_plan from organizations where id = p_org_id;
```

The column `plan` does not exist in the `organizations` table -- it's called `plan_tier`. This means `v_plan` is always NULL, and the function always returns `'plan_required'`, so the referral code is never loaded on the frontend.

### Changes

#### 1. Database migration -- Fix `generate_referral_code` function

Update the function to use `plan_tier` instead of `plan`:

```sql
select plan_tier into v_plan from organizations where id = p_org_id;
```

#### 2. `src/pages/ReferralPage.tsx` -- Improve share button logic

Update the "Compartilhar convite" button to always copy the referral link (with `?ref=CODE`) when available. Also update `sharePlatform` to include the referral code if present, so both share paths include the code.

| Target | Action |
|--------|--------|
| DB function `generate_referral_code` | Fix column name `plan` -> `plan_tier` |
| `src/pages/ReferralPage.tsx` | Update `sharePlatform` to use `referralLink` when available |

