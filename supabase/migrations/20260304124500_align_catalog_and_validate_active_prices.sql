-- Align visible catalog with canonical plan lineup and remove noisy plans

-- 1) Disable noisy test product
UPDATE public.billing_products
SET is_active = false,
    updated_at = now()
WHERE name = 'Plano Teste Atualizado';

-- 2) Canonical naming/tier/order for final catalog state
UPDATE public.billing_products
SET name = 'Free',
    display_name = 'Free',
    plan_tier = 'free',
    sort_order = 0,
    is_active = true,
    updated_at = now()
WHERE id = 'prod_free';

UPDATE public.billing_products
SET name = 'Starter',
    display_name = 'Starter',
    plan_tier = 'starter',
    sort_order = 1,
    is_active = true,
    updated_at = now()
WHERE id = 'prod_starter';

UPDATE public.billing_products
SET name = 'Pro',
    display_name = 'Pro',
    plan_tier = 'pro',
    sort_order = 2,
    is_active = true,
    updated_at = now()
WHERE id = 'prod_pro';

UPDATE public.billing_products
SET name = 'Enterprise',
    display_name = 'Enterprise',
    plan_tier = 'enterprise',
    sort_order = 3,
    is_active = true,
    updated_at = now()
WHERE id = 'prod_enterprise';

-- 3) Deactivate non-canonical products to avoid UI/seed/migration mismatch noise
UPDATE public.billing_products
SET is_active = false,
    updated_at = now()
WHERE id NOT IN ('prod_free', 'prod_starter', 'prod_pro', 'prod_enterprise')
  AND is_active = true;

-- 4) Validate that each active product has at least one active Stripe price
DO $$
DECLARE
  missing_products text;
BEGIN
  SELECT string_agg(bp.id, ', ' ORDER BY bp.sort_order, bp.id)
  INTO missing_products
  FROM public.billing_products bp
  WHERE bp.is_active = true
    AND NOT EXISTS (
      SELECT 1
      FROM public.billing_prices bpr
      WHERE bpr.product_id = bp.id
        AND bpr.is_active = true
        AND bpr.stripe_price_id IS NOT NULL
        AND bpr.stripe_price_id <> ''
    );

  IF missing_products IS NOT NULL THEN
    RAISE EXCEPTION
      'Active billing_products without active billing_prices.stripe_price_id: %',
      missing_products;
  END IF;
END
$$;
