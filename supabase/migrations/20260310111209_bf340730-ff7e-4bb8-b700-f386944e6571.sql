
-- 1. Create referral record: cexrubio (referrer) → rsradiotaxi (invitee), status 'trial'
INSERT INTO public.referrals (
  referrer_code_id, referrer_org_id, referrer_user_id,
  invitee_org_id, invitee_user_id, status
) VALUES (
  '1922527b-86fa-4522-907b-e5806021ea8e',
  'fb2237bd-3b98-4cbf-b1a2-21a1cba465de',
  '6908e8cf-7205-4efc-a5b2-a68580e433f5',
  '5b1488f5-5d3c-45ab-acdf-93f151c32111',
  'bf13593e-6f5a-4654-90ba-86c85084283f',
  'trial'
);

-- 2. Create billing_subscription for rsradiotaxi (Starter plan)
-- Triggers: sync_org_plan (plan_tier+credits) + trg_reward_referral (referral bonuses)
INSERT INTO public.billing_subscriptions (
  id, org_id, price_id, status,
  current_period_start, current_period_end,
  metadata
) VALUES (
  'sub_manual_rsradio_' || substring(gen_random_uuid()::text, 1, 8),
  '5b1488f5-5d3c-45ab-acdf-93f151c32111',
  '6bb2e3c2-2d0e-410a-929a-4c5ea5cdae97',
  'active',
  now(),
  now() + interval '1 month',
  '{"stripe_pi": "pi_3T9NlVBmEyQZSY7V0kxNvSxd", "manual_recovery": true}'::jsonb
);
