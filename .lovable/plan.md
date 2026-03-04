

## Plano: Corrigir variavel de ambiente no edgeFunctions.ts

### Causa raiz
`src/lib/edgeFunctions.ts` usa `import.meta.env.VITE_SUPABASE_ANON_KEY` mas essa variavel nao existe no `.env`. A variavel correta e `VITE_SUPABASE_PUBLISHABLE_KEY`. O header `apikey` esta sendo enviado como `undefined`.

### Mudanca

**Arquivo unico: `src/lib/edgeFunctions.ts`** (linha 4)

Trocar:
```ts
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```
Por:
```ts
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
```

Nenhuma outra alteracao necessaria. Os arquivos `LandingPage.tsx` e `ProfilePage.tsx` ja usam `callEdgeFunction` corretamente.

