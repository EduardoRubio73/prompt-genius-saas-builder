

# BUILD Pack Completo — Expansão para 15 Fases

## Resumo

Expandir o BUILD Mode de 10 para 15 outputs, melhorar prompts existentes (SQL e build_prompt), e atualizar todo o frontend para suportar as novas fases.

## Mudanças

### 1. Edge Function — 5 novos outputs + prompts melhorados
**Arquivo:** `supabase/functions/refine-prompt/index.ts`

Refatorar `handleBuild()` para gerar cada output com chamadas `callLLM` individuais em vez de um único JSON monolítico. Adicionar 5 novos outputs:
- `design_system_md` — Design System com CSS variables, tipografia, PWA manifest
- `routes_crud_md` — Rotas React Router + especificação field-level por tela
- `landing_page_md` — Copy completo da landing page (6 seções + SEO)
- `seed_data_md` — SQL seed com usuários demo por role
- `checklist_deps_md` — Checklist de validação + dependências npm + .env

Melhorar prompts existentes:
- `sql_schema` — incluir ENUMs, índices, RLS separado por operação
- `build_prompt` — referenciar fases 11/12, lazy loading, navegação

Cada output será gerado com uma chamada `callLLM` separada usando os prompts detalhados do documento. As 15 chamadas serão feitas em paralelo com `Promise.allSettled` para performance.

### 2. Atualizar `src/lib/build-master-doc.ts`
- Expandir `BuildOutputs` com 5 novas keys: `designSystem`, `routesCrud`, `landingPage`, `seedData`, `checklistDeps`
- Expandir `PHASE_LABELS` com fases 11-15 (emojis e títulos conforme doc)
- Expandir `PHASE_ORDER` para incluir as 5 novas fases
- Atualizar título da fase 05 SQL para incluir "ENUMs"

### 3. Atualizar `src/components/UnifiedMemoryDetailDialog.tsx`
- Adicionar 5 entradas em `BUILD_DOC_LABELS` (design_system_md, routes_crud_md, etc.)
- Adicionar 5 entradas em `BUILD_DOC_FILES` (11-Design.md, 12-Rotas.md, etc.)
- Atualizar `handleCopyAll` e `handleDownloadZip` para mapear as 5 novas keys

### 4. Atualizar `src/pages/build/BuildMode.tsx`
- Adicionar 5 entradas em `DOC_LABELS` para as novas fases

### Retrocompatibilidade
- Builds anteriores (10 fases) continuam funcionando — novas fases são opcionais
- Tabs só aparecem se o output existir (filtro `filter(([, v]) => v)` já existe)
- `PHASE_ORDER` pula fases sem conteúdo automaticamente

### Detalhes técnicos da Edge Function

A função `handleBuild` será refatorada de uma única chamada LLM retornando JSON para 15 chamadas paralelas, cada uma com prompt especializado. Isso melhora a qualidade de cada output e evita o limite de tokens de uma única resposta.

```text
handleBuild(answers)
├── Promise.allSettled([
│   callLLM(prdPrompt),
│   callLLM(erdPrompt),
│   callLLM(rbacPrompt),
│   ... (12 mais)
│])
└── return { prd_md, erd_md, ..., checklist_deps_md }
```

O `max_tokens` será aumentado para 16384 nas chamadas individuais para permitir outputs mais detalhados.

