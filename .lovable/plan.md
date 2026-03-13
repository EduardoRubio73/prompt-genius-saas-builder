

# Remover SkillIntentModal + Adicionar "Gerar Mini App"

## Parte 1 — Remover SkillIntentModal

O modal de intenção é redundante agora que Prompt e Skill têm entradas separadas.

### `src/pages/prompt/PromptMode.tsx`
- Remover import de `SkillIntentModal`
- Remover estado `intentModalOpen`
- Remover `handleIntentSelect` callback
- Simplificar `handleGenerateClick`: chamar `handleGenerate()` diretamente para todos os modos
- Simplificar `handleGenerate`: remover parâmetro `intent` — no modo skills, sempre tentar cache primeiro e depois IA
- Remover `handleForceAI` (manter só como botão inline que chama `handleGenerate` com `forceAI=true`)
- Remover `<SkillIntentModal>` do JSX (linhas 401-407)

### `src/components/skills/SkillIntentModal.tsx`
- Deletar arquivo

## Parte 2 — Botão "Gerar Mini App" na tela de resultado

### Nova Edge Function: `supabase/functions/generate-mini-app/index.ts`
- Reutiliza o mesmo padrão de auth + `callLLM` via Lovable Gateway
- Recebe `{ prompt_memory_id, especialidade, tarefa, objetivo, contexto, prompt_gerado }`
- System prompt instruindo a gerar HTML completo, interativo, offline, max 200 linhas
- **Não consome crédito** (sem `consume_credit` RPC)
- Salva `mini_app_html` e `mini_app_generated_at` na tabela `prompt_memory`
- Retorna o HTML gerado

### `src/pages/prompt/PromptMode.tsx` — Novos estados e handler
- Adicionar estados: `miniAppHtml`, `generatingMiniApp`, `showMiniApp`, `promptMemoryId`
- Guardar o `id` do registro inserido em `prompt_memory` (já existe o insert, só capturar o retorno)
- Criar `handleGenerateMiniApp`: chama edge function `generate-mini-app`, atualiza estado
- Na tela de resultados, abaixo do prompt final, adicionar:
  - Botão "Gerar Mini App" (roxo) quando `!miniAppHtml`
  - Botão "Abrir/Ocultar Mini App" (verde) quando `miniAppHtml` já existe
  - Iframe sandboxed com `srcDoc={miniAppHtml}` + botão "Copiar HTML"

### `src/hooks/useUnifiedMemory.ts`
- Adicionar `mini_app_html?: string | null` e `mini_app_generated_at?: string | null` ao `UnifiedMemoryEntry`

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/skills/SkillIntentModal.tsx` | **DELETAR** |
| `src/pages/prompt/PromptMode.tsx` | **EDITAR** — remover modal, adicionar mini app |
| `src/hooks/useUnifiedMemory.ts` | **EDITAR** — adicionar campos mini_app |
| `supabase/functions/generate-mini-app/index.ts` | **CRIAR** — edge function para gerar HTML |

## Fluxo do Mini App

```text
Resultado da Skill exibido
        ↓
Clica "Gerar Mini App"
        ↓
Edge function gera HTML via LLM (0 créditos extras)
        ↓
HTML salvo em prompt_memory.mini_app_html
        ↓
iframe exibe preview inline
        ↓
Botão "Copiar HTML" disponível
```

