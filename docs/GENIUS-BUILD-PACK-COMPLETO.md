# Genius BUILD Pack — Versão Completa (15 Fases)

⚠️ ATENÇÃO DESENVOLVEDOR: Documento de instrução técnica para o Lovable.
NÃO gere conteúdo criativo. Execute na ordem das fases abaixo sem pular etapas.

---

## CONTEXTO E OBJETIVO

O BUILD Pack atual gera 10 outputs. Esta instrução expande para **15 fases** cobrindo
TODAS as dimensões de um projeto production-ready, superior a qualquer prompt manual.

**Wizard já coleta (use todos):**
`appName · dor · problema · segmento · features · roles · adminFeatures`
`colorPalette · authMethod · modelo · pricing · hosting · cicd · monitoring`
`integracoes · integracoesCustom · stackFrontend · stackBackend · stackDatabase · tone`

**Outputs atuais (manter):** `erd_md · prd_md · rbac_md · roadmap_md · sql_schema`
`ux_flows_md · admin_doc_md · build_prompt · test_plan_md · deploy_guide_md`

**5 novos outputs a adicionar:**
`design_system_md · routes_crud_md · landing_page_md · seed_data_md · checklist_deps_md`

---

## FASE 1 — EDGE FUNCTION `supabase/functions/refine-prompt/index.ts`

Localize o `case 'build':` e adicione os 5 blocos abaixo APÓS a geração
dos 10 outputs existentes, antes do `return`.

---

### OUTPUT 11 — `design_system_md`

```typescript
const designSystemPrompt = `Você é um Design System Engineer sênior.
Gere um Design System completo e executável para o projeto abaixo.
Responda APENAS com Markdown puro, sem texto antes ou depois.

PROJETO: ${answers.appName}
PALETA: ${answers.colorPalette}
SEGMENTO: ${answers.segmento}
TOM: ${answers.tone}
FEATURES: ${(answers.features || []).join(', ')}

Gere EXATAMENTE esta estrutura:

## Design System — ${answers.appName}

### Identidade Visual
- Nome: ${answers.appName}
- Tema padrão: [dark se colorPalette contém "Dark", senão light]
- Toggle tema: sim
- Estilo: [1 linha baseada no segmento e tom]
- Inspiração: [2 produtos de referência do mercado]

### Cores (CSS Variables — valores hex reais)
\`\`\`css
:root {
  /* Primária */
  --primary: #[hex baseado na paleta];
  --primary-hover: #[hex 10% mais escuro];
  --primary-foreground: #[hex para texto sobre primary];

  /* Superfícies */
  --background: #[hex fundo principal];
  --surface: #[hex cards/painéis];
  --surface-elevated: #[hex modais/dropdowns];

  /* Bordas */
  --border: #[hex];
  --border-muted: #[hex 50% opacity];

  /* Texto */
  --text-primary: #[hex];
  --text-secondary: #[hex muted];
  --text-tertiary: #[hex placeholder];

  /* Semânticas */
  --success: #[hex verde];
  --warning: #[hex amarelo/laranja];
  --danger: #[hex vermelho];
  --info: #[hex azul];

  /* Acento (se houver segundo tom na paleta) */
  --accent: #[hex];
  --accent-hover: #[hex];
}
\`\`\`

### Tipografia
\`\`\`css
/* Importe no index.html */
@import url('https://fonts.googleapis.com/css2?family=[FontePrincipal]:wght@400;500;600;700&family=[FonteSecundaria]:wght@400;500&family=[FonteMono]&display=swap');

:root {
  --font-display: '[FontePrincipal]', sans-serif;   /* Headings */
  --font-body: '[FonteSecundaria]', sans-serif;     /* Body text */
  --font-mono: '[FonteMono]', monospace;            /* Código */
}
\`\`\`

### Escala de Tamanhos
\`\`\`css
:root {
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.15);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.2);
}
\`\`\`

### Logo e Favicon
- Ícone: [descreva iniciais/símbolo, fundo, cor do texto, estilo]
- Favicon: [descreva versão 16x16]
- PWA manifest:
\`\`\`json
{
  "name": "${answers.appName}",
  "short_name": "[abreviação]",
  "theme_color": "[--primary hex]",
  "background_color": "[--background hex]",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
\`\`\`

### Componentes Shadcn/UI Necessários
Liste os componentes exatos a instalar baseado nas features: ${(answers.features || []).join(', ')}
Formato: npx shadcn-ui@latest add [componente1] [componente2] ...

### Navegação Principal
\`\`\`
[Liste sidebar com emojis baseado nas features e adminFeatures]
[Separe itens de admin com linha divisória]
\`\`\`
`;

