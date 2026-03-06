CREATE OR REPLACE FUNCTION public.generate_referral_code(p_org_id uuid, p_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    v_code text;
    v_exists boolean;
    v_attempts integer := 0;
    v_plan text;
begin

    -- verificar plano atual da organização
    select plan_tier into v_plan
    from organizations
    where id = p_org_id;

    -- bloquear free
    if v_plan is null or v_plan = 'free' then
        return 'plan_required';
    end if;

    -- verificar se já existe código ativo
    select code into v_code
    from referral_codes
    where user_id = p_user_id
    and is_active = true
    limit 1;

    if v_code is not null then
        return v_code;
    end if;

    -- gerar código único
    loop
        v_code := 'GENIUS-' || upper(substring(md5(random()::text),1,6));

        select exists(
            select 1
            from referral_codes
            where code = v_code
        ) into v_exists;

        exit when not v_exists;

        v_attempts := v_attempts + 1;

        if v_attempts > 10 then
            raise exception 'Falha ao gerar código único';
        end if;
    end loop;

    insert into referral_codes (org_id,user_id,code)
    values (p_org_id,p_user_id,v_code);

    return v_code;

end;
$function$;