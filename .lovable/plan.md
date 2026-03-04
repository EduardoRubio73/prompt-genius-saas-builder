

## Plano: Correções Dashboard + Profile (9 itens)

### 1. Botão "Compartilhar convite" funcional
**Arquivo:** `src/components/referral/ReferralBonusCard.tsx`

O botão não faz nada. Implementar `navigator.clipboard.writeText()` com a URL de referral do usuário (ex: `window.location.origin + "?ref=" + orgId`) e toast de confirmação. Receber `orgId` como prop.

### 2. Summary cards clicáveis no Dashboard
**Arquivo:** `src/pages/Dashboard.tsx`

Adicionar prop `onClick` ao `SummaryCard`. Cada card navega para:
- **Plano Atual** → `/profile?tab=billing` (scroll aos planos)
- **Cotas Restantes** → `/profile?tab=billing`
- **Bônus** → `/profile?tab=billing`
- **Renovação** → `/profile?tab=billing#plans` (foco nos planos)

### 3. Stats cards clicáveis
**Arquivo:** `src/pages/Dashboard.tsx`

- **Prompts gerados** → `/memory?mode=prompt`
- **Specs criadas** → `/memory?mode=saas`
- **Total de ações** → `/history`
- **Média rating** → `/history`

### 4. Envolver seções em cards
**Arquivo:** `src/pages/Dashboard.tsx`

Envolver "Resumo da Conta", "Modos disponíveis" e "Acesso rápido" cada um dentro de um `div` com `rounded-xl border bg-card p-5 shadow-md`.

### 5. Corrigir plano exibido e badge dinâmico
**Arquivo:** `src/pages/Dashboard.tsx`

O badge "Plano Free" usa `quota?.plan_name` que vem do backend. Se retorna "Free" quando deveria ser outro, o problema é de dados. Mas vou adicionar cores dinâmicas ao badge:
- Free → cinza/muted
- Starter → azul/primary
- Pro → roxo/accent
- Enterprise → dourado

### 6. Profile page — conteúdo em cards
**Arquivo:** `src/pages/ProfilePage.tsx`

Envolver cada tab content (ProfileTab, SecurityTab, NotificationsTab, BillingTab sections) em cards com `rounded-xl border bg-card p-5 shadow-sm`.

### 7. Filtrar topups dos planos na BillingTab
**Arquivo:** `src/pages/ProfilePage.tsx`

Na query `useBillingProducts`, adicionar `.filter()` para excluir produtos cujo `display_name` começa com "Topup" (mesmo filtro da landing). Corrigir badge "Atual" para só aparecer no plano realmente ativo (comparar com `quota?.plan_name`).

### 8. Melhorar layout dos cards de planos
**Arquivo:** `src/pages/ProfilePage.tsx`

Adicionar `gap-6` entre cards, padding maior. Mover seção "Comprar Créditos Extras" para ACIMA de "Planos disponíveis".

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/referral/ReferralBonusCard.tsx` | Editar — botão funcional com clipboard |
| `src/pages/Dashboard.tsx` | Editar — cards clicáveis, seções em cards, badge dinâmico |
| `src/pages/ProfilePage.tsx` | Editar — cards wrapper, filtrar topups, reordenar seções, fix badge |

