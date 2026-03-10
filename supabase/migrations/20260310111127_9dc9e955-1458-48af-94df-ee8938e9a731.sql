
-- Add 'trial' to referral_status enum (used by process_referral and reward_referral_if_paid)
ALTER TYPE public.referral_status ADD VALUE IF NOT EXISTS 'trial' AFTER 'pending';
