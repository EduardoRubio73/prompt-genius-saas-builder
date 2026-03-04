

## Plano: Migrar todas as chamadas fetch para supabase.functions.invoke

### Problema
3 arquivos usam `fetch()` direto para chamar Edge Functions, causando erro 401 por falta de JWT/apikey.

### Mudancas

**1. Criar helper `src/lib/edgeFunctions.ts`**
```ts
import { supabase } from "@/integrations/supabase/client";

export async function callEdgeFunction(name: string, body?: any) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) { console.error("Edge Function Error:", error); throw error; }
  return data;
}
```

**2. Refatorar `src/pages/prompt/PromptMode.tsx`**
- Remover constantes `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Remover funcao `getAuthHeaders`
- Substituir 3 chamadas `fetch()` (linhas ~100, ~115, ~135) por `callEdgeFunction("refine-prompt", { action, ... })`
- Tratar resposta diretamente (sem `.json()`)

**3. Refatorar `src/pages/misto/MistoMode.tsx`**
- Remover constantes `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Substituir 3 chamadas `fetch()` (linhas ~105, ~122, ~142) por `callEdgeFunction("refine-prompt", { action, ... })`

**4. Refatorar `src/pages/saas/SaasMode.tsx`**
- Remover constantes `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Substituir 1 chamada `fetch()` (linha ~141) por `callEdgeFunction("refine-prompt", { action, ... })`

### Nota
`LandingPage.tsx`, `ProfilePage.tsx`, `AdminBillingPlans.tsx` e `AdminStripeSettings.tsx` ja usam `supabase.functions.invoke` -- nao precisam de alteracao.

| Arquivo | Acao |
|---------|------|
| `src/lib/edgeFunctions.ts` | Criar helper |
| `src/pages/prompt/PromptMode.tsx` | Substituir 3 fetch por callEdgeFunction |
| `src/pages/misto/MistoMode.tsx` | Substituir 3 fetch por callEdgeFunction |
| `src/pages/saas/SaasMode.tsx` | Substituir 1 fetch por callEdgeFunction |