outputs.design_system_md = await callAI(designSystemPrompt);
```

---

### OUTPUT 12 — `routes_crud_md`

```typescript
const routesCrudPrompt = `Você é um Arquiteto Frontend React sênior.
Gere a especificação COMPLETA de rotas e telas para o projeto abaixo.
Responda APENAS com Markdown puro, sem texto antes ou depois.

PROJETO: ${answers.appName}
FEATURES: ${(answers.features || []).join(', ')}
ROLES: ${(answers.roles || []).join(', ')}
AUTH: ${answers.authMethod}
ADMIN FEATURES: ${(answers.adminFeatures || []).join(', ')}
SEGMENTO: ${answers.segmento}

Gere EXATAMENTE esta estrutura:

## Rotas & Especificação de Telas — ${answers.appName}

### Mapa de Rotas (React Router DOM v6)

#### Rotas Públicas
| Rota | Componente | Descrição |
|------|-----------|-----------|
| / | LandingPage | Apresentação + CTAs |
| /login | LoginPage | Auth email/password |

#### Rotas Privadas
| Rota | Componente | Roles | Descrição |
|------|-----------|-------|-----------|
[Liste TODAS as rotas para cada feature. Use :id para detalhe.]

#### Rotas Admin (/admin/*)
| Rota | Componente | Roles | Descrição |
|------|-----------|-------|-----------|
[Liste para cada adminFeature]

### Auth Guards
\`\`\`typescript
// Regras de redirecionamento
[Liste todas as regras baseado nos roles: ${(answers.roles || []).join(', ')}]
// Exemplo:
// - Não autenticado → /login
// - Autenticado em / → /dashboard
// - Role insuficiente para /admin → /dashboard
\`\`\`

### Especificação Field-Level por Tela

Para cada rota privada principal, gere:

#### [Nome da Tela] — [rota]
**Componentes Shadcn:** [liste]
**Colunas da tabela/lista:**
| Campo | Tipo | Ordenável | Filtrável |
|-------|------|-----------|-----------|
[...]
**Formulário (criar/editar):**
| Campo | Tipo Input | Obrigatório | Validação |
|-------|-----------|-------------|-----------|
[...]
**Filtros disponíveis:** [liste]
**Ações por role:**
| Ação | ${(answers.roles || ['admin', 'user']).join(' | ')} |
|------|${(answers.roles || ['admin', 'user']).map(() => '----').join('|')}|
[...]

### Dashboard — Métricas e KPIs
Liste os cards de KPI e gráficos específicos para o segmento ${answers.segmento}.

### Dependências npm
\`\`\`bash
npm install [liste TODAS as libs necessárias para as features: ${(answers.features || []).join(', ')}]
# Inclua: @dnd-kit se tiver Kanban, recharts se tiver gráficos,
# date-fns se tiver calendário, jspdf/html2canvas se tiver PDF, etc.
\`\`\`

### Estrutura de Pastas Recomendada
\`\`\`
src/
├── components/
│   ├── ui/           # shadcn components
│   ├── layout/       # AppShell, Sidebar, TopBar
│   ├── auth/         # AuthGuard
│   └── [feature]/    # [liste uma pasta por feature]
├── pages/
│   ├── landing/
│   ├── auth/
│   ├── dashboard/
│   └── [feature]/    # [liste uma pasta por feature]
├── hooks/            # hooks customizados
├── lib/              # utils, supabase client
└── types/            # TypeScript types
\`\`\`
`;

