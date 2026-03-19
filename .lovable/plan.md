

# Correções: Preview + Modal + Deploy Edge Function

## Problema 1: Preview em branco
O `vite.config.ts` tem `base: "/genius/"`, então o app só funciona em `/genius/`. No preview do Lovable, a URL raiz `/` não encontra nada. Solução: remover o `base` em desenvolvimento (usar apenas em produção).

**Arquivo:** `vite.config.ts`
- Mudar `base` para usar variável de ambiente ou condicional: em dev usa `/`, em build usa `/genius/`

## Problema 2: Botão "Copiar" duplicado no footer do modal
No `UnifiedMemoryDetailDialog.tsx` (linha 552-554), existe um botão "Copiar" genérico no footer que é redundante — já existe um "Copiar" dentro do bloco de conteúdo (linha 487) e o "Copiar Documento Mestre" para builds.

**Arquivo:** `src/components/UnifiedMemoryDetailDialog.tsx`
- Remover o botão `<Button variant="outline" ...> Copiar</Button>` do footer (linhas 552-554)

## Problema 3: Deploy da Edge Function atualizada
A edge function `refine-prompt` foi editada para 15 fases paralelas mas precisa ser deployada para funcionar.

**Ação:** Deploy da edge function `refine-prompt` via ferramenta Supabase

## Resumo das mudanças
1. `vite.config.ts` — condicional no `base` para preview funcionar
2. `UnifiedMemoryDetailDialog.tsx` — remover botão "Copiar" duplicado do footer
3. Deploy edge function `refine-prompt`

