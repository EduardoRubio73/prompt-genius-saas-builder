# 🧠 Guia de Integração — UnifiedMemorySidebar

## Arquivos criados

| Arquivo | Onde colocar |
|---|---|
| `useUnifiedMemory.ts` | `src/hooks/useUnifiedMemory.ts` |
| `UnifiedMemoryDetailDialog.tsx` | `src/components/UnifiedMemoryDetailDialog.tsx` |
| `UnifiedMemorySidebar.tsx` | `src/components/UnifiedMemorySidebar.tsx` |

---

## 1. Modo Prompt (`/prompt`)

Substitua o `MemorySidebar` atual pelo novo:

```tsx
// ANTES
import { MemorySidebar } from "@/components/MemorySidebar";
<MemorySidebar refreshKey={refreshKey} onUseAsBase={handleUseAsBase} />

// DEPOIS
import { UnifiedMemorySidebar } from "@/components/UnifiedMemorySidebar";
<UnifiedMemorySidebar
  refreshKey={refreshKey}
  orgId={orgId}               // string do profile.personal_org_id
  onUseAsBase={handleUseAsBase}
  defaultMode="prompt"        // pré-filtra na aba "Prompts"
/>
```

---

## 2. Modo SaaS Spec (`/saas-spec`)

```tsx
import { UnifiedMemorySidebar } from "@/components/UnifiedMemorySidebar";

// No layout da página, ao lado do formulário:
<div className="flex flex-1 overflow-hidden">
  <main className="flex-1 overflow-auto p-6">
    {/* seu formulário atual */}
  </main>

  <UnifiedMemorySidebar
    refreshKey={specRefreshKey}
    orgId={orgId}
    defaultMode="saas"         // pré-filtra na aba "Specs"
    // onUseAsBase não é necessário aqui,
    // mas você pode implementar para pré-preencher o formulário de spec
  />
</div>
```

---

## 3. Modo Misto (`/mixed`)

```tsx
import { UnifiedMemorySidebar } from "@/components/UnifiedMemorySidebar";
import type { PromptInputs } from "@/lib/prompt-builder";

// Handler para reutilizar como base no formulário misto:
const handleUseAsBase = (data: PromptInputs) => {
  setFormData(prev => ({ ...prev, ...data }));
};

<div className="flex flex-1 overflow-hidden">
  <main className="flex-1 overflow-auto p-6">
    {/* seu formulário misto */}
  </main>

  <UnifiedMemorySidebar
    refreshKey={mixedRefreshKey}
    orgId={orgId}
    onUseAsBase={handleUseAsBase}
    defaultMode="all"          // mostra tudo (prompt + spec)
  />
</div>
```

---

## Props da `UnifiedMemorySidebar`

| Prop | Tipo | Descrição |
|---|---|---|
| `orgId` | `string \| undefined` | ID da org do usuário. Busca só dados dessa org. |
| `refreshKey` | `number` | Incrementar após gerar novo conteúdo para recarregar. |
| `onUseAsBase` | `(data: PromptInputs) => void` | Callback ao clicar "Usar como Base". |
| `defaultMode` | `"all" \| "prompt" \| "saas" \| "mixed"` | Aba pré-selecionada ao abrir. |

---

## Como obter o `orgId`

```tsx
const { user } = useAuth();
const { data: profile } = useProfile(user?.id);
const orgId = profile?.personal_org_id ?? undefined;
```

---

## Incrementar `refreshKey` após salvar

Nos seus handlers de geração (após salvar no Supabase):

```tsx
const [memoryRefreshKey, setMemoryRefreshKey] = useState(0);

// Após salvar prompt_memory ou saas_specs:
const handleGenerated = async () => {
  await saveToSupabase(...);
  setMemoryRefreshKey(k => k + 1); // atualiza sidebar automaticamente
};

<UnifiedMemorySidebar refreshKey={memoryRefreshKey} ... />
```

---

## Funcionalidades implementadas

- ✅ **Tabs de modo**: Todos / Prompts / Specs / Misto com contadores
- ✅ **Filtros**: Ouro (⭐5) / Favoritos ❤️ / Todos
- ✅ **Busca** por título, conteúdo, tags, categoria
- ✅ **Favoritar/desfavoritar** inline com hover (persiste no Supabase)
- ✅ **Deletar** inline com hover (persiste no Supabase)
- ✅ **Dialog de detalhe** com todos os campos por tipo
- ✅ **"Usar como Base"** — preenche o formulário com os dados salvos
- ✅ **Copiar conteúdo** para clipboard
- ✅ **Collapsed mode** — sidebar recolhível com indicadores de contagem
- ✅ **Loading skeleton** durante fetch
- ✅ **Empty state** contextual por filtro
- ✅ **Footer de resumo** — `X prompts · Y specs · Z favoritos`
- ✅ **Ordenação**: favoritos > rating > data
