

## Correção completa do sistema Stripe

### Estado atual do banco
- 4 produtos (`prod_free`, `prod_starter`, `prod_pro`, `prod_enterprise`) — todos com `is_active = false`
- 3 preços com `stripe_price_id` preenchido e `is_active = true`
- Todos já têm `stripe_product_id` no Stripe
- **Nenhum** `STRIPE_SECRET_KEY` nos secrets do projeto — as Edge Functions vão falhar sem isso

### Correções

#### 1. `stripe-sync-products/index.ts` — Reescrever (Supabase → Stripe)
- SDK: `stripe@14.21.0` (v16 causa crash `Deno.core.runMicrotasks()`)
- Nova lógica:
  - Ler todos `billing_products` e `billing_prices` do Supabase
  - Para cada produto **sem** `stripe_product_id`: criar no Stripe, salvar ID
  - Para cada produto **com** `stripe_product_id`: fazer `stripe.products.update()` com nome atualizado
  - Para cada preço **sem** `stripe_price_id`: criar no Stripe, salvar ID
  - Após sync, ativar preços e produtos no banco
  - Retornar resumo `{ created, updated }`

#### 2. `update-billing-plan/index.ts` — Adicionar Stripe
- Importar Stripe SDK v14.21.0
- Se produto tem `stripe_product_id` → `stripe.products.update()`; senão → `stripe.products.create()` e salvar
- Se preço mudou `unit_amount` e tem `stripe_price_id` → criar novo Price no Stripe (imutável), desativar antigo
- Se não tem `stripe_price_id` → `stripe.prices.create()` e salvar
- Buscar dados existentes do banco antes de atualizar

#### 3. `create-billing-plan/index.ts` — Fix SDK
- Mudar `stripe@16.12.0` para `stripe@14.21.0`

#### 4. `supabase/config.toml` — Adicionar funções faltantes
```toml
[functions.create-billing-plan]
verify_jwt = false
[functions.update-billing-plan]
verify_jwt = false
[functions.stripe-sync-products]
verify_jwt = false
[functions.stripe-test-connection]
verify_jwt = false
```

#### 5. Ativar produtos no banco (data update)
```sql
UPDATE billing_products SET is_active = true 
WHERE id IN ('prod_free','prod_starter','prod_pro','prod_enterprise');
```
Os triggers permitem porque os preços já estão ativos com `stripe_price_id`.

### Pré-requisito do usuário
Adicionar `STRIPE_SECRET_KEY` no painel Supabase → Settings → Edge Functions. Sem isso, nenhuma função Stripe vai funcionar.

### Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/stripe-sync-products/index.ts` | Reescrever: Supabase→Stripe, SDK v14 |
| `supabase/functions/update-billing-plan/index.ts` | Adicionar Stripe create/update |
| `supabase/functions/create-billing-plan/index.ts` | SDK v16→v14 |
| `supabase/config.toml` | Adicionar 4 entries |
| Data update | `is_active = true` nos produtos |

