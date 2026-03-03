create or replace view public.v_active_stripe_plans as
select
  bp.id as product_id,
  bp.name,
  bp.display_name,
  bp.plan_tier,
  bpr.id as price_id,
  bp.stripe_product_id,
  bpr.stripe_price_id,
  bpr.unit_amount,
  bpr.recurring_interval,
  bp.sort_order
from public.billing_products bp
join public.billing_prices bpr on bpr.product_id = bp.id
where bp.is_active = true
  and bpr.is_active = true;

grant select on public.v_active_stripe_plans to anon, authenticated, service_role;
