
-- Part 1: Fix display_name for products with empty strings
UPDATE billing_products SET display_name = 'Starter' WHERE id = 'ab16c3f3-1a0c-4c08-b5e6-34c6120c6b64' AND (display_name = '' OR display_name IS NULL);
UPDATE billing_products SET display_name = 'Pro' WHERE id = '96f89186-de4a-4f0b-b9f7-7030a931fb0a' AND (display_name = '' OR display_name IS NULL);
UPDATE billing_products SET display_name = 'Enterprise' WHERE id = 'bc3c19d6-125a-4963-a7ef-e618174123a1' AND (display_name = '' OR display_name IS NULL);
UPDATE billing_products SET display_name = 'Free' WHERE id = '5776763f-a768-4262-b57c-7f864e405911' AND display_name IS NULL;

-- Part 2: Reconcile referral bonus from extra_balance to bonus_credits_total
UPDATE organizations SET bonus_credits_total = bonus_credits_total + 5 WHERE id = 'fb2237bd-3b98-4cbf-b1a2-21a1cba465de';
UPDATE org_credits SET extra_balance = extra_balance - 5 WHERE org_id = 'fb2237bd-3b98-4cbf-b1a2-21a1cba465de' AND extra_balance >= 5;

UPDATE organizations SET bonus_credits_total = bonus_credits_total + 5 WHERE id = '5b1488f5-5d3c-45ab-acdf-93f151c32111';
UPDATE org_credits SET extra_balance = extra_balance - 5 WHERE org_id = '5b1488f5-5d3c-45ab-acdf-93f151c32111' AND extra_balance >= 5;

-- Part 3: Insert missing ledger entries for referral bonuses
INSERT INTO credit_transactions (org_id, user_id, origin, amount, is_bonus, description, reference_id, reference_type)
VALUES
  ('fb2237bd-3b98-4cbf-b1a2-21a1cba465de', '6908e8cf-7205-4efc-a5b2-a68580e433f5', 'referral_gave', 5, true, 'Bônus de indicação (primeira indicação confirmada)', 'f7f50f31-1d91-41a9-95fc-e85b05979770', 'referral'),
  ('5b1488f5-5d3c-45ab-acdf-93f151c32111', 'bf13593e-6f5a-4654-90ba-86c85084283f', 'referral_got', 5, true, 'Bônus de boas-vindas (indicado por GENIUS-C9A45F)', 'f7f50f31-1d91-41a9-95fc-e85b05979770', 'referral');

-- Part 4: Fix reward_referral_if_paid to use bonus_credits_total instead of add_extra_credits
CREATE OR REPLACE FUNCTION public.reward_referral_if_paid(p_org_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    v_ref record;
    v_total integer;
    v_blocks integer;
    v_paid integer;
    v_first_paid boolean;
begin

for v_ref in
select r.*, rc.user_id as referrer_user, rc.org_id as referrer_org
from public.referrals r
join public.referral_codes rc on rc.id = r.referrer_code_id
where r.invitee_org_id = p_org_id
and r.status = 'trial'
loop

    select referral_first_bonus_paid
    into v_first_paid
    from organizations
    where id = v_ref.referrer_org;

    if v_first_paid = false then

        -- Credit referrer bonus_credits_total + ledger
        update organizations
        set bonus_credits_total = bonus_credits_total + 5
        where id = v_ref.referrer_org;

        insert into credit_transactions (org_id, user_id, origin, amount, is_bonus, description, reference_id, reference_type)
        values (v_ref.referrer_org, v_ref.referrer_user, 'referral_gave', 5, true,
                'Bônus de indicação (primeira indicação confirmada)', v_ref.id, 'referral');

        -- Credit invitee bonus_credits_total + ledger
        update organizations
        set bonus_credits_total = bonus_credits_total + 5
        where id = p_org_id;

        insert into credit_transactions (org_id, user_id, origin, amount, is_bonus, description, reference_id, reference_type)
        values (p_org_id, v_ref.invitee_user_id, 'referral_got', 5, true,
                'Bônus de boas-vindas (indicação)', v_ref.id, 'referral');

        update organizations
        set referral_first_bonus_paid = true
        where id = v_ref.referrer_org;

    end if;

    update public.referrals
    set status = 'rewarded',
        rewarded_at = now()
    where id = v_ref.id;

    select count(*)
    into v_total
    from referrals
    where referrer_org_id = v_ref.referrer_org
    and status = 'rewarded';

    v_blocks := floor(v_total / 10);

    select referral_rewards_paid
    into v_paid
    from organizations
    where id = v_ref.referrer_org;

    if v_blocks > v_paid then

        update organizations
        set bonus_credits_total = bonus_credits_total + 10
        where id = v_ref.referrer_org;

        insert into credit_transactions (org_id, user_id, origin, amount, is_bonus, description, reference_type)
        values (v_ref.referrer_org, v_ref.referrer_user, 'referral_gave', 10, true,
                'Bônus de marco: ' || (v_blocks * 10) || ' indicações confirmadas', 'referral_milestone');

        update organizations
        set referral_rewards_paid = v_blocks
        where id = v_ref.referrer_org;

    end if;

end loop;

end;
$function$;
