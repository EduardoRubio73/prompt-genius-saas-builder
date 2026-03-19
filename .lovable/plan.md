

# Remodelagem do "Copiar Tudo" no BUILD Mode

## Situação Atual

O `handleCopyAll` em `UnifiedMemoryDetailDialog.tsx` (linha 189) já gera um documento mestre estruturado com fases ordenadas, stack, e regras gerais. Porém difere do formato solicitado no documento:

- Falta o cabeçalho `⚠️ ATENÇÃO DESENVOLVEDOR`
- Falta metadata (dor, roles, modelo de negócio) no header
- Falta emojis nas fases
- Falta timestamp de geração
- As "Regras Gerais" ficam no final em vez de antes das fases
- O botão ainda diz "Copiar Tudo" em vez de "Copiar Documento Mestre"
- O ZIP não inclui `00-MASTER.md`

## Mudanças

### 1. Criar `src/lib/build-master-doc.ts`
Utilitário com `generateBuildMasterDoc(outputs, metadata)` conforme o documento — com header `⚠️ ATENÇÃO`, metadata (appName, dor, roles, modelo), regras gerais antes das fases, 10 fases com emojis e numeração, filtro de fases vazias, e timestamp pt-BR.

Mapeamento de keys do banco para o utilitário:
- `sql_schema` → `sql`, `prd_md` → `prd`, `erd_md` → `erd`, `rbac_md` → `rbac`, `ux_flows_md` → `fluxosUx`, `roadmap_md` → `roadmap`, `admin_doc_md` → `admin`, `build_prompt` → `prompt`, `test_plan_md` → `testes`, `deploy_guide_md` → `deploy`

### 2. Atualizar `UnifiedMemoryDetailDialog.tsx`
- Importar `generateBuildMasterDoc`
- Substituir `handleCopyAll` (linhas 189-256) para usar o novo utilitário, mapeando as keys do `entry.outputs` para o formato esperado
- Atualizar `handleDownloadZip` (linha 258+) para incluir `00-MASTER.md` no ZIP
- Mudar label do botão (linha 523) de "Copiar Tudo" para "Copiar Documento Mestre"

