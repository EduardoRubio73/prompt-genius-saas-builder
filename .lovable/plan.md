

## Plano: Consumir `v_active_stripe_plans` dinamicamente com `credits_limit`

### Problema atual

Os cards de planos na Landing e no ProfilePage usam labels estáticas (`prompts_label`, `saas_specs_label`, etc.) cadastradas manualmente no banco. O usuário quer que os limites sejam **calculados dinamicamente** a partir de `credits_limit` e dos custos por ação (1, 2, 2, 5 cotas).

A view `v_active_stripe_plans` não expõe `credits_limit`, `credit_costs`, nem `credit_unit_cost`.

### Solução

#### 1. Migration: Adicionar colunas numéricas à view

Recriar `v_active_stripe_plans` incluindo `credits_limit`, `credit_unit_cost` e `credit_costs` da tabela `billing_products`, além de `trial_period_days` da `billing_prices`.

#### 2. LandingPage — Calcular limites no frontend

Substituir o uso de `prompts_label`, `saas_specs_label`, etc. por cálculos:

```tsx
const cl = plan.credits_limit;
const isUnlimited = plan.plan_tier === "enterprise";
const interval = plan.recurring_interval ?? "mês";

// Computed labels
prompts:     isUnlimited ? "Ilimitado" : `${Math.floor(cl / 1)} / ${interval}`
saas_specs:  isUnlimited ? "Ilimitado" : `${Math.floor(cl / 2)} / ${interval}`
modo_misto:  isUnlimited ? "Ilimitado" : `${Math.floor(cl / 2)} / ${interval}`
build:       isUnlimited ? "Ilimitado" : `${Math.floor(cl / 5)} / ${interval}`
total:       isUnlimited ? "Ilimitado" : `${cl} cotas / ${interval}`
```

Cards mostrarão custo por ação: `✨ Prompts (1 cota)`, `🏗️ SaaS Specs (2 cotas)`, etc.

#### 3. ProfilePage — Mesma lógica dinâmica

Aplicar a mesma fórmula de cálculo nos cards de planos disponíveis.

#### 4. Interface `PricingProduct` / `BillingProduct`

Adicionar `credits_limit`, `plan_tier`, `recurring_interval`, `stripe_price_id` e remover dependência de labels estáticas.

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | Adicionar `credits_limit`, `credit_unit_cost`, `credit_costs`, `trial_period_days` à view |
| `src/pages/landing/LandingPage.tsx` | Calcular limites a partir de `credits_limit`; usar `stripe_price_id` para checkout |
| `src/pages/ProfilePage.tsx` | Mesma lógica dinâmica nos cards de planos |

### Dados no banco (confirmados)

| Plano | credits_limit | Resultado Prompts | SaaS | Misto | BUILD |
|-------|--------------|-------------------|------|-------|-------|
| Free | 5* (metadata) | 5 | 2 | 2 | 1 |
| Starter | 56 | 56 | 28 | 28 | 11 |
| Pro | 171 | 171 | 85 | 85 | 34 |
| Enterprise | 286 | Ilimitado | Ilimitado | Ilimitado | Ilimitado |

*Nota: Free tem `credits_limit=0` na coluna, mas `5` no metadata. A view usará `COALESCE(bp.credits_limit, (bp.metadata->>'credits_limit')::int, 0)`.

