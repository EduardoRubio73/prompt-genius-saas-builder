
CREATE OR REPLACE FUNCTION public.sync_org_plan()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_plan_tier     public.plan_tier;
    v_token_limit   integer;
    v_max_members   integer;
    v_plan_credits  integer;
BEGIN

    SELECT 
        p.plan_tier,
        p.credits_limit
    INTO
        v_plan_tier,
        v_plan_credits
    FROM public.billing_products p
    JOIN public.billing_prices pr 
        ON pr.product_id = p.id
    WHERE pr.id = NEW.price_id;

    v_token_limit := CASE v_plan_tier
        WHEN 'free'       THEN 10000
        WHEN 'starter'    THEN 100000
        WHEN 'pro'        THEN 500000
        WHEN 'enterprise' THEN 9999999
        ELSE 10000
    END;

    v_max_members := CASE v_plan_tier
        WHEN 'free'       THEN 1
        WHEN 'starter'    THEN 3
        WHEN 'pro'        THEN 10
        WHEN 'enterprise' THEN 999
        ELSE 1
    END;

    IF NEW.status IN ('active', 'trialing') THEN
        UPDATE public.organizations SET
            plan_tier           = v_plan_tier,
            monthly_token_limit = v_token_limit,
            max_members         = v_max_members,
            plan_credits_total  = v_plan_credits,
            plan_credits_reset_at = NEW.current_period_end,
            account_status      = 'active',
            updated_at          = now()
        WHERE id = NEW.org_id;
    END IF;

    IF NEW.status IN ('canceled', 'unpaid', 'incomplete_expired') THEN
        UPDATE public.organizations SET
            plan_tier           = 'free',
            monthly_token_limit = 10000,
            max_members         = 1,
            plan_credits_total  = 0,
            account_status      = 'churned',
            updated_at          = now()
        WHERE id = NEW.org_id;
    END IF;

    RETURN NEW;

END;
$function$;