outputs.routes_crud_md = await callAI(routesCrudPrompt);
```

---

### OUTPUT 13 — `landing_page_md`

```typescript
const landingPagePrompt = `Você é um Copywriter e UI Designer especialista em SaaS B2B brasileiro.
Gere a especificação completa da Landing Page para o projeto abaixo.
Responda APENAS com Markdown puro, sem texto antes ou depois.

PROJETO: ${answers.appName}
PROBLEMA RESOLVIDO: ${answers.dor} — ${answers.problema}
SEGMENTO: ${answers.segmento}
MODELO: ${answers.modelo}
PRICING: R$ ${answers.pricing}/mês
FEATURES: ${(answers.features || []).join(', ')}
TOM: ${answers.tone}
PALETA: ${answers.colorPalette}

Gere EXATAMENTE esta estrutura:

## Landing Page — ${answers.appName}

### SEO
- Title: [título até 60 chars]
- Meta description: [descrição até 155 chars]
- Keywords: [5-8 termos relevantes]

### Seção 1 — Hero
- Badge: [texto pequeno de credibilidade, ex: "Novo · 2024"]
- Headline principal: [impactante, até 8 palavras, foca no resultado]
- Subheadline: [explica o como, 1-2 linhas]
- CTA primário: [texto botão]  → /login ou /cadastro
- CTA secundário: [texto botão] → /demo ou âncora para features
- Prova social: [número ou dado de credibilidade]
- Visual sugerido: [descreva screenshot/mockup ideal para o hero]

### Seção 2 — Problema (antes/depois)
- Título: "Chega de [dor principal]"
- Antes: [3 bullets do estado atual com dor]
- Depois: [3 bullets do estado com o produto]

### Seção 3 — Features (Grid)
Título da seção: [título]
Para cada feature em ${(answers.features || []).join(', ')}, gere:
- Ícone sugerido (Lucide): [nome do ícone]
- Título: [2-4 palavras]
- Descrição: [1 linha de benefício]

### Seção 4 — Como Funciona (Steps)
3 passos simples de onboarding com título e descrição curta.

### Seção 5 — Pricing
Plano único ou múltiplos. Preço: R$ ${answers.pricing}/mês.
- Nome do plano
- Lista de 6-8 itens inclusos
- CTA: [texto]
- Garantia: [ex: 7 dias grátis, sem cartão]

### Seção 6 — CTA Final
- Headline: [convite final]
- Subtext: [reforça benefício]
- Botão: [texto CTA]

### Footer
- Links: Termos de Uso · Privacidade · Contato
- Tagline: "Powered by [marca]"

### Acesso Demo (se aplicável)
- Email: demo@${answers.appName.toLowerCase().replace(/\s/g, '')}.com
- Senha: demo123
- Badge visível: "VERSÃO DEMO"
`;

outputs.landing_page_md = await callAI(landingPagePrompt);
```

---

### OUTPUT 14 — `seed_data_md`

```typescript
const seedDataPrompt = `Você é um DBA especialista em Supabase/PostgreSQL.
Gere o seed de dados demo e usuários para o projeto abaixo.
Responda APENAS com Markdown puro contendo blocos SQL, sem texto antes ou depois.

PROJETO: ${answers.appName}
SEGMENTO: ${answers.segmento}
ROLES: ${(answers.roles || []).join(', ')}
FEATURES: ${(answers.features || []).join(', ')}
AUTH: ${answers.authMethod}

Gere EXATAMENTE esta estrutura:

## Seed Data — ${answers.appName}

### Instruções
Execute este script APÓS as migrations da Fase 05, no Editor SQL do Supabase.

### Usuários Demo
⚠️ ATENÇÃO: Crie os usuários abaixo pelo painel Supabase Auth > Users > Add User,
depois execute os UPDATEs do bloco SQL abaixo.

${(answers.roles || ['admin', 'user']).map((role, i) => `
**${role.charAt(0).toUpperCase() + role.slice(1)}:**
- Email: ${role}@${answers.appName.toLowerCase().replace(/\s/g,'')}.com
- Senha: ${role}123
- Role: ${role}
`).join('')}

\`\`\`sql
-- ================================================
-- SEED: ${answers.appName} — Dados de Demonstração
-- Execute após criar os usuários no Supabase Auth
-- ================================================

-- 1. Atualizar profiles dos usuários criados
${(answers.roles || ['admin', 'user']).map((role, i) => `
UPDATE profiles SET
  full_name = '${role.charAt(0).toUpperCase() + role.slice(1)} Demo',
  role = '${role}'
