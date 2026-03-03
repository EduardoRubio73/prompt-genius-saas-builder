
-- Populate billing_products data (using DO block for DML in migration context)
UPDATE public.billing_products SET
  display_name = 'Free', is_featured = false, sort_order = 0,
  total_quotas_label = '5 cotas / mês', prompts_label = '3 / mês', prompts_detail = '(1 cota)',
  saas_specs_label = '1 / mês', saas_specs_detail = '(2 cotas)', misto_label = '—', misto_detail = '',
  build_label = '—', build_detail = '', members_label = '1 membro',
  features = '[{"text":"Trial de 7 dias completo","included":true},{"text":"Código de indicação (+5 cotas)","included":true},{"text":"Few-shot learning","included":false},{"text":"Modo Misto","included":false},{"text":"BUILD Engine","included":false}]'::jsonb,
  trial_label = '✓ 7 dias com recursos Basic', period_label = 'para sempre', cta_label = 'Começar Grátis'
WHERE id = 'prod_free';

UPDATE public.billing_products SET
  display_name = 'Basic', is_featured = false, sort_order = 1,
  total_quotas_label = '35 cotas / mês', prompts_label = '20 / mês', prompts_detail = '(1 cota)',
  saas_specs_label = '5 / mês', saas_specs_detail = '(2 cotas)', misto_label = '3 / mês', misto_detail = '(3 cotas)',
  build_label = '—', build_detail = '', members_label = 'Até 3',
  features = '[{"text":"Few-shot learning","included":true},{"text":"Modo Misto","included":true},{"text":"Código de indicação (+5 cotas)","included":true},{"text":"BUILD Engine","included":false},{"text":"Suporte prioritário","included":false}]'::jsonb,
  trial_label = '✓ 7 dias grátis', period_label = 'por mês', cta_label = 'Assinar Basic'
WHERE id = 'prod_starter';

UPDATE public.billing_products SET
  display_name = 'Pro', is_featured = true, sort_order = 2,
  total_quotas_label = '120 cotas / mês', prompts_label = '60 / mês', prompts_detail = '(1 cota)',
  saas_specs_label = '30 / mês', saas_specs_detail = '(2 cotas)', misto_label = '30 / mês', misto_detail = '(3 cotas)',
  build_label = '24 / mês', build_detail = '(5 cotas)', members_label = 'Até 10',
  features = '[{"text":"Few-shot learning","included":true},{"text":"Modo Misto","included":true},{"text":"BUILD Engine","included":true},{"text":"Código de indicação (+5 cotas)","included":true},{"text":"Suporte prioritário","included":true}]'::jsonb,
  trial_label = '✓ 7 dias grátis', period_label = 'por mês', cta_label = 'Assinar Pro'
WHERE id = 'prod_pro';

UPDATE public.billing_products SET
  display_name = 'Enterprise', is_featured = false, sort_order = 3,
  total_quotas_label = 'Ilimitado', prompts_label = 'Ilimitado', prompts_detail = '',
  saas_specs_label = 'Ilimitado', saas_specs_detail = '', misto_label = 'Ilimitado', misto_detail = '',
  build_label = 'Ilimitado', build_detail = '', members_label = 'Ilimitado',
  features = '[{"text":"Few-shot learning","included":true},{"text":"Modo Misto","included":true},{"text":"BUILD Engine","included":true},{"text":"Código de indicação (+5 cotas)","included":true},{"text":"Suporte dedicado","included":true}]'::jsonb,
  trial_label = '✓ 7 dias grátis', period_label = 'por mês', cta_label = 'Assinar Enterprise'
WHERE id = 'prod_enterprise';
