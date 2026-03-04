

## Plano: Adicionar header `apikey` em todas as chamadas de Edge Functions

### Problema
O gateway do Supabase exige o header `apikey` junto com o JWT. O `supabase.functions.invoke()` não o envia automaticamente neste projeto, causando `401 Invalid JWT`.

### Mudanca

**Unico arquivo a alterar: `src/lib/edgeFunctions.ts`**

Adicionar `headers: { apikey }` na chamada centralizada. Todas as 7+ chamadas via `callEdgeFunction` e as chamadas diretas tambem precisam do header.

Porem, como existem 6 arquivos com chamadas diretas a `supabase.functions.invoke()`, ha duas opcoes:

**Opcao escolhida**: Criar um wrapper global que injeta o header e migrar as chamadas diretas restantes.

### Arquivos alterados

| Arquivo | Mudanca |
|---------|---------|
| `src/lib/edgeFunctions.ts` | Adicionar `headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY }` |
| `src/pages/landing/LandingPage.tsx` | Substituir `supabase.functions.invoke` direto por `callEdgeFunction` |
| `src/pages/ProfilePage.tsx` | Substituir `supabase.functions.invoke` direto por `callEdgeFunction` |
| `src/pages/admin/AdminBillingPlans.tsx` | Substituir 3 chamadas diretas por `callEdgeFunction` |
| `src/pages/admin/AdminStripeSettings.tsx` | Substituir 1 chamada direta por `callEdgeFunction` |
| `src/hooks/admin/useAdminData.ts` | Substituir 2 chamadas diretas por `callEdgeFunction` |

### Codigo do helper atualizado

```ts
import { supabase } from "@/integrations/supabase/client";

export async function callEdgeFunction(name: string, body?: any) {
  const { data, error } = await supabase.functions.invoke(name, {
    body,
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });

  if (error) {
    console.error("Edge Function Error:", error);
    throw error;
  }

  return data;
}
```

Todas as chamadas passam a usar este helper, garantindo `apikey` + JWT em 100% dos casos.