WHERE id = (SELECT id FROM auth.users WHERE email = '${role}@${answers.appName.toLowerCase().replace(/\s/g,'')}demo.com');
`).join('')}

-- 2. Dados de demonstração realistas
-- [Gere 3-5 INSERTs por tabela principal do segmento ${answers.segmento}]
-- [Use UUIDs fixos para referências cruzadas]
-- [Use dados brasileiros realistas: nomes, valores em R$, datas recentes]
-- [Comente cada bloco explicando o propósito]

\`\`\`

### Categorias/Configurações Iniciais
\`\`\`sql
-- Configurações padrão para novos usuários
-- [Gere INSERT de categorias, tags, stages ou configurações iniciais
--  específicas para o segmento ${answers.segmento}]
\`\`\`
`;

outputs.seed_data_md = await callAI(seedDataPrompt);
```

---

### OUTPUT 15 — `checklist_deps_md`

```typescript
const checklistDepsPrompt = `Você é um Tech Lead especialista em entrega de projetos SaaS.
Gere o checklist completo de validação e as dependências para o projeto abaixo.
Responda APENAS com Markdown puro, sem texto antes ou depois.

PROJETO: ${answers.appName}
FEATURES: ${(answers.features || []).join(', ')}
ROLES: ${(answers.roles || []).join(', ')}
ADMIN FEATURES: ${(answers.adminFeatures || []).join(', ')}
AUTH: ${answers.authMethod}
HOSTING: ${answers.hosting || 'Lovable Cloud'}
MONITORING: ${answers.monitoring || 'não definido'}
CICD: ${answers.cicd || 'não definido'}

Gere EXATAMENTE esta estrutura:

## Checklist Final & Dependências — ${answers.appName}

### Dependências Completas

#### package.json — produção
\`\`\`bash
npm install \\
  # UI e componentes
  @radix-ui/react-* \\
  lucide-react \\
  class-variance-authority clsx tailwind-merge \\
  # [adicione libs específicas para as features: ${(answers.features || []).join(', ')}]
  # Exemplos:
  # @dnd-kit/core @dnd-kit/sortable (Kanban/drag-and-drop)
  # recharts (gráficos)
  # date-fns (datas)
  # react-hook-form zod (formulários)
  # jspdf html2canvas (PDF)
  # papaparse (CSV export)
  # jszip (ZIP export)
  # @supabase/supabase-js
\`\`\`

#### Variáveis de Ambiente (.env)
\`\`\`env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
${answers.integracoes && answers.integracoes.length > 0 ? answers.integracoes.map(i => `VITE_${i.toUpperCase()}_KEY=sua_chave_aqui`).join('\n') : '# Sem integrações externas configuradas'}
\`\`\`

### ✅ Checklist Final de Validação

#### Banco de Dados
- [ ] Supabase habilitado e conectado ao Lovable
- [ ] Todas as migrations executadas sem erros
- [ ] RLS ativo em TODAS as tabelas
- [ ] Trigger \`handle_new_user\` criado e testado
- [ ] Seed data inserido e visível no painel Supabase
- [ ] Usuários demo criados e com roles corretas

#### Autenticação & Segurança
- [ ] Login email/password funcionando
- [ ] Redirect /login → /dashboard após login
- [ ] Redirect / → /login se não autenticado
- [ ] Redirect / → /dashboard se já autenticado
${(answers.roles || []).map(r => `- [ ] Role '${r}' com acesso correto às rotas permitidas`).join('\n')}
- [ ] Rotas /admin/* bloqueadas para roles não autorizados

#### Features Principais
${(answers.features || []).map(f => `- [ ] ${f}: implementado e funcional`).join('\n')}

#### Admin Panel
${(answers.adminFeatures || []).map(f => `- [ ] Admin/${f}: implementado e acessível só para admin`).join('\n')}

#### UI/UX
- [ ] Design system aplicado (cores, fontes, radius)
- [ ] Dark/light mode toggle funcionando
- [ ] Sidebar no desktop, bottom bar no mobile
- [ ] Loading states em TODAS as operações async
- [ ] Feedback de erro em TODOS os formulários
- [ ] Toast de sucesso nas principais ações
- [ ] Página 404 customizada

#### Performance
- [ ] Dashboard carrega em < 2s
- [ ] Queries com paginação (não carrega tudo de uma vez)
- [ ] Imagens otimizadas (se houver)
- [ ] Code splitting por rota

#### PWA
- [ ] manifest.json configurado
- [ ] Service Worker registrado
- [ ] App instalável no mobile
- [ ] Favicon e ícones gerados

#### Deploy
- [ ] Variáveis de ambiente configuradas no hosting
- [ ] Domínio apontando corretamente
- [ ] SSL ativo (HTTPS)
- [ ] Primeira conta criada (Admin via trigger)
- [ ] Categorias/configurações iniciais inseridas

#### Pós-Launch
- [ ] Acesso demo testado com email/senha demo
- [ ] Fluxo completo de onboarding validado
- [ ] CRUD de cada módulo testado
- [ ] Exportação (CSV/PDF) testada se aplicável
`;

