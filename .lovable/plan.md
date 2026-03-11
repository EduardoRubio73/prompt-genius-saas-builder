
# Botões equivalentes no modal + "Copiar Tudo" e "Baixar ZIP" para Build

## Contexto

O modal `UnifiedMemoryDetailDialog` atualmente tem apenas "Copiar" e "Favoritar/Excluir" no footer. Para entries do tipo **build**, faltam os botões "📋 Copiar Tudo" e "⬇️ Baixar .zip" que existem na página de resultados do BuildMode. Para **saas** e **mixed**, falta o botão de download `.md`.

## Mudanças

### `src/components/UnifiedMemoryDetailDialog.tsx`

1. **Adicionar import do JSZip** no topo
2. **Footer dinâmico por tipo de entry**:
   - **Build**: adicionar "📋 Copiar Tudo" (concatena todos os outputs em um único markdown) e "⬇️ Baixar .zip" (gera ZIP com `docs/01-ERD.md`, `02-PRD.md`, etc. + `README.md`)
   - **SaaS**: adicionar "⬇️ Baixar .md" (download da spec como arquivo .md)
   - **Mixed**: adicionar "⬇️ Baixar .md" (download do conteúdo ativo)
   - **Prompt**: manter "Usar como Base" existente

3. **Funções a adicionar**:
   - `handleCopyAll()` — concatena todos os outputs do build com headers em um único texto e copia
   - `handleDownloadZip()` — cria ZIP com pasta `docs/` numerada + README.md usando JSZip
   - `handleDownloadMd()` — download do conteúdo ativo como `.md`

4. **Estrutura do ZIP gerado**:
```text
projeto-docs/
├── docs/
│   ├── 01-ERD.md
│   ├── 02-PRD.md
│   ├── 03-RBAC.md
│   ├── 04-Roadmap.md
│   ├── 05-SQL.md
│   ├── 06-FluxosUX.md
│   ├── 07-Admin.md
│   ├── 08-Prompts.md
│   ├── 09-Testes.md
│   └── 10-Deploy.md
└── README.md
```

5. **Mapeamento de chaves para nomes de arquivo numerados**:
```typescript
const BUILD_DOC_FILES: Record<string, string> = {
  erd_md: "01-ERD.md",
  prd_md: "02-PRD.md",
  rbac_md: "03-RBAC.md",
  roadmap_md: "04-Roadmap.md",
  sql_schema: "05-SQL.md",
  ux_flows_md: "06-FluxosUX.md",
  admin_doc_md: "07-Admin.md",
  build_prompt: "08-Prompts.md",
  test_plan_md: "09-Testes.md",
  deploy_guide_md: "10-Deploy.md",
};
```

### Arquivo modificado

| Arquivo | Mudança |
|---------|---------|
| `src/components/UnifiedMemoryDetailDialog.tsx` | Botões dinâmicos no footer por tipo + lógica ZIP/copy all/download md |
