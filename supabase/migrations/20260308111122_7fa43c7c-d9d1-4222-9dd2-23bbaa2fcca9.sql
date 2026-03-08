
-- 1. Fix handle_new_user to create org_credits row
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    new_org_id uuid;
    user_slug  text;
    base_name  text;
BEGIN
    base_name := coalesce(
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1),
        'user'
    );

    user_slug := lower(regexp_replace(base_name, '[^a-z0-9]', '-', 'g'))
                 || '-' || substring(gen_random_uuid()::text, 1, 6);

    -- Criar org com trial de 7 dias e 5 créditos
    INSERT INTO public.organizations (
        name, slug, plan_tier,
        monthly_token_limit, max_members, is_active,
        account_status, trial_started_at, trial_ends_at,
        plan_credits_total, plan_credits_used,
        bonus_credits_total, bonus_credits_used,
        plan_credits_reset_at
    ) VALUES (
        base_name, user_slug, 'free',
        10000, 1, true,
        'trial', now(), now() + interval '7 days',
        5, 0,
        0, 0,
        now() + interval '1 month'
    )
    RETURNING id INTO new_org_id;

    -- Create org_credits row
    INSERT INTO public.org_credits (org_id, balance, extra_balance)
    VALUES (new_org_id, 5, 0);

    INSERT INTO public.profiles (id, email, full_name, personal_org_id, onboarded)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', new_org_id, false);

    INSERT INTO public.org_members (org_id, user_id, role, accepted_at)
    VALUES (new_org_id, NEW.id, 'owner', now());

    -- Gerar código de indicação automaticamente
    PERFORM public.generate_referral_code(new_org_id, NEW.id);

    RETURN NEW;

EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user error: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$function$;

-- 2. Fix consume_credit to use LEFT JOIN and handle missing org_credits
CREATE OR REPLACE FUNCTION public.consume_credit(p_org_id uuid, p_user_id uuid, p_session_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_total integer;
  v_used integer;
  v_remaining integer;
  v_extra integer;
  v_balance_after integer;
begin
  select plan_credits_total, plan_credits_used
    into v_total, v_used
  from organizations
  where id = p_org_id
  for update;

  v_remaining := coalesce(v_total,0) - coalesce(v_used,0);

  -- Ensure org_credits row exists
  INSERT INTO org_credits (org_id, balance, extra_balance)
  VALUES (p_org_id, 0, 0)
  ON CONFLICT (org_id) DO NOTHING;

  if v_remaining > 0 then
    update organizations
       set plan_credits_used = plan_credits_used + 1
     where id = p_org_id;
  else
    select extra_balance
      into v_extra
    from org_credits
    where org_id = p_org_id
    for update;

    if coalesce(v_extra,0) <= 0 then
      raise exception 'no_credits';
    end if;

    update org_credits
       set extra_balance = extra_balance - 1
     where org_id = p_org_id;
  end if;

  select greatest(o.plan_credits_total - o.plan_credits_used, 0) + coalesce(oc.extra_balance, 0)
    into v_balance_after
  from organizations o
  left join org_credits oc on oc.org_id = o.id
  where o.id = p_org_id;

  insert into credit_transactions (
    org_id,
    user_id,
    origin,
    amount,
    is_bonus,
    description,
    reference_id,
    reference_type,
    balance_after
  ) values (
    p_org_id,
    p_user_id,
    'ai_session',
    -1,
    false,
    'Consumo de cota para sessão de IA',
    p_session_id,
    'session',
    v_balance_after
  );

  update org_credits
     set balance = v_balance_after
   where org_id = p_org_id
     and balance is distinct from v_balance_after;
end;
$function$;

-- 3. Backfill missing org_credits rows for existing orgs
INSERT INTO org_credits (org_id, balance, extra_balance)
SELECT o.id, GREATEST(0, o.plan_credits_total - o.plan_credits_used), 0
FROM organizations o
WHERE NOT EXISTS (SELECT 1 FROM org_credits oc WHERE oc.org_id = o.id);
