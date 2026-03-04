
DROP VIEW IF EXISTS public.v_active_stripe_plans;

CREATE VIEW public.v_active_stripe_plans AS
SELECT 
  p.id AS product_id,
  p.name,
  p.display_name,
  p.plan_tier,
  p.sort_order,
  p.is_active AS product_active,
  pr.id AS price_id,
  pr.stripe_price_id,
  pr.unit_amount,
  pr.recurring_interval,
  pr.is_active AS price_active
FROM billing_products p
LEFT JOIN billing_prices pr ON pr.product_id = p.id
ORDER BY p.sort_order;