outputs.checklist_deps_md = await callAI(checklistDepsPrompt);
```

---

## FASE 2 — APROFUNDAR OUTPUTS EXISTENTES

### 2.1 — Melhorar `sql_schema` (incluir ENUMs e índices)

Localize o prompt do `sql_schema` e substitua pelo abaixo:

```typescript
const sqlPrompt = `Você é um DBA PostgreSQL/Supabase sênior.
Gere o schema SQL COMPLETO e production-ready para o projeto abaixo.
Responda APENAS com um bloco SQL comentado, sem texto antes ou depois.

PROJETO: ${answers.appName}
SEGMENTO: ${answers.segmento}
ROLES: ${(answers.roles || []).join(', ')}
FEATURES: ${(answers.features || []).join(', ')}
AUTH: ${answers.authMethod}

Inclua OBRIGATORIAMENTE nesta ordem:
1. EXTENSÕES (uuid-ossp, pgcrypto se necessário)
2. ENUMs para campos com valores fixos (roles, status, tipos)
3. TABELAS PRINCIPAIS com todos os campos necessários para as features
4. FOREIGN KEYS com ON DELETE CASCADE onde apropriado
5. INDEXES em todas as FKs e campos de busca frequente
6. ROW LEVEL SECURITY (ALTER TABLE ... ENABLE ROW LEVEL SECURITY)
7. RLS POLICIES para cada tabela (SELECT, INSERT, UPDATE, DELETE separados)
8. FUNCTIONS (handle_new_user e outras necessárias)
9. TRIGGERS (on_auth_user_created)
10. Comente cada seção com -- [SEÇÃO]
`;

outputs.sql_schema = await callAI(sqlPrompt);
```

### 2.2 — Melhorar `build_prompt` (incluir rotas e design)

```typescript
const buildPromptText = `
Construa um SaaS completo chamado **${answers.appName}** usando:
- React + TypeScript + Vite
- Tailwind CSS + Shadcn/UI
- Supabase (Auth + Database + RLS)
- React Router DOM v6
- React Hook Form + Zod

**⚠️ IMPORTANTE: Habilite e conecte o Supabase interno do Lovable AGORA.**

### Design System
Aplique o design system da Fase 11 deste documento.
Tema padrão: ${answers.colorPalette.includes('Dark') ? 'dark' : 'light'} com toggle.

### Estrutura de Rotas
Implemente TODAS as rotas da Fase 12 deste documento com React Router DOM v6.
Use lazy loading em todas as rotas privadas.

### Funcionalidades
${(answers.features || []).map((f, i) => `${i + 1}. ${f}`).join('\n')}

### Roles e Permissões
Implemente o RBAC da Fase 03:
${(answers.roles || []).join(', ')} — veja tabela de permissões.

### Painel Admin
Rotas /admin/* visíveis SOMENTE para: ${answers.roles && answers.roles.includes('admin') ? 'admin' : answers.roles?.[0] || 'admin'}
Features admin: ${(answers.adminFeatures || []).join(', ')}

### Navegação
- Desktop: Sidebar fixa (240px) com ícones + labels
- Mobile: Bottom navigation bar com 4-5 ícones principais
- Header: logo + nome do usuário + toggle tema + notificações

### Regras de Implementação
- Todos os forms com validação Zod e feedback de erro
- Toda operação async com loading state e toast
- Dados SEMPRE do Supabase — zero mock data
- TypeScript strict — sem \`any\`
- Componentes reutilizáveis em /components/ui/
`.trim();

