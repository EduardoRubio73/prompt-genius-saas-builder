UPDATE public.credit_purchases SET
    status = 'paid',
    paid_at = now(),
    stripe_payment_intent_id = 'manual_fix'
WHERE id = '23eb267e-1fef-468d-bf1d-2d4e3834d8eb' AND status = 'pending';

UPDATE public.organizations SET
    bonus_credits_total = bonus_credits_total + 5,
    updated_at = now()
WHERE id = 'fb2237bd-3b98-4cbf-b1a2-21a1cba465de';

INSERT INTO public.credit_transactions
    (org_id, user_id, origin, amount, is_bonus, description, reference_id, reference_type)
VALUES (
    'fb2237bd-3b98-4cbf-b1a2-21a1cba465de',
    '6908e8cf-7205-4efc-a5b2-a68580e433f5',
    'purchase', 5, true,
    'Compra de pacote processada manualmente',
    '23eb267e-1fef-468d-bf1d-2d4e3834d8eb',
    'credit_purchase'
);