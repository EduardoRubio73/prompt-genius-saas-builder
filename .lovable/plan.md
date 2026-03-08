

## Diagnosis

**Current DB state for your org:**
- `plan_credits_total`: 56, `plan_credits_used`: 22 → plan remaining: 34
- `bonus_credits_total`: 6, `bonus_credits_used`: 0 → bonus remaining: 6
- `extra_balance`: 0

**Two problems found:**

### 1. Latest purchase not processed
Your most recent purchase (`f3dfee14`, 5 credits) has `status = 'pending'` — the Stripe webhook still isn't triggering `process_credit_purchase`. The credits were never added.

**Fix:** Process this purchase manually (same approach as before), adding 5 to `bonus_credits_total` (6 → 11) and marking the purchase as `paid`.

### 2. Dashboard doesn't show bonus credits in the total
The Dashboard "Cotas Restantes" card shows `creditsRemaining + extraCredits` (plan + extra_balance) but **excludes `bonusRemaining`**. So even after the manual fix added 5 bonus credits earlier, you never saw them reflected.

Similarly, ProfilePage line 459 shows only `credits_remaining` (plan only).

**Fix in `src/pages/Dashboard.tsx`:**
- Line 287: Include bonus in the displayed remaining: `creditsRemaining + bonusRemaining + extraCredits`
- Line 353: Same for the summary card value
- Line 440: Same for mode action cards

**Fix in `src/pages/ProfilePage.tsx`:**
- Line 459: Show `total_remaining` instead of `credits_remaining`

### 3. Long-term: Configure Stripe Webhook
Without the webhook, every topup purchase will remain `pending`. You must configure:
- **URL:** `https://pcaebfncvuvdguyjmyxm.supabase.co/functions/v1/stripe-sync`
- **Events:** `checkout.session.completed`, `invoice.payment_succeeded`

## Implementation Order
1. Process pending purchase `f3dfee14` via SQL insert tool
2. Fix Dashboard and ProfilePage to display `total_remaining` (includes plan + bonus + extra)

