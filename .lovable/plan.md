

# Plano: Adicionar Resumo da Conta no Profile Page

## Resumo

Substituir o card "Cotas do Plano" na página de Perfil/Billing pelo mesmo card "Resumo da Conta" do Dashboard, com barras separadas para cotas do plano e bônus.

## Mudanças

### ProfilePage.tsx - BillingTab

**Remover:**
- Card simples de "Cotas do Plano" (linhas 461-497)
- Card "Seu plano atual" (linhas 450-459)

**Adicionar:**
Card "Resumo da Conta" completo, incluindo:
1. **Header** com título + botão Atualizar
2. **Visão Geral** - 4 cards: Plano Atual, Cotas Restantes, Bônus, Renovação
3. **Cotas do Plano** - barra de progresso (plan_used / plan_total)
4. **Bônus + Extras** - barra separada (bonus_remaining + extra_credits)

### Estrutura visual

```text
┌─────────────────────────────────────────────────────┐
│ RESUMO DA CONTA                      [↻ Atualizar] │
├─────────────────────────────────────────────────────┤
│ VISÃO GERAL                                         │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                │
│ │Plano │ │Cotas │ │Bônus │ │Renova│                │
│ └──────┘ └──────┘ └──────┘ └──────┘                │
│                                                     │
│ COTAS DO PLANO                                      │
│ ██████████░░░░░░░░░░░  22 / 56 usadas · 34 rest.   │
│                                                     │
│ BÔNUS + EXTRAS                                      │
│ ████████████████████  11 bônus · 11 disponíveis     │
└─────────────────────────────────────────────────────┘
│ Comprar Créditos Extras                             │
│ Planos disponíveis                                  │
```

## Implementação técnica

1. Importar `useQueryClient`, `RefreshCw`, ícones necessários
2. Adicionar `handleRefreshQuota` usando `invalidateQueries`
3. Extrair `UsageProgressBar` component do Dashboard (ou duplicar)
4. Calcular `planUsed`, `planTotal`, `bonusTotal` da mesma forma do Dashboard
5. Remover max-w-2xl para ocupar largura total da página

