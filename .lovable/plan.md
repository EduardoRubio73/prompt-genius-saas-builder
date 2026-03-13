

# Fix "Usuário não autenticado" + Adicionar todos os modos nas stats

## Problema 1 — Auth toast na Skill

`handleGenerateClick` (linha 89) tem `useCallback(() => handleGenerate(), [])` — dependency array vazio. Isso captura uma versão stale de `handleGenerate` onde `orgId` e `user` ainda são `undefined`. Além disso, ao salvar no banco:
- `sessions.mode` é sempre `"prompt"` (linha 146) — deveria ser `"skill"` quando `isSkillMode`
- `prompt_memory.categoria` é sempre `"prompt"` (linha 240) — deveria ser `"skill"` quando `inputMode === "skills"`

### Correções em `src/pages/prompt/PromptMode.tsx`:
1. Corrigir dependency array de `handleGenerateClick`: `[handleGenerate]`
2. Linha 146: `mode: isSkillMode ? "skill" : "prompt"` (precisa verificar se o enum do banco aceita "skill" — se não, criar migration)
3. Linha 240: `categoria: inputMode === "skills" ? "skill" : "prompt"`

### Migration necessária:
Verificar se a coluna `mode` da tabela `sessions` aceita `"skill"` como valor. Se for enum, precisa adicionar o valor.

## Problema 2 — Stats do Dashboard com todos os modos

Atualmente o grid de mini stats (linha 340) mostra 4 colunas. Precisa mostrar 5 modos separados:
- **Prompts** — count de `prompt_memory` onde `categoria = 'prompt'`
- **Skills** — count de `prompt_memory` onde `categoria = 'skill'`
- **Specs** — count de `saas_specs`
- **Misto** — count de `prompt_memory` onde `categoria = 'misto'`
- **Build** — count de `build_projects`

O RPC `get_org_stats` não separa por categoria. Solução: queries diretas no Dashboard via `useQuery` ou adaptar o RPC.

### Abordagem: queries client-side no `Dashboard.tsx`
Adicionar queries separadas para contar por categoria de `prompt_memory` e `build_projects`, e atualizar o grid para 5 colunas com os 5 modos + Média Rating (6 colunas total, ou 5 + rating).

### Mudanças em `src/pages/Dashboard.tsx`:
- Importar `supabase` e adicionar `useQuery` para counts por modo
- Grid de stats: 5 modos + rating = 6 itens, grid `sm:grid-cols-3 lg:grid-cols-6`
- Cada modo com seu emoji/ícone: Prompts, Skills, Specs, Misto, Build, Rating

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/prompt/PromptMode.tsx` | Fix stale closure, salvar `categoria` e `mode` corretos |
| `src/pages/Dashboard.tsx` | Stats grid com todos os 5 modos |
| Migration SQL | Adicionar `'skill'` ao enum de `sessions.mode` se necessário |

