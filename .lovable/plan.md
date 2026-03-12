

# Revisão e Correção do Sistema de Assinaturas e Planos

## Diagnóstico

### 1. Webhook — Evento `customer.subscription.deleted` NÃO está sendo processado
O `stripe-sync` lida com `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated` e `invoice.payment_succeeded`, mas **NÃO** trata `customer.subscription.deleted`. Quando um usuário cancela no Stripe, o sistema nunca recebe essa notificação, deixando a assinatura como "active" no banco local.

### 2. Webhook — Falta reset de créditos no `customer.subscription.updated` com novo período
Quando o Stripe renova automaticamente e dispara `customer.subscription.updated` com novo `current_period_start`, os créditos (`plan_credits_used`) não são resetados. Só o `invoice.payment_succeeded` faz isso, mas depende de encontrar o `subId` na tabela local.

### 3. UX de Confirmação — BillingSuccess não invalida cache
A página `BillingSuccess.tsx` é estática: mostra texto de sucesso, mas não invalida as queries de `quota-balance` nem `org-subscription`. O usuário vê dados desatualizados até recarregar manualmente.

### 4. Upgrade/Downgrade — Risco de duplicatas
O `create-checkout-session` cria uma NOVA subscription no Stripe em vez de usar `stripe.subscriptions.update()`. Embora `deactivateOldSubscriptions` cancele as antigas localmente, no Stripe ficam duas subscriptions ativas para o mesmo customer (a antiga não é cancelada lá).

### 5. RLS — OK
`billing_subscriptions` tem apenas `SELECT` para usuários, `service_role` faz upserts via edge functions. Correto.

### 6. TypeScript — Status são strings soltas
`OrgSubscriptionData.status` é `string` genérico. Sem union type para garantir que apenas estados válidos (`active | trialing | past_due | canceled | incomplete_expired | none`) sejam usados.

---

## Plano de Correção

### A. `supabase/functions/stripe-sync/index.ts` — Adicionar handlers
1. **Adicionar `customer.subscription.deleted`**: Atualizar status da subscription local para `canceled`, setar `canceled_at` e `ended_at`. Atualizar `organizations` com `plan_tier = 'free'`, `account_status = 'churned'`.
2. **Adicionar reset de créditos no `customer.subscription.updated`** quando `current_period_start` muda (indica renovação).

### B. `src/pages/BillingSuccess.tsx` — Feedback pós-checkout
1. Ao montar, invalidar queries `["quota-balance"]`, `["org-subscription"]`, `["org-dashboard"]`.
2. Adicionar polling: re-fetch a cada 3s por 30s para capturar a atualização assíncrona do webhook.
3. Mostrar spinner enquanto aguarda confirmação, depois mostrar sucesso com dados atualizados.

### C. `src/hooks/useOrgSubscription.ts` — Tipo forte
1. Trocar `status: string` por `status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete_expired' | 'none'`.

### D. `supabase/functions/create-checkout-session/index.ts` — Cancelar subscription antiga no Stripe
1. Antes de criar nova checkout session, verificar se existe subscription ativa no Stripe para o customer.
2. Se existir, cancelar a antiga no Stripe (ou usar `subscription_data.metadata` para que o webhook faça isso).

### E. `supabase/functions/stripe-sync/index.ts` — Invoice upsert
1. No handler de `invoice.payment_succeeded`, fazer upsert na tabela `billing_invoices` com dados da invoice (amount, status, PDF URL).

---

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/stripe-sync/index.ts` | Handler `subscription.deleted`, reset em `updated`, invoice upsert |
| `src/pages/BillingSuccess.tsx` | Invalidação de cache + polling |
| `src/hooks/useOrgSubscription.ts` | Union type para status |
| `supabase/functions/create-checkout-session/index.ts` | Cancelar sub antiga no Stripe antes de criar nova |

