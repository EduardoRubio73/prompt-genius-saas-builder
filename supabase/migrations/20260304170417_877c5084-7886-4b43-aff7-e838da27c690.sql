
-- 1. Function to auto-create org_credits when a subscription is inserted
create or replace function public.ensure_org_credits()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.org_credits (org_id, balance)
  select
    new.org_id,
    coalesce(bp.credits_limit, 0)
  from billing_prices pr
  join billing_products bp on bp.id = pr.product_id
  where pr.id = new.price_id
  and not exists (
    select 1 from public.org_credits where org_id = new.org_id
  );

  return new;
end;
$$;

-- 2. Trigger on billing_subscriptions insert
drop trigger if exists trg_create_org_credits on public.billing_subscriptions;
create trigger trg_create_org_credits
after insert on public.billing_subscriptions
for each row
execute function public.ensure_org_credits();

-- 3. Function to reset credits for all active subscriptions (for cron usage)
create or replace function public.reset_org_credits_bulk()
returns void
language plpgsql
security definer
as $$
begin
  update public.org_credits oc
  set balance = bp.credits_limit,
      updated_at = now()
  from billing_subscriptions bs
  join billing_prices pr on pr.id = bs.price_id
  join billing_products bp on bp.id = pr.product_id
  where bs.org_id = oc.org_id
  and bs.status = 'active'
  and now() >= bs.current_period_start;
end;
$$;
