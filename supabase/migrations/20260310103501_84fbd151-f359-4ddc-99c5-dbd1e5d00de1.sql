
-- 1. Fix add_extra_credits (wrong column names: organization_id→org_id, type/source→origin)
CREATE OR REPLACE FUNCTION public.add_extra_credits(p_org_id uuid, p_credits integer, p_source text DEFAULT 'stripe_topup'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_balance integer;
begin
  -- ensure org_credits row exists
  insert into org_credits (org_id, balance, extra_balance, updated_at)
  values (p_org_id, 0, 0, now())
  on conflict (org_id) do nothing;

  -- add extra credits
  update org_credits
  set
    extra_balance = coalesce(extra_balance, 0) + p_credits,
    updated_at = now()
  where org_id = p_org_id
  returning extra_balance into v_balance;
end;
$function$;

-- 2. Fix process_credit_purchase to use extra_balance instead of bonus_credits_total
CREATE OR REPLACE FUNCTION public.process_credit_purchase(p_purchase_id uuid, p_stripe_pi_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_purchase  public.credit_purchases%ROWTYPE;
    v_pack      public.credit_packs%ROWTYPE;
    v_new_extra integer;
    v_balance_after integer;
BEGIN
    SELECT * INTO v_purchase FROM public.credit_purchases
    WHERE id = p_purchase_id AND status = 'pending';

    IF NOT FOUND THEN RETURN; END IF;

    SELECT * INTO v_pack FROM public.credit_packs WHERE id = v_purchase.pack_id;

    -- Mark purchase as paid
    UPDATE public.credit_purchases SET
        status    = 'paid',
        paid_at   = now(),
        stripe_payment_intent_id = p_stripe_pi_id
    WHERE id = p_purchase_id;

    -- Add to extra_balance (NOT bonus_credits_total)
    INSERT INTO public.org_credits (org_id, balance, extra_balance, updated_at)
    VALUES (v_purchase.org_id, 0, 0, now())
    ON CONFLICT (org_id) DO NOTHING;

    UPDATE public.org_credits SET
        extra_balance = extra_balance + v_purchase.credits_granted,
        updated_at = now()
    WHERE org_id = v_purchase.org_id
    RETURNING extra_balance INTO v_new_extra;

    -- Calculate total balance after
    SELECT v_new_extra + GREATEST(0, o.plan_credits_total - o.plan_credits_used)
    INTO v_balance_after
    FROM public.organizations o
    WHERE o.id = v_purchase.org_id;

    -- Ledger entry
    INSERT INTO public.credit_transactions
        (org_id, user_id, origin, amount, is_bonus, description, reference_id, reference_type, balance_after)
    VALUES (
        v_purchase.org_id, v_purchase.user_id,
        'purchase', v_purchase.credits_granted, false,
        'Compra de pacote: ' || v_pack.display_name,
        p_purchase_id, 'credit_purchase',
        v_balance_after
    );
END;
$function$;

-- 3. Migrate existing data: move purchased credits from bonus_credits_total to extra_balance
WITH purchased AS (
    SELECT org_id, SUM(credits_granted)::integer as total
    FROM credit_purchases WHERE status = 'paid'
    GROUP BY org_id
)
UPDATE organizations o SET
    bonus_credits_total = GREATEST(0, bonus_credits_total - p.total),
    updated_at = now()
FROM purchased p
WHERE o.id = p.org_id;

WITH purchased AS (
    SELECT org_id, SUM(credits_granted)::integer as total
    FROM credit_purchases WHERE status = 'paid'
    GROUP BY org_id
)
UPDATE org_credits oc SET
    extra_balance = extra_balance + p.total,
    updated_at = now()
FROM purchased p
WHERE oc.org_id = p.org_id;

-- 4. Process the pending 40-credit purchase (pi_3T9NLtBmEyQZSY7V0rs02wqq)
-- Mark as paid
UPDATE public.credit_purchases SET
    status = 'paid',
    paid_at = now(),
    stripe_payment_intent_id = 'pi_3T9NLtBmEyQZSY7V0rs02wqq'
WHERE id = 'b78fafd5-5fb7-428f-8fbe-75d2bb32caee'
  AND status = 'pending';

-- Add 40 credits to extra_balance
UPDATE public.org_credits SET
    extra_balance = extra_balance + 40,
    updated_at = now()
WHERE org_id = 'fb2237bd-3b98-4cbf-b1a2-21a1cba465de';

-- Ledger entry for the 40-credit purchase
INSERT INTO public.credit_transactions
    (org_id, user_id, origin, amount, is_bonus, description, reference_id, reference_type, balance_after)
VALUES (
    'fb2237bd-3b98-4cbf-b1a2-21a1cba465de',
    '6908e8cf-7205-4efc-a5b2-a68580e433f5',
    'purchase', 40, false,
    'Compra de pacote: 40 Créditos',
    'b78fafd5-5fb7-428f-8fbe-75d2bb32caee', 'credit_purchase',
    (SELECT extra_balance + GREATEST(0, o.plan_credits_total - o.plan_credits_used)
     FROM org_credits oc
     JOIN organizations o ON o.id = oc.org_id
     WHERE oc.org_id = 'fb2237bd-3b98-4cbf-b1a2-21a1cba465de')
);
