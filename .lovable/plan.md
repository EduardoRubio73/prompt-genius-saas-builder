

# Unificar modal de detalhes do Histórico com UnifiedMemoryDetailDialog

## Problema
O botão "Ver" no Histórico abre o `SessionDetailDialog` — um modal simples sem botão de copiar, sem campos estruturados (persona, tarefa, etc.), e com scroll no header. O usuário quer reusar o `UnifiedMemoryDetailDialog` (o modal verde com campos, copiar, favoritar) para TODAS as sessões.

## Plano

### 1. `src/pages/HistoryPage.tsx`
- Remover import do `SessionDetailDialog`
- Importar `UnifiedMemoryDetailDialog` e tipo `UnifiedMemoryEntry`
- Alterar `handleView`: ao clicar "Ver", buscar os dados completos da sessão no Supabase (`prompt_memory`, `saas_specs`, ou `build_projects` conforme o `mode`) e montar um objeto `UnifiedMemoryEntry` completo
- Criar state `selectedEntry: UnifiedMemoryEntry | null` no lugar de `selectedSession`
- Passar `selectedEntry` ao `UnifiedMemoryDetailDialog` com callbacks de copiar/favoritar/excluir
- Adicionar state `entryLoading` para mostrar feedback enquanto busca

### 2. Lógica de fetch no `handleView`
- Se `session.mode === "prompt"` ou `"misto"`: buscar em `prompt_memory` by `session_id`, mapear para `UnifiedMemoryEntry` (com persona, tarefa, objetivo, etc.)
- Se `session.mode === "saas"`: buscar em `saas_specs` by `session_id`, mapear com `answers`, `spec_md`
- Se `session.mode === "build"`: buscar em `build_projects` by `session_id`, mapear com `answers`, `project_name`
- Se nenhum registro encontrado, criar entry mínimo com `raw_input` como `fullContent`

### 3. Eliminar `SessionDetailDialog`
- Pode ser deletado (`src/components/history/SessionDetailDialog.tsx`) pois não será mais usado

### 4. Fix scroll no header do `UnifiedMemoryDetailDialog`
- O header já tem `sticky top-0 bg-card z-10` — o `overflow-y-auto` está no `DialogContent` (linha 138), o que é correto
- Mover `overflow-y-auto` do `DialogContent` para o body `div` (linha 187) para que o header e footer fiquem fixos e apenas o body faça scroll
- Usar `flex flex-col` no `DialogContent` e `flex-1 overflow-y-auto` no body

### Arquivos modificados
| Arquivo | Ação |
|---------|------|
| `src/pages/HistoryPage.tsx` | Substituir `SessionDetailDialog` por `UnifiedMemoryDetailDialog`, fetch completo |
| `src/components/UnifiedMemoryDetailDialog.tsx` | Fix scroll: header/footer fixos, body scrollável |
| `src/components/history/SessionDetailDialog.tsx` | Deletar (não mais usado) |

