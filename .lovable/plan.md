

# Integrar Skills & Agentes com dados completos e systemPrompts

## Situação Atual
- `PromptInput.tsx` tem `SKILL_CATEGORIES` hardcoded com 5 categorias e ~22 skills simples (apenas labels, sem systemPrompts)
- Seleção é **multi-select** (`selectedSkills: string[]`)
- O payload envia `skills: selectedSkills` (array de strings) mas a edge function não usa os systemPrompts

## O que muda
1. Substituir dados hardcoded por arquivo JSON externo com **8 categorias e 60 skills**, cada um com `systemPrompt`
2. Mudar de **multi-select** para **single-select** (apenas 1 skill ativo por vez)
3. Enviar o `systemPrompt` do skill selecionado no payload para a edge function
4. Criar hook `useSkills` para tipagem e acesso aos dados

## Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/data/skills-data.json` | Criar — copiar JSON do upload |
| `src/hooks/useSkills.ts` | Criar — tipos `Skill`, `SkillCategory` e hook |
| `src/components/prompt/PromptInput.tsx` | Remover `SKILL_CATEGORIES` hardcoded, usar `useSkills()`, mudar para single-select (`selectedSkill: string \| null`), renderizar 8 categorias |
| `src/pages/prompt/PromptMode.tsx` | Mudar `selectedSkills: string[]` → `selectedSkill: string \| null`, enviar `skillSystemPrompt` no payload |
| `supabase/functions/refine-prompt/index.ts` | Injetar `skillSystemPrompt` recebido no system prompt da LLM |

## Detalhes de Implementação

### `useSkills.ts`
```ts
import skillsData from '@/data/skills-data.json'
export type Skill = { id: string; label: string; systemPrompt: string }
export type SkillCategory = { id: string; label: string; skills: Skill[] }
export function useSkills() { return skillsData.categories as SkillCategory[] }
export function findSkillById(id: string): Skill | null { ... }
```

### `PromptInput.tsx`
- Props: `selectedSkill: string | null` + `onSelectedSkillChange: (id: string | null) => void`
- Toggle: clicar no ativo deseleciona, clicar em outro seleciona (toggle single)
- Usa `useSkills()` em vez de constante hardcoded

### `PromptMode.tsx`
- Estado: `const [selectedSkill, setSelectedSkill] = useState<string | null>(null)`
- No payload do `callEdgeFunction("refine-prompt", ...)`: buscar o skill completo via `findSkillById(selectedSkill)` e enviar `skillSystemPrompt: skill?.systemPrompt`

### `refine-prompt/index.ts`
- Nos handlers `handleDistribute` e `handleRefine`: se `skillSystemPrompt` estiver presente, prepend ao system prompt da LLM como bloco `## Perfil do Assistente\n{skillSystemPrompt}`