outputs.build_prompt = buildPromptText;
```

---

## FASE 3 — ATUALIZAR `build-master-doc.ts`

### 3.1 — Interface completa

```typescript
export interface BuildOutputs {
  // Fases originais
  erd?: string;
  prd?: string;
  rbac?: string;
  roadmap?: string;
  sql?: string;
  fluxosUx?: string;
  admin?: string;
  prompt?: string;
  testes?: string;
  deploy?: string;
  // Novas fases
  designSystem?: string;
  routesCrud?: string;
  landingPage?: string;
  seedData?: string;
  checklistDeps?: string;
}
```

### 3.2 — Labels e ordem

```typescript
const PHASE_LABELS = {
  erd:           { num: '01', title: 'ERD — Modelo de Dados',              emoji: '🗂️' },
  prd:           { num: '02', title: 'PRD — Requisitos do Produto',         emoji: '📋' },
  rbac:          { num: '03', title: 'RBAC — Controle de Acesso',           emoji: '🔐' },
  roadmap:       { num: '04', title: 'Roadmap de Desenvolvimento',          emoji: '🗺️' },
  sql:           { num: '05', title: 'SQL — Schema + ENUMs + RLS',          emoji: '🗄️' },
  fluxosUx:      { num: '06', title: 'Fluxos UX — Jornadas do Usuário',    emoji: '🔄' },
  admin:         { num: '07', title: 'Painel Administrativo',               emoji: '⚙️' },
  prompt:        { num: '08', title: 'Prompt de Implementação (Lovable)',   emoji: '🚀' },
  testes:        { num: '09', title: 'Plano de Testes',                    emoji: '🧪' },
  deploy:        { num: '10', title: 'Deploy e Infraestrutura',             emoji: '☁️' },
  designSystem:  { num: '11', title: 'Design System — Tokens & PWA',       emoji: '🎨' },
  routesCrud:    { num: '12', title: 'Rotas & Especificação Field-Level',   emoji: '📐' },
  landingPage:   { num: '13', title: 'Landing Page — Copy & Estrutura',    emoji: '🏠' },
  seedData:      { num: '14', title: 'Seed Data & Usuários Demo',          emoji: '🌱' },
  checklistDeps: { num: '15', title: 'Checklist Final & Dependências',     emoji: '✅' },
};

