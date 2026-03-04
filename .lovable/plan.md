

## Plano: Tooltips de consumo de cotas compartilhadas

### Objetivo
Adicionar tooltips informativos que expliquem que todas as ações consomem da mesma bolsa de cotas, com cálculo dinâmico de "quantas ações restam" por tipo.

### Alterações

#### 1. `src/components/dashboard/QuotaCard.tsx`
- Adicionar tooltip no título "Cotas do período" explicando que as cotas são compartilhadas
- Adicionar `InfoTooltip` em cada item de `ACTION_COSTS` mostrando `floor(creditsRemaining / cost)` ações possíveis
- Receber `creditsRemaining` já disponível via props

#### 2. `src/pages/ProfilePage.tsx` (BillingTab)
- Adicionar texto explicativo abaixo do título "Cotas do Plano": *"As cotas são compartilhadas entre todas as ações."*
- Nos cards de plano, adicionar `InfoTooltip` ao lado de "X cotas / mês" explicando o modelo de consumo compartilhado

#### 3. `src/pages/landing/LandingPage.tsx`
- Adicionar nota explicativa abaixo da linha "Total cotas/mês" nos cards de pricing: *"Cotas compartilhadas entre todas as ações"*

### Componente utilizado
`InfoTooltip` existente em `src/components/ui/info-tooltip.tsx` — reutilizado em todos os pontos.

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/components/dashboard/QuotaCard.tsx` | Tooltip no título + tooltip por ação com cálculo dinâmico |
| `src/pages/ProfilePage.tsx` | Texto explicativo + tooltip nos cards de plano |
| `src/pages/landing/LandingPage.tsx` | Nota de cotas compartilhadas nos cards de pricing |

