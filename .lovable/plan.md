

## Plan: Fix Profile Billing Tab — Use Quotas + Dynamic Plans from DB

### Problem
The "Plano & Cobrança" tab on `/profile?tab=billing`:
1. Shows **token consumption** (0/10.000 tokens) instead of **quota/cotas** balance
2. Has **hardcoded** plan cards (Free/Pro/Enterprise) instead of fetching from `billing_products` like the landing page
3. Missing detailed plan info (prompts, SaaS specs, misto, build labels)

### Solution

**Rewrite `BillingTab` in `ProfilePage.tsx`:**

1. **Replace token budget with quota balance** — use `useQuotaBalance` hook instead of `useTokenBudget`. Show plan quotas used/total + bonus quotas used/total, matching the `QuotaCard` style on the dashboard.

2. **Fetch plans dynamically from `billing_products`** — same query as landing page: `billing_products` with `billing_prices(unit_amount)`, ordered by `sort_order`. Show `display_name`, price, `total_quotas_label`, `period_label`, `trial_label`, feature rows (prompts, saas_specs, misto, build, members labels).

3. **Highlight current plan** — compare user's org `plan_tier` with each product's `plan_tier` to mark the current one.

4. **Upgrade button** — for non-current plans, link to `stripe_payment_link` if available, otherwise show disabled button.

### Files to Edit

| File | Change |
|------|--------|
| `src/pages/ProfilePage.tsx` | Rewrite `BillingTab`: replace `useTokenBudget` with `useQuotaBalance`, fetch `billing_products` dynamically, show quota bars + detailed plan cards |

### Implementation Details

- Import `useQuotaBalance` from `@/hooks/useQuotaBalance`
- Fetch org's `plan_tier` from `organizations` table via profile's `personal_org_id`
- Show two progress bars: "Cotas do Plano" (plan_used/plan_total) and "Cotas Bônus" (bonus_used/bonus_total)
- Plan cards: 3-column grid with all labels from DB, matching landing page info
- Current plan highlighted with primary border + "ATUAL" badge

