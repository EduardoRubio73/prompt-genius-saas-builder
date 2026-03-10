
-- Fix trigger_reward_referral: resolve plan_tier via JOIN instead of non-existent 'plan' column
CREATE OR REPLACE FUNCTION public.trigger_reward_referral()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_tier public.plan_tier;
begin
  -- Resolve plan_tier from billing_prices → billing_products
  SELECT bp.plan_tier INTO v_tier
  FROM public.billing_products bp
  JOIN public.billing_prices bpr ON bpr.product_id = bp.id
  WHERE bpr.id = new.price_id;

  IF new.status = 'active' AND v_tier IS NOT NULL AND v_tier <> 'free' THEN
    PERFORM reward_referral_if_paid(new.org_id);
  END IF;

  RETURN new;
end;
$function$;

-- Recreate trigger as AFTER INSERT OR UPDATE (was UPDATE only)
DROP TRIGGER IF EXISTS trg_reward_referral ON public.billing_subscriptions;
CREATE TRIGGER trg_reward_referral
  AFTER INSERT OR UPDATE ON public.billing_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_reward_referral();
