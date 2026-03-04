

## Plano: Webhook topup + Exibir extra_balance no Dashboard e BillingTab

### 1. Webhook handler no `stripe-sync` para processar topup

**Arquivo:** `supabase/functions/stripe-sync/index.ts`

No `handleStripeWebhook`, dentro do handler de `checkout.session.completed`, adicionar verificação do `metadata.type === "topup"`:
- Se `type === "topup"`, chamar `process_credit_purchase` (RPC já existente no banco) passando `purchase_id` e o payment_intent ID
- Caso contrário, manter o comportamento atual (reset de créditos de plano)

```
if (session.metadata?.type === "topup") {
  const purchaseId = session.metadata.purchase_id;
  const paymentIntent = session.payment_intent as string;
  await admin.rpc("process_credit_purchase", {
    p_purchase_id: purchaseId,
    p_stripe_pi_id: paymentIntent ?? ""
  });
} else {
  // existing reset logic
}
```

### 2. Expor `extra_balance` no org-dashboard

**Arquivo:** `supabase/functions/org-dashboard/index.ts`

- Buscar `org_credits` para o `org_id` e extrair `extra_balance`
- Adicionar `extra_credits` ao resultado JSON
- Somar `extra_credits` no `total_remaining`

### 3. Atualizar hooks para incluir `extra_credits`

**Arquivos:** `src/hooks/useQuotaBalance.ts`, `src/hooks/useOrgDashboard.ts`

- Adicionar campo `extra_credits: number` às interfaces
- Mapear do response

### 4. Exibir `extra_balance` no QuotaCard

**Arquivo:** `src/components/dashboard/QuotaCard.tsx`

- Adicionar prop `extraCredits`
- Exibir linha "X créditos extras" abaixo de "restantes" quando > 0
- Incluir extra no cálculo de `maxActions` nos tooltips

### 5. Exibir `extra_balance` na BillingTab

**Arquivo:** `src/pages/ProfilePage.tsx`

- Na seção "Cotas do Plano", adicionar linha mostrando créditos extras quando > 0

### 6. Passar `extraCredits` no Dashboard

**Arquivo:** `src/pages/Dashboard.tsx`

- Passar `extraCredits` prop ao `QuotaCard`
- Exibir no SummaryCard de "Cotas Restantes" incluindo extras

### Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/stripe-sync/index.ts` | Editar — handler topup no webhook |
| `supabase/functions/org-dashboard/index.ts` | Editar — buscar e retornar extra_balance |
| `src/hooks/useQuotaBalance.ts` | Editar — campo extra_credits |
| `src/hooks/useOrgDashboard.ts` | Editar — campo extra_credits |
| `src/components/dashboard/QuotaCard.tsx` | Editar — exibir créditos extras |
| `src/pages/ProfilePage.tsx` | Editar — exibir créditos extras na BillingTab |
| `src/pages/Dashboard.tsx` | Editar — passar extraCredits ao QuotaCard |

