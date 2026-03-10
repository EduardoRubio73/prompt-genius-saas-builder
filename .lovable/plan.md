

# Diagnóstico Completo: Pagamento `pi_3T9NlVBmEyQZSY7V0kxNvSxd`

## Dados Coletados

| Item | Valor |
|---|---|
| **rsradiotaxi.sor@gmail.com** | org `5b1488f5`, plan_tier = `free`, plan_credits = 5, stripe_customer = `cus_U6sbxGF6pbZNj8` |
| **cexrubio@gmail.com** | org `fb2237bd`, plan_tier = `starter`, referral_first_bonus_paid = `false` |
| **billing_subscriptions** | **VAZIA** -- nenhum registro existe |
| **referrals** | **VAZIA** -- nenhum registro de indicação existe |
| **referral_codes** | cexrubio tem código `GENIUS-C9A45F` ativo |
| **Edge Function logs (stripe-sync)** | **Nenhum log encontrado** -- webhook nunca foi recebido |

## Gargalos Identificados (5 problemas)

### 1. Webhook Stripe nunca chegou
Não há logs da Edge Function `stripe-sync`. O evento `checkout.session.completed` para o pagamento de rsradiotaxi nunca foi recebido. Causa provável: URL do webhook não configurada corretamente no Stripe Dashboard, ou `STRIPE_WEBHOOK_SECRET` incorreto.

### 2. Trigger `trg_reward_referral` -- só dispara em UPDATE (falta INSERT)
```text
tgtype = 17 → AFTER UPDATE FOR EACH ROW
```
Quando uma nova assinatura é INSERIDA (INSERT), este trigger **não dispara**. O trigger `sync_org_plan` funciona corretamente (INSERT OR UPDATE), mas o de indicação não.

### 3. Trigger `trigger_reward_referral` referencia coluna inexistente
```sql
if new.status = 'active' and new.plan <> 'free' then ...
```
A tabela `billing_subscriptions` **não tem coluna `plan`**. O trigger silenciosamente falha ou retorna null. Deveria buscar o `plan_tier` via JOIN em `billing_prices → billing_products`.

### 4. Nenhum registro de indicação foi criado
A função `process_referral(code, invitee_org, invitee_user)` nunca foi chamada para rsradiotaxi. Sem registro na tabela `referrals`, o `reward_referral_if_paid` não encontra nada para recompensar, mesmo que o trigger funcionasse.

### 5. Nenhum billing_subscription existe
Como o webhook não chegou, nenhum registro de assinatura foi criado. Portanto, nem o `sync_org_plan` (que atualiza plan_tier) nem o `trigger_reward_referral` foram executados.

## Correções Propostas

### Parte 1: Correção do Trigger `trigger_reward_referral` (Migration SQL)

Recriar a função para:
- Buscar `plan_tier` via `billing_prices → billing_products` em vez de `new.plan`
- Recriar o trigger como `AFTER INSERT OR UPDATE` (não apenas UPDATE)

```sql
-- Função corrigida
CREATE OR REPLACE FUNCTION trigger_reward_referral() ...
  SELECT plan_tier INTO v_tier FROM billing_products bp
  JOIN billing_prices bpr ON bpr.product_id = bp.id
  WHERE bpr.id = new.price_id;
  
  IF new.status = 'active' AND v_tier <> 'free' THEN
    PERFORM reward_referral_if_paid(new.org_id);
  END IF;

-- Trigger recriado
DROP TRIGGER trg_reward_referral ON billing_subscriptions;
CREATE TRIGGER trg_reward_referral
  AFTER INSERT OR UPDATE ON billing_subscriptions
  FOR EACH ROW EXECUTE FUNCTION trigger_reward_referral();
```

### Parte 2: Dados manuais (SQL INSERT/UPDATE via insert tool)

1. **Criar registro de referral** entre cexrubio (referrer) e rsradiotaxi (invitee) com status `trial`
2. **Criar billing_subscription** para rsradiotaxi org com o price_id correto (Starter = `6bb2e3c2...`) e status `active`
3. O trigger `sync_org_plan` atualizará automaticamente o plan_tier da org
4. O trigger corrigido `trg_reward_referral` chamará `reward_referral_if_paid`, que dará +5 créditos extras para ambos

### Parte 3: Verificação do Webhook

Nenhuma alteração de código necessária na Edge Function `stripe-sync` -- a lógica está correta. O problema é que o webhook nunca foi recebido. O usuário precisa verificar no Stripe Dashboard:
- URL do webhook: `https://pcaebfncvuvdguyjmyxm.supabase.co/functions/v1/stripe-sync`
- Eventos: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `invoice.payment_succeeded`

## Arquivos a Modificar

1. **Migration SQL** -- Corrigir função `trigger_reward_referral` + recriar trigger com INSERT OR UPDATE
2. **Dados via insert tool** -- Criar referral + billing_subscription para rsradiotaxi
3. **Nenhum arquivo TypeScript precisa mudar** -- a lógica do webhook está correta

## Resultado Esperado

- rsradiotaxi terá plano ativo (Starter) com créditos do plano
- Ambos os usuários receberão +5 créditos extras de bônus de indicação
- Futuros pagamentos processados automaticamente (após configurar webhook no Stripe)
- Trigger de indicação funcionará para INSERT e UPDATE de assinaturas

