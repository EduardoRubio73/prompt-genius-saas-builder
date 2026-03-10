

# Plano: Fix Webhook + Stripe Dashboard URL + Correção Manual

## Bug Critico Encontrado

Os logs do Edge Function `stripe-sync` revelam o erro real:

```
SubtleCryptoProvider cannot be used in a synchronous context.
Use `await constructEventAsync(...)` instead of `constructEvent(...)`
```

**Linha 215** usa `stripe.webhooks.constructEvent()` (sincrono), mas o ambiente Deno exige `await stripe.webhooks.constructEventAsync()`. Isso faz com que **TODOS os webhooks do Stripe sejam rejeitados com erro 400**. Nenhum pagamento foi processado automaticamente desde o deploy.

## Estado Atual dos Dados

| Dado | Valor |
|---|---|
| rsradiotaxi org (`5b1488f5`) | plan_tier=**free**, plan_credits_total=**5** (errado - deveria ser starter/33) |
| billing_subscription | status=active, price_id=starter (trigger sync_org_plan nao atualizou a org) |
| referral | status=rewarded, bonus paid |
| cexrubio referral_first_bonus_paid | true |
| org_credits rsradiotaxi | extra_balance=15 (inclui bonus) |
| org_credits cexrubio | extra_balance=55 (inclui bonus) |
| pi_3T9PUKBmEyQZSY7V36oBGz8z | Nao existe em nenhuma tabela - webhook rejeitado |

Os bonus de indicacao ja foram creditados na intervencao anterior (extra_balance). O problema e que o plano do rsradiotaxi nunca foi atualizado (trigger falhou no insert manual).

## Correcoes (3 partes)

### 1. Fix Edge Function `stripe-sync/index.ts`

Trocar `constructEvent` por `await constructEventAsync` na linha 215:

```typescript
// ANTES (sincrono - FALHA no Deno):
const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

// DEPOIS (assincrono - funciona no Deno):
const event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
```

Este e o unico fix necessario na Edge Function. A logica de processamento esta correta.

### 2. Fix dados manuais (SQL via insert tool)

- Atualizar org rsradiotaxi para plan_tier=starter, plan_credits_total=33
- Nao precisa criar nova subscription (ja existe)
- Verificar se pi_3T9PUKBmEyQZSY7V36oBGz8z e subscription ou topup e processar manualmente se necessario

### 3. Admin UI: Stripe Dashboard URL + campo editavel

Adicionar ao `AdminStripeSettings.tsx`:
- Campo editavel com URL do Stripe Dashboard (default: `https://dashboard.stripe.com/acct_1T6qgVBmEyQZSY7V/test/dashboard`)
- Botao "Acessar" que abre em nova aba
- Persistido em `admin_settings` com key `stripe_dashboard_url`

## Arquivos a Modificar

1. `supabase/functions/stripe-sync/index.ts` - Fix `constructEventAsync`
2. `src/pages/admin/AdminStripeSettings.tsx` - Campo Stripe Dashboard URL
3. SQL via insert tool - Corrigir org rsradiotaxi

