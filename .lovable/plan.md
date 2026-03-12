
# Correção: Status de Assinatura, Alertas e Regra de Acesso

## Diagnóstico

A partir das screenshots e código atual:
1. **Status "Inativo"**: O hook `useOrgSubscription` retorna `status: "none"` quando não encontra subscription ativa no banco, mas o usuário tem plano Starter. Isso indica que a edge function `org-subscription` pode não estar encontrando o registro, ou o status real não está sendo propagado. A lógica de fallback precisa considerar o `plan_tier` da org quando não há subscription billing.
2. **Threshold de renovação**: Está em 7 dias, precisa mudar para 5.
3. **Alertas globais**: `SubscriptionAlert` existe mas só aparece no Dashboard e ProfilePage. Precisa aparecer no topo do AppShell para ser visível em todas as páginas.
4. **Regra de acesso**: Já implementada parcialmente (noQuota = totalRemaining <= 0), mas precisa considerar `assinatura_ativa` como condição alternativa.

## Mudanças

### 1. `src/components/SubscriptionAlert.tsx`
- Mudar threshold de `isRenewalSoon` de 7 → 5 dias
- Ajustar `isSubscriptionExpired` para não considerar expirado quando `status === "none"` e o usuário tem saldo (a assinatura "none" é apenas ausência de billing record, não expiração)
- Adicionar status "Vencida" ao STATUS_MAP (para `current_period_end` ultrapassado com status `active`)

### 2. `src/pages/ProfilePage.tsx` (BillingTab — seção Gerenciar Assinatura)
- Quando `subscription?.status === "none"` mas `quota?.plan_name` existe e não é "Free", mostrar status baseado no plano da org em vez de "Inativo"
- Calcular status real: se tem `current_period_end` no passado → "Vencida"; se não tem subscription mas tem plano → derivar do `account_status` do quota

### 3. `src/components/layout/AppShell.tsx`
- Adicionar `SubscriptionAlert` compact no topo do layout, antes do conteúdo principal
- Requer receber `orgId` como prop (ou usar hooks internamente)

### 4. `src/pages/Dashboard.tsx`
- Ajustar `noQuota` para considerar: `canUse = totalRemaining > 0 || subscriptionActive`
- `subscriptionActive = subscription?.status === "active" || subscription?.status === "trialing"`
- Só bloquear modos quando `!canUse`

### 5. `src/pages/prompt/PromptMode.tsx`, `src/pages/misto/MistoMode.tsx`, `src/pages/saas/SaasMode.tsx`, `src/pages/build/BuildMode.tsx`
- Mesma regra de acesso: permitir uso se `saldo > 0 OR assinatura ativa`
- Verificar que o spinner global (LoadingOverlay) já está sendo chamado corretamente

### 6. `supabase/functions/org-subscription/index.ts`
- Quando não encontrar subscription ativa, enriquecer resposta consultando `organizations.plan_tier` e `organizations.plan_credits_total` para que o frontend saiba se o usuário tem um plano configurado manualmente pelo admin

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `src/components/SubscriptionAlert.tsx` | Threshold 5 dias, status "Vencida", lógica refinada |
| `src/pages/ProfilePage.tsx` | Status derivado correto, regra de acesso |
| `src/pages/Dashboard.tsx` | Regra `canUse = saldo > 0 OR sub ativa` |
| `src/components/layout/AppShell.tsx` | Alert global no topo |
| `supabase/functions/org-subscription/index.ts` | Incluir plan_tier da org quando sem subscription |
| Modos (Prompt/Misto/SaaS/Build) | Regra de acesso consistente |
