

# Refatoração: Modais, Histórico, Cotas Dinâmicas

## 1. Botão "Ver" abre modal de detalhes (não navega)

**Arquivo: `src/pages/HistoryPage.tsx`**

- Adicionar state `selectedSession` e `detailOpen` no `HistoryPage`
- Buscar dados extras da sessão ao clicar "Ver": consultar `prompt_memory` ou `saas_specs` vinculados ao `session_id`
- Criar componente `SessionDetailDialog` usando `Dialog`/`DialogContent` do Shadcn (já disponível) que exibe:
  - Modo, status, tokens, duração, data
  - `raw_input` completo
  - Conteúdo gerado (prompt/spec) se encontrado nas tabelas vinculadas
- O botão "Ver" no `SessionCard` passa a chamar `onClick` (prop) em vez de `navigate`

## 2. Fix status: "Concluída" vs "Incompleta"

**Arquivo: `src/pages/HistoryPage.tsx`**

O código já exibe corretamente baseado em `session.completed` (linha 60). O problema é que as sessions são inseridas com `completed: false` e só atualizadas para `true` ao final do fluxo. Se o fluxo completa mas o update falha ou a query retorna dados desatualizados, aparece "Incompleta".

Ação: Além de `sessions`, fazer LEFT JOIN com `prompt_memory`/`saas_specs` pelo `session_id` — se existir registro vinculado, considerar a sessão como concluída mesmo que `completed = false`. Isso corrige o bug visual.

Alternativamente, renomear "Concluída" → "Finalizada" e "Incompleta" → "Em andamento" para melhor UX.

## 3. Cotas dinâmicas por modalidade

**Arquivo: `src/pages/HistoryPage.tsx`** e **`src/components/dashboard/QuotaCard.tsx`**

- No `HistoryPage`, importar `useQuotaBalance` e exibir um mini-resumo de cotas filtrado pelo modo selecionado
- Ao selecionar um filtro de modo (ex: "Prompt"), mostrar badge: "Você pode gerar até X Prompts"
- Cálculo: `Math.floor(totalRemaining / cost)` onde cost vem do `ACTION_COSTS` map

Adicionar ao `HistoryPage` um bloco condicional entre filtros e lista que mostra o contador dinâmico.

## 4. Modais — botão X e z-index

**`src/components/misto/CreditModal.tsx`**: Adicionar botão X (atualmente não tem) e usar z-index `z-[400]` no overlay.

**`src/components/dashboard/ShareModal.tsx`**: Já tem botão X e z-[300]. OK.

**`src/components/UnifiedMemoryDetailDialog.tsx`**: Já usa Shadcn Dialog que inclui botão X. OK.

## Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/HistoryPage.tsx` | Modal de detalhes, cotas dinâmicas, fix status |
| `src/components/misto/CreditModal.tsx` | Botão X, z-index fix |

## Detalhes técnicos

### SessionDetailDialog (inline no HistoryPage)
- Usa `Dialog` do Shadcn
- Ao abrir, faz query: `supabase.from("prompt_memory").select("*").eq("session_id", id).maybeSingle()` + `supabase.from("saas_specs").select("*").eq("session_id", id).maybeSingle()`
- Exibe loading skeleton enquanto busca
- Mostra conteúdo estruturado: modo, status, raw_input, prompt_gerado/spec_md

### Cotas dinâmicas
- Costs map: `{ prompt: 1, saas: 2, misto: 2, build: 5 }`
- Quando `modeFilter !== "all"`, mostrar: "Com seu saldo atual, você pode gerar até {n} {mode}"
- Usa dados do `useQuotaBalance`

### CreditModal
- Wrapper: `z-[400]` para ficar acima de tudo
- Adicionar botão X no canto superior direito com `<X className="h-4 w-4" />`

