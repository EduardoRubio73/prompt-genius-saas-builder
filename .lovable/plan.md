

## Plan: Remove activate/deactivate from Prices tab, sync with Products

### Problem
The Prices tab has its own activate/deactivate toggle, causing confusion. Only Products (Planos) should control active status — prices should follow their product's status automatically.

### Changes

**1. `src/pages/admin/AdminBilling.tsx` — PricesTab**
- Remove the `togglePriceActive` function
- Remove the clickable Status badge (replace with a read-only badge that reflects the product's `is_active` status)
- Keep only the value editing functionality in Ações

**2. `src/hooks/admin/useAdminData.ts` — useAdminPrices**
- Enrich price data with the product's `is_active` status so the Prices tab can show it as read-only

**3. `src/pages/admin/AdminBilling.tsx` — ProductsTab toggleActive**
- When toggling a product's active status, also update all associated prices in `billing_prices` to match (active product → activate prices, inactive product → deactivate prices)

### Files

| File | Change |
|------|--------|
| `src/hooks/admin/useAdminData.ts` | Add `product_is_active` to price enrichment |
| `src/pages/admin/AdminBilling.tsx` | Remove price toggle; make status read-only; cascade product toggle to prices |

