

# Diagnóstico Completo e Plano de Correção

## Problemas Encontrados

### 1. Badge do Plano mostra apenas "PLANO" sem o nome do tier

**Causa raiz**: O campo `display_name` do produto Pro (`96f89186...`) contém uma **string vazia `""`** em vez de `null`. No `org-dashboard`, a cadeia de fallback usa `??` (nullish coalescing), que **não trata string vazia**:

```typescript
// org-dashboard line 66
const planName = sub?.billing_prices?.billing_products?.display_name  // "" (empty)
  ?? sub?.billing_prices?.billing_products?.name                       // nunca chega aqui
  ?? org.plan_tier                                                     // nunca chega aqui
```

Resultado: `plan_name = ""`, e no Dashboard: `Plano {""}` → mostra apenas "PLANO" sem tier.

### 2. Bônus de indicação creditado no bucket errado

A função `reward_referral_if_paid` chama `add_extra_credits()`, que atualiza `org_credits.extra_balance`. Mas o Dashboard exibe **`bonus_credits_total`** (da tabela `organizations`) como "Bônus" e `extra_balance` como "Créditos Extras". Resultado:

| Org | bonus_credits_total | extra_balance | Exibição |
|---|---|---|---|
| cexrubio | 0 | 55 (50 anterior + 5 referral) | Bônus: 0, Extras: 55 |
| rsradiotaxi | 0 | 15 (10 anterior + 5 referral) | Bônus: 0, Extras: 15 |

Os 5 créditos de referral estão em `extra_balance` quando deveriam estar em `bonus_credits_total`.

### 3. Sem registro no ledger para bônus de referral

A função `add_extra_credits` não insere registro em `credit_transactions`. O histórico não mostra que os bônus foram creditados.

## Plano de Correção

### Parte 1: Fix `display_name` e fallback no org-dashboard

**Arquivo**: `supabase/functions/org-dashboard/index.ts`

Trocar o operador `??` por `||` (que trata strings vazias como falsy):

```typescript
const planName = sub?.billing_prices?.billing_products?.display_name
  || sub?.billing_prices?.billing_products?.name
  || org.plan_tier
  || null;
```

**SQL**: Corrigir o `display_name` vazio do produto Pro:

```sql
UPDATE billing_products SET display_name = 'Pro' WHERE id = '96f89186-de4a-4f0b-b9f7-7030a931fb0a';
```

### Parte 2: Fix `reward_referral_if_paid` para usar bonus_credits_total

**Migração SQL**: Alterar a função para atualizar `organizations.bonus_credits_total` em vez de chamar `add_extra_credits`:

- Substituir `perform add_extra_credits(org, 5, 'referral_first_bonus')` por UPDATE direto em `organizations.bonus_credits_total`
- Adicionar INSERT em `credit_transactions` para registrar no ledger
- Manter `add_extra_credits` para os bônus de 10 por bloco (ou também migrar)

### Parte 3: Reconciliação de dados

**Migração SQL**:

1. Mover 5 créditos de `extra_balance` para `bonus_credits_total` em ambas as orgs:

```sql
-- cexrubio: extra_balance 55→50, bonus_credits_total 0→5
UPDATE organizations SET bonus_credits_total = 5 WHERE id = 'fb2237bd-...';
UPDATE org_credits SET extra_balance = extra_balance - 5 WHERE org_id = 'fb2237bd-...';

-- rsradiotaxi: extra_balance 15→10, bonus_credits_total 0→5  
UPDATE organizations SET bonus_credits_total = 5 WHERE id = '5b1488f5-...';
UPDATE org_credits SET extra_balance = extra_balance - 5 WHERE org_id = '5b1488f5-...';
```

2. Inserir registros de ledger em `credit_transactions` para ambos os bônus.

3. Corrigir `display_name` vazio em todos os produtos que tenham `""` em vez de `null` ou valor real.

## Arquivos a Modificar

1. `supabase/functions/org-dashboard/index.ts` — fix fallback `??` → `||`
2. Migração SQL — fix `display_name`, reconciliar bonus_credits, fix `reward_referral_if_paid`

## Resultado Esperado

- Badge do RS mostra "PLANO PRO"
- Dashboard mostra "Bônus: 5" (não 0) para ambos
- "Créditos Extras" mostra valor correto sem os 5 do referral
- Saldo total não muda (apenas redistribui entre buckets)
- Histórico de transações registra os bônus de indicação

