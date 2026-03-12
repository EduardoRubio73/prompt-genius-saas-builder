

# Minha Conta: Cards colapsáveis, datas do plano e portal Stripe

## Resumo das mudanças

### 1. Tornar todas as seções da BillingTab colapsáveis
Atualmente só o "Resumo da Conta" é colapsável. Vamos envolver as seções "Comprar Créditos Extras", "Planos disponíveis" e a nova seção "Gerenciar Assinatura" em `Collapsible` com o mesmo padrão visual (ChevronDown, header clicável).

### 2. Adicionar datas do plano no card "Resumo da Conta"
Usar o hook `useOrgSubscription` para buscar `current_period_start`, `current_period_end`, `trial_start`, `trial_end`, `cancel_at`. Exibir no grid de cards:
- **Contratação**: `current_period_start` formatado
- **Renovação**: `current_period_end` ou fallback `reset_at`
- **Trial até**: se `trial_end` existir

### 3. Nova Edge Function `create-billing-portal` (Stripe Customer Portal)
Criar uma edge function que usa `stripe.billingPortal.sessions.create()` para gerar uma URL do portal de autoatendimento do Stripe. O portal permite ao usuário:
- Ver/gerenciar assinatura
- Cancelar assinatura
- Atualizar método de pagamento

A URL retornada será aberta em um **iframe/dialog interno** para não sair do sistema.

### 4. Seção "Gerenciar Assinatura" na BillingTab
Nova seção colapsável com botão "Gerenciar Assinatura" que:
1. Chama `create-billing-portal` para obter a URL
2. Abre um `Dialog` com um `<iframe>` apontando para a URL do portal Stripe
3. O usuário pode cancelar, trocar plano, atualizar cartão — tudo sem sair do app

**Nota**: O Stripe Customer Portal precisa estar configurado no dashboard do Stripe (Settings > Customer Portal). Se o iframe for bloqueado por CSP do Stripe, faremos fallback para `window.open` em nova aba.

## Arquivos modificados/criados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/create-billing-portal/index.ts` | Nova edge function para criar sessão do portal Stripe |
| `supabase/config.toml` | Adicionar `[functions.create-billing-portal]` |
| `src/pages/ProfilePage.tsx` | Adicionar `useOrgSubscription`, cards de datas, todas seções colapsáveis, seção "Gerenciar Assinatura" com dialog/iframe |

## Detalhes técnicos

### Edge Function `create-billing-portal`
```typescript
// Recebe org_id, busca stripe_customer_id da org
// Cria billingPortal.sessions.create({ customer, return_url })
// Retorna { url }
```

### BillingTab — Estrutura colapsável
```text
┌─ Resumo da Conta (colapsável, aberto) ─────────┐
│  Grid: Plano | Cotas | Extras | Bônus | Saldo  │
│  Grid: Contratação | Renovação | Trial          │
│  Progress bars                                   │
└──────────────────────────────────────────────────┘
┌─ Gerenciar Assinatura (colapsável) ─────────────┐
│  Status atual + botão "Abrir Portal Stripe"     │
│  Dialog com iframe do Stripe Customer Portal    │
└──────────────────────────────────────────────────┘
┌─ Comprar Créditos Extras (colapsável) ──────────┐
│  Pack cards                                      │
└──────────────────────────────────────────────────┘
┌─ Planos Disponíveis (colapsável) ───────────────┐
│  Plan cards grid                                 │
└──────────────────────────────────────────────────┘
```

