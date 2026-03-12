

# Sincronização de Datas Stripe → organizations.plan_credits_reset_at

## Problema

O campo `plan_credits_reset_at` na tabela `organizations` não está sendo sincronizado com as datas reais do Stripe. Três pontos de falha:

1. **`checkout.session.completed`** (linha 341-344): Reseta `plan_credits_used` mas NÃO atualiza `plan_credits_reset_at` com o `current_period_end` da subscription
2. **`customer.subscription.updated`** com renovação (linha 365-368): Seta `plan_credits_reset_at` para `new Date().toISOString()` (agora) em vez do `current_period_end` do Stripe
3. **`customer.subscription.created`**: Não toca em `plan_credits_reset_at`
4. **Trigger `sync_org_plan`**: Atualiza `plan_tier`, `plan_credits_total`, etc. mas não atualiza `plan_credits_reset_at`

## Solução

Centralizar a atualização de `plan_credits_reset_at` na função `upsertSubscriptionFromStripe`, que já tem acesso ao `current_period_end` do Stripe. Após o upsert bem-sucedido da subscription, atualizar a org com a data correta.

### Mudanças em `supabase/functions/stripe-sync/index.ts`

**1. Na função `upsertSubscriptionFromStripe`** — após o upsert com sucesso, adicionar:
```typescript
// Sync plan_credits_reset_at with Stripe period end
if (stripeSubscription.status === "active" || stripeSubscription.status === "trialing") {
  await admin
    .from("organizations")
    .update({
      plan_credits_reset_at: subData.current_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId);
}
```

**2. No handler `checkout.session.completed`** — adicionar `plan_credits_reset_at` ao reset de créditos. Como `upsertSubscriptionFromStripe` agora já faz isso, basta garantir que o reset de créditos inclua a data:
```typescript
// Já feito pelo upsertSubscriptionFromStripe acima
await admin
  .from("organizations")
  .update({ plan_credits_used: 0, updated_at: ... })
  .eq("id", orgId);
```
(Nenhuma mudança extra necessária aqui pois `upsertSubscriptionFromStripe` é chamado antes)

**3. No handler `customer.subscription.updated`** — trocar `plan_credits_reset_at: new Date().toISOString()` pelo `current_period_end` real do Stripe:
```typescript
const periodEnd = safeTimestamp(
  (stripeSubscription.items.data[0] as any)?.current_period_end 
  ?? stripeSubscription.current_period_end
);
await admin
  .from("organizations")
  .update({
    plan_credits_used: 0,
    plan_credits_reset_at: periodEnd ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  .eq("id", orgId);
```

### Mudança no trigger `sync_org_plan` (SQL migration)

Adicionar a atualização de `plan_credits_reset_at` baseada no `current_period_end` da subscription recém-inserida/atualizada:
```sql
-- No bloco IF NEW.status IN ('active', 'trialing'):
plan_credits_reset_at = NEW.current_period_end,
```

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/stripe-sync/index.ts` | Sincronizar `plan_credits_reset_at` com `current_period_end` do Stripe em todos os handlers |
| SQL migration | Atualizar trigger `sync_org_plan` para incluir `plan_credits_reset_at = NEW.current_period_end` |