const PHASE_ORDER: (keyof BuildOutputs)[] = [
  'erd', 'prd', 'rbac', 'roadmap', 'sql', 'fluxosUx',
  'admin', 'prompt', 'testes', 'deploy',
  'designSystem', 'routesCrud', 'landingPage', 'seedData', 'checklistDeps',
];
```

---

## FASE 4 — ATUALIZAR `HistoryPage.tsx` (mapeamento de outputs)

```typescript
content = generateBuildMasterDoc(
  {
    erd:           session.outputs.erd_md,
    prd:           session.outputs.prd_md,
    rbac:          session.outputs.rbac_md,
    roadmap:       session.outputs.roadmap_md,
    sql:           session.outputs.sql_schema,
    fluxosUx:      session.outputs.ux_flows_md,
    admin:         session.outputs.admin_doc_md,
    prompt:        session.outputs.build_prompt,
    testes:        session.outputs.test_plan_md,
    deploy:        session.outputs.deploy_guide_md,
    designSystem:  session.outputs.design_system_md,
    routesCrud:    session.outputs.routes_crud_md,
    landingPage:   session.outputs.landing_page_md,
    seedData:      session.outputs.seed_data_md,
    checklistDeps: session.outputs.checklist_deps_md,
  },
  {
    appName: session.answers?.appName,
    dor:     session.answers?.dor,
    roles:   Array.isArray(session.answers?.roles)
               ? session.answers.roles.join(' / ')
               : session.answers?.roles,
    modelo:  session.answers?.modelo,
    segmento: session.answers?.segmento,
    authMethod: session.answers?.authMethod,
    colorPalette: session.answers?.colorPalette,
  }
);
```

---

## FASE 5 — TABS DO MODAL (adicionar 5 novas abas)

```tsx
const BUILD_TABS = [
  { key: 'erd_md',           label: '🗂️ ERD'         },
  { key: 'prd_md',           label: '📋 PRD'         },
  { key: 'rbac_md',          label: '🔐 RBAC'        },
  { key: 'roadmap_md',       label: '🗺️ Roadmap'     },
  { key: 'sql_schema',       label: '🗄️ SQL'         },
  { key: 'ux_flows_md',      label: '🔄 UX Flows'    },
  { key: 'admin_doc_md',     label: '⚙️ Admin'       },
  { key: 'build_prompt',     label: '🚀 Prompt'      },
  { key: 'test_plan_md',     label: '🧪 Testes'      },
  { key: 'deploy_guide_md',  label: '☁️ Deploy'      },
  // NOVOS:
  { key: 'design_system_md', label: '🎨 Design'      },
  { key: 'routes_crud_md',   label: '📐 Rotas/CRUD'  },
  { key: 'landing_page_md',  label: '🏠 Landing'     },
  { key: 'seed_data_md',     label: '🌱 Seed'        },
  { key: 'checklist_deps_md',label: '✅ Checklist'   },
];

// No JSX, renderize as abas dinamicamente:
{BUILD_TABS.filter(tab => session.outputs?.[tab.key]).map(tab => (
  <Tab key={tab.key} value={tab.key}>{tab.label}</Tab>
))}
```

---

## CHECKLIST DE VALIDAÇÃO DESTA IMPLEMENTAÇÃO

### Edge Function
- [ ] 5 novos prompts adicionados ao `case 'build'`
- [ ] Todos os `answers` do wizard usados como variáveis nos prompts
- [ ] `design_system_md`: CSS variables hex reais + PWA manifest
- [ ] `routes_crud_md`: tabela de rotas + campos por tela + deps npm
- [ ] `landing_page_md`: copy completo + 6 seções + SEO
- [ ] `seed_data_md`: INSERTs SQL + usuários demo por role
- [ ] `checklist_deps_md`: 30+ itens + package.json + .env

### SQL Melhorado
- [ ] ENUMs gerados para campos com valores fixos
- [ ] Índices em todas as FKs e campos de busca
- [ ] RLS policies separadas (SELECT / INSERT / UPDATE / DELETE)
- [ ] Trigger `on_auth_user_created` explicitamente gerado

### Build Prompt Melhorado
- [ ] Referencia as fases 11 e 12 do mesmo documento
- [ ] Especifica lazy loading nas rotas
- [ ] Inclui regras de navegação (sidebar + bottom bar)
- [ ] Zero mock data enforçado

### Frontend
- [ ] `build-master-doc.ts`: 15 fases mapeadas
- [ ] `HistoryPage.tsx`: todos os 15 campos mapeados no copyAll
- [ ] 15 tabs dinâmicas (só exibe as que têm conteúdo)
- [ ] ZIP exporta até 15 arquivos + `00-MASTER.md`

### Retrocompatibilidade
- [ ] Builds anteriores (10 fases) continuam funcionando
- [ ] Novas fases são opcionais no `filter` do PHASE_ORDER
- [ ] Modal não quebra se output novo estiver ausente
