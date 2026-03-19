import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callLLM(systemPrompt: string, userPrompt: string, maxTokens = 8192): Promise<string> {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("AI Gateway error:", res.status, err);
    if (res.status === 429) throw new Error("rate_limit");
    if (res.status === 402) throw new Error("payment_required");
    throw new Error("ai_gateway_error");
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

function parseJsonFromLLM(text: string): Record<string, unknown> {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {
      // fallback
    }
  }
  try {
    return JSON.parse(text.trim());
  } catch {
    return { raw: text };
  }
}

async function handleDistribute(freeText: string, destino: string, skillSystemPrompt?: string) {
  let system = `Você é um assistente especializado em engenharia de prompt. 
Dado um texto livre do usuário, extraia e distribua as informações nos seguintes campos JSON:
- especialidade: área de conhecimento do agente (ex: "Full-Stack Developer", "UX Designer")
- persona: papel/personalidade que o agente deve assumir
- tarefa: o que o agente deve fazer concretamente
- objetivo: resultado esperado / entregável
- contexto: informações adicionais, restrições, tecnologias
- destino: plataforma alvo (manter "${destino}" se não mencionado)

Responda APENAS com JSON válido, sem markdown. Exemplo:
{"especialidade":"...","persona":"...","tarefa":"...","objetivo":"...","contexto":"...","destino":"${destino}"}`;

  if (skillSystemPrompt) {
    system = `## Perfil do Assistente\n${skillSystemPrompt}\n\n${system}`;
  }

  const result = await callLLM(system, freeText);
  return parseJsonFromLLM(result);
}

async function handleRefine(fields: Record<string, string>, destino: string, skillSystemPrompt?: string) {
  let system = `Você é um engenheiro de prompt sênior. Receba campos estruturados e:
1. Melhore cada campo com mais clareza e especificidade
2. Gere um prompt final otimizado para a plataforma "${destino}"

O prompt final deve ser estruturado, claro, e pronto para uso direto na plataforma.

Responda APENAS com JSON válido contendo os campos melhorados + "prompt_gerado":
{"especialidade":"...","persona":"...","tarefa":"...","objetivo":"...","contexto":"...","destino":"...","prompt_gerado":"O prompt completo e otimizado aqui"}`;

  if (skillSystemPrompt) {
    system = `## Perfil do Assistente\n${skillSystemPrompt}\n\n${system}`;
  }

  const userMsg = JSON.stringify(fields);
  const result = await callLLM(system, userMsg);
  return parseJsonFromLLM(result);
}

async function handleSaasSpec(
  promptFields: Record<string, string>,
  originalInput: string,
  destino: string
) {
  const system = `Você é um arquiteto de software e product manager sênior. 
Com base nas informações fornecidas, gere uma especificação técnica COMPLETA em Markdown para um projeto SaaS.

A spec deve incluir:
1. ## Visão Geral do Produto
2. ## Problema & Solução  
3. ## Público-Alvo
4. ## Funcionalidades Core (MVP)
5. ## Arquitetura Técnica
   - Stack recomendada (frontend, backend, banco de dados)
   - Diagrama de componentes (em texto)
6. ## Modelo de Dados (principais entidades e relacionamentos)
7. ## Fluxos de Usuário
8. ## Integrações Necessárias
9. ## Modelo de Negócio & Monetização
10. ## Roadmap de Desenvolvimento (fases)
11. ## Considerações de Segurança
12. ## Métricas de Sucesso (KPIs)

Seja detalhado, técnico e prático. Use Markdown com headers, listas e code blocks quando apropriado.
A plataforma alvo é: ${destino}.

Responda APENAS com JSON: {"spec_md": "...o markdown completo aqui..."}`;

  const userMsg = `Input original do usuário: ${originalInput}

Campos estruturados:
${JSON.stringify(promptFields, null, 2)}`;

  const result = await callLLM(system, userMsg);
  const parsed = parseJsonFromLLM(result);

  if (!parsed.spec_md && parsed.raw) {
    return { spec_md: parsed.raw };
  }

  return parsed;
}

// ── BUILD: Individual prompt generators ──

function buildPrdPrompt(a: Record<string, unknown>): { system: string; user: string } {
  return {
    system: `Você é um Product Manager sênior. Gere um PRD completo em Markdown para o projeto descrito. Seja detalhado, técnico e prático. Responda APENAS com Markdown puro.`,
    user: `PROJETO: ${a.appName}\nPROBLEMA: ${a.problema}\nSEGMENTO: ${a.segmento}\nFEATURES: ${JSON.stringify(a.features)}\nMODELO: ${a.modelo}\nPRICING: ${a.pricing}\nROLES: ${JSON.stringify(a.roles)}\nDOR: ${a.dor}\nCARGO: ${a.cargo}`,
  };
}

function buildErdPrompt(a: Record<string, unknown>): { system: string; user: string } {
  return {
    system: `Você é um Arquiteto de Dados sênior. Gere um ERD completo em Markdown (entidades, campos com tipos, relacionamentos) para o projeto descrito. Responda APENAS com Markdown puro.`,
    user: `PROJETO: ${a.appName}\nFEATURES: ${JSON.stringify(a.features)}\nROLES: ${JSON.stringify(a.roles)}\nSEGMENTO: ${a.segmento}\nAUTH: ${a.authMethod}`,
  };
}

function buildRbacPrompt(a: Record<string, unknown>): { system: string; user: string } {
  return {
    system: `Você é um Security Architect sênior. Gere um documento RBAC completo em Markdown (papéis, permissões por recurso, políticas RLS) para o projeto descrito. Responda APENAS com Markdown puro.`,
    user: `PROJETO: ${a.appName}\nROLES: ${JSON.stringify(a.roles)}\nFEATURES: ${JSON.stringify(a.features)}\nADMIN FEATURES: ${JSON.stringify(a.adminFeatures)}`,
  };
}

function buildRoadmapPrompt(a: Record<string, unknown>): { system: string; user: string } {
  return {
    system: `Você é um Tech Lead sênior. Gere um Roadmap de desenvolvimento em fases (MVP, v1, v2) em Markdown para o projeto descrito. Responda APENAS com Markdown puro.`,
    user: `PROJETO: ${a.appName}\nFEATURES: ${JSON.stringify(a.features)}\nMODELO: ${a.modelo}\nINTEGRAÇÕES: ${JSON.stringify(a.integracoes)}`,
  };
}

function buildSqlPrompt(a: Record<string, unknown>): { system: string; user: string } {
  return {
    system: `Você é um DBA PostgreSQL/Supabase sênior.
Gere o schema SQL COMPLETO e production-ready para o projeto abaixo.
Responda APENAS com um bloco SQL comentado, sem texto antes ou depois.

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
10. Comente cada seção com -- [SEÇÃO]`,
    user: `PROJETO: ${a.appName}\nSEGMENTO: ${a.segmento}\nROLES: ${JSON.stringify(a.roles)}\nFEATURES: ${JSON.stringify(a.features)}\nAUTH: ${a.authMethod}`,
  };
}

function buildUxFlowsPrompt(a: Record<string, unknown>): { system: string; user: string } {
  return {
    system: `Você é um UX Designer sênior. Gere os fluxos de usuário principais em Markdown (jornadas, telas, ações) para o projeto descrito. Responda APENAS com Markdown puro.`,
    user: `PROJETO: ${a.appName}\nFEATURES: ${JSON.stringify(a.features)}\nROLES: ${JSON.stringify(a.roles)}\nSEGMENTO: ${a.segmento}`,
  };
}

function buildAdminPrompt(a: Record<string, unknown>): { system: string; user: string } {
  return {
    system: `Você é um Full-Stack Developer sênior. Gere a documentação completa do painel admin em Markdown para o projeto descrito. Responda APENAS com Markdown puro.`,
    user: `PROJETO: ${a.appName}\nADMIN FEATURES: ${JSON.stringify(a.adminFeatures)}\nROLES: ${JSON.stringify(a.roles)}\nFEATURES: ${JSON.stringify(a.features)}`,
  };
}

function buildBuildPromptOutput(a: Record<string, unknown>): string {
  const features = Array.isArray(a.features) ? a.features : [];
  const roles = Array.isArray(a.roles) ? a.roles : [];
  const adminFeatures = Array.isArray(a.adminFeatures) ? a.adminFeatures : [];
  const colorPalette = String(a.colorPalette || "");

  return `
Construa um SaaS completo chamado **${a.appName}** usando:
- React + TypeScript + Vite
- Tailwind CSS + Shadcn/UI
- Supabase (Auth + Database + RLS)
- React Router DOM v6
- React Hook Form + Zod

**⚠️ IMPORTANTE: Habilite e conecte o Supabase interno do Lovable AGORA.**

### Design System
Aplique o design system da Fase 11 deste documento.
Tema padrão: ${colorPalette.toLowerCase().includes('dark') ? 'dark' : 'light'} com toggle.

### Estrutura de Rotas
Implemente TODAS as rotas da Fase 12 deste documento com React Router DOM v6.
Use lazy loading em todas as rotas privadas.

### Funcionalidades
${features.map((f: string, i: number) => `${i + 1}. ${f}`).join('\n')}

### Roles e Permissões
Implemente o RBAC da Fase 03:
${roles.join(', ')} — veja tabela de permissões.

### Painel Admin
Rotas /admin/* visíveis SOMENTE para: ${roles.includes('admin') ? 'admin' : roles[0] || 'admin'}
Features admin: ${adminFeatures.join(', ')}

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
}

function buildTestPlanPrompt(a: Record<string, unknown>): { system: string; user: string } {
  return {
    system: `Você é um QA Engineer sênior. Gere um plano de testes completo em Markdown (cenários, critérios de aceite, testes E2E) para o projeto descrito. Responda APENAS com Markdown puro.`,
    user: `PROJETO: ${a.appName}\nFEATURES: ${JSON.stringify(a.features)}\nROLES: ${JSON.stringify(a.roles)}\nAUTH: ${a.authMethod}`,
  };
}

function buildDeployPrompt(a: Record<string, unknown>): { system: string; user: string } {
  return {
    system: `Você é um DevOps Engineer sênior. Gere um guia de deploy passo a passo em Markdown para o projeto descrito. Responda APENAS com Markdown puro.`,
    user: `PROJETO: ${a.appName}\nHOSTING: ${a.hosting}\nCI/CD: ${a.cicd}\nMONITORING: ${a.monitoring}\nSTACK: Frontend=${a.stackFrontend}, Backend=${a.stackBackend}, DB=${a.stackDatabase}`,
  };
}

function buildDesignSystemPrompt(a: Record<string, unknown>): { system: string; user: string } {
  const features = Array.isArray(a.features) ? a.features : [];
  const adminFeatures = Array.isArray(a.adminFeatures) ? a.adminFeatures : [];
  return {
    system: `Você é um Design System Engineer sênior.
Gere um Design System completo e executável para o projeto abaixo.
Responda APENAS com Markdown puro, sem texto antes ou depois.

PROJETO: ${a.appName}
PALETA: ${a.colorPalette}
SEGMENTO: ${a.segmento}
TOM: ${a.tone}
FEATURES: ${features.join(', ')}

Gere EXATAMENTE esta estrutura:

## Design System — ${a.appName}

### Identidade Visual
- Nome: ${a.appName}
- Tema padrão: [dark se colorPalette contém "Dark", senão light]
- Toggle tema: sim
- Estilo: [1 linha baseada no segmento e tom]
- Inspiração: [2 produtos de referência do mercado]

### Cores (CSS Variables — valores hex reais)
\`\`\`css
:root {
  --primary: #[hex baseado na paleta];
  --primary-hover: #[hex 10% mais escuro];
  --primary-foreground: #[hex para texto sobre primary];
  --background: #[hex fundo principal];
  --surface: #[hex cards/painéis];
  --surface-elevated: #[hex modais/dropdowns];
  --border: #[hex];
  --border-muted: #[hex 50% opacity];
  --text-primary: #[hex];
  --text-secondary: #[hex muted];
  --text-tertiary: #[hex placeholder];
  --success: #[hex verde];
  --warning: #[hex amarelo/laranja];
  --danger: #[hex vermelho];
  --info: #[hex azul];
  --accent: #[hex];
  --accent-hover: #[hex];
}
\`\`\`

### Tipografia
Importe fontes do Google Fonts adequadas ao segmento.

### Escala de Tamanhos
CSS variables para text, radius, shadow.

### Logo e Favicon
Descreva ícone, favicon e PWA manifest JSON.

### Componentes Shadcn/UI Necessários
Liste os componentes a instalar baseado nas features: ${features.join(', ')}

### Navegação Principal
Liste sidebar com emojis baseado nas features e adminFeatures: ${adminFeatures.join(', ')}`,
    user: `Gere o design system completo para ${a.appName}.`,
  };
}

function buildRoutesCrudPrompt(a: Record<string, unknown>): { system: string; user: string } {
  const features = Array.isArray(a.features) ? a.features : [];
  const roles = Array.isArray(a.roles) ? a.roles : [];
  const adminFeatures = Array.isArray(a.adminFeatures) ? a.adminFeatures : [];
  return {
    system: `Você é um Arquiteto Frontend React sênior.
Gere a especificação COMPLETA de rotas e telas para o projeto abaixo.
Responda APENAS com Markdown puro, sem texto antes ou depois.

PROJETO: ${a.appName}
FEATURES: ${features.join(', ')}
ROLES: ${roles.join(', ')}
AUTH: ${a.authMethod}
ADMIN FEATURES: ${adminFeatures.join(', ')}
SEGMENTO: ${a.segmento}

Inclua:
1. Mapa de Rotas (React Router DOM v6) — públicas, privadas, admin
2. Auth Guards com regras de redirecionamento
3. Especificação Field-Level por tela (colunas, formulários, filtros, ações por role)
4. Dashboard — Métricas e KPIs específicos do segmento
5. Dependências npm necessárias
6. Estrutura de pastas recomendada`,
    user: `Gere a especificação de rotas e telas para ${a.appName}.`,
  };
}

function buildLandingPagePrompt(a: Record<string, unknown>): { system: string; user: string } {
  const features = Array.isArray(a.features) ? a.features : [];
  return {
    system: `Você é um Copywriter e UI Designer especialista em SaaS B2B brasileiro.
Gere a especificação completa da Landing Page para o projeto abaixo.
Responda APENAS com Markdown puro, sem texto antes ou depois.

PROJETO: ${a.appName}
PROBLEMA: ${a.dor} — ${a.problema}
SEGMENTO: ${a.segmento}
MODELO: ${a.modelo}
PRICING: R$ ${a.pricing}/mês
FEATURES: ${features.join(', ')}
TOM: ${a.tone}
PALETA: ${a.colorPalette}

Inclua:
1. SEO (title, meta description, keywords)
2. Hero (headline, subheadline, CTAs, prova social)
3. Problema (antes/depois)
4. Features (grid com ícones Lucide)
5. Como Funciona (3 passos)
6. Pricing
7. CTA Final
8. Footer`,
    user: `Gere a landing page completa para ${a.appName}.`,
  };
}

function buildSeedDataPrompt(a: Record<string, unknown>): { system: string; user: string } {
  const roles = Array.isArray(a.roles) ? a.roles : [];
  const features = Array.isArray(a.features) ? a.features : [];
  const appNameClean = String(a.appName || '').toLowerCase().replace(/\s/g, '');
  return {
    system: `Você é um DBA especialista em Supabase/PostgreSQL.
Gere o seed de dados demo e usuários para o projeto abaixo.
Responda APENAS com Markdown puro contendo blocos SQL, sem texto antes ou depois.

PROJETO: ${a.appName}
SEGMENTO: ${a.segmento}
ROLES: ${roles.join(', ')}
FEATURES: ${features.join(', ')}
AUTH: ${a.authMethod}

Inclua:
1. Instruções para criar usuários demo por role no painel Supabase Auth
2. SQL para atualizar profiles dos usuários criados
3. INSERTs de dados demo realistas (dados brasileiros, valores em R$, datas recentes)
4. Categorias/configurações iniciais

Emails demo: ${roles.map(r => `${r}@${appNameClean}demo.com`).join(', ')}`,
    user: `Gere o seed data para ${a.appName}.`,
  };
}

function buildChecklistDepsPrompt(a: Record<string, unknown>): { system: string; user: string } {
  const features = Array.isArray(a.features) ? a.features : [];
  const roles = Array.isArray(a.roles) ? a.roles : [];
  const adminFeatures = Array.isArray(a.adminFeatures) ? a.adminFeatures : [];
  const integracoes = Array.isArray(a.integracoes) ? a.integracoes : [];
  return {
    system: `Você é um Tech Lead especialista em entrega de projetos SaaS.
Gere o checklist completo de validação e as dependências para o projeto abaixo.
Responda APENAS com Markdown puro, sem texto antes ou depois.

PROJETO: ${a.appName}
FEATURES: ${features.join(', ')}
ROLES: ${roles.join(', ')}
ADMIN FEATURES: ${adminFeatures.join(', ')}
AUTH: ${a.authMethod}
HOSTING: ${a.hosting || 'Lovable Cloud'}
MONITORING: ${a.monitoring || 'não definido'}
CICD: ${a.cicd || 'não definido'}
INTEGRAÇÕES: ${integracoes.join(', ')}

Inclua:
1. Dependências npm (package.json — produção)
2. Variáveis de ambiente (.env)
3. Checklist de validação: Banco de Dados, Auth, Features, Admin, UI/UX, Performance, PWA, Deploy, Pós-Launch
4. Cada item como checkbox Markdown: - [ ]`,
    user: `Gere o checklist final e dependências para ${a.appName}.`,
  };
}

async function handleBuild(answers: Record<string, unknown>) {
  const a = answers;

  // Generate build_prompt synchronously (no LLM needed)
  const buildPromptText = buildBuildPromptOutput(a);

  // Prepare all LLM calls
  const prdP = buildPrdPrompt(a);
  const erdP = buildErdPrompt(a);
  const rbacP = buildRbacPrompt(a);
  const roadmapP = buildRoadmapPrompt(a);
  const sqlP = buildSqlPrompt(a);
  const uxP = buildUxFlowsPrompt(a);
  const adminP = buildAdminPrompt(a);
  const testP = buildTestPlanPrompt(a);
  const deployP = buildDeployPrompt(a);
  const designP = buildDesignSystemPrompt(a);
  const routesP = buildRoutesCrudPrompt(a);
  const landingP = buildLandingPagePrompt(a);
  const seedP = buildSeedDataPrompt(a);
  const checklistP = buildChecklistDepsPrompt(a);

  // Execute all 14 LLM calls in parallel
  const results = await Promise.allSettled([
    callLLM(prdP.system, prdP.user, 16384),           // 0
    callLLM(erdP.system, erdP.user, 16384),            // 1
    callLLM(rbacP.system, rbacP.user, 16384),          // 2
    callLLM(roadmapP.system, roadmapP.user, 16384),    // 3
    callLLM(sqlP.system, sqlP.user, 16384),             // 4
    callLLM(uxP.system, uxP.user, 16384),               // 5
    callLLM(adminP.system, adminP.user, 16384),         // 6
    callLLM(testP.system, testP.user, 16384),            // 7
    callLLM(deployP.system, deployP.user, 16384),        // 8
    callLLM(designP.system, designP.user, 16384),        // 9
    callLLM(routesP.system, routesP.user, 16384),        // 10
    callLLM(landingP.system, landingP.user, 16384),      // 11
    callLLM(seedP.system, seedP.user, 16384),            // 12
    callLLM(checklistP.system, checklistP.user, 16384),  // 13
  ]);

  const getValue = (idx: number): string => {
    const r = results[idx];
    return r.status === "fulfilled" ? r.value : "";
  };

  return {
    prd_md: getValue(0),
    erd_md: getValue(1),
    rbac_md: getValue(2),
    roadmap_md: getValue(3),
    sql_schema: getValue(4),
    ux_flows_md: getValue(5),
    admin_doc_md: getValue(6),
    build_prompt: buildPromptText,
    test_plan_md: getValue(7),
    deploy_guide_md: getValue(8),
    design_system_md: getValue(9),
    routes_crud_md: getValue(10),
    landing_page_md: getValue(11),
    seed_data_md: getValue(12),
    checklist_deps_md: getValue(13),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, freeText, fields, destino, promptFields, originalInput, answers, sessionId, skillSystemPrompt } = body ?? {};

    const isUuid = (value: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

    if (typeof sessionId !== "string" || !isUuid(sessionId)) {
      return new Response(JSON.stringify({ error: "session_id_required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowedActions = new Set(["distribute", "refine", "saas-spec", "build"]);
    if (typeof action !== "string" || !allowedActions.has(action)) {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Action: ${action}, sessionId: ${sessionId}, user: ${user.id}`);

    // Server-side credit consumption before AI generation (mandatory)
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get user's org_id from profile
    const { data: profile } = await adminClient
      .from("profiles")
      .select("personal_org_id")
      .eq("id", user.id)
      .single();

    const orgId = profile?.personal_org_id;
    if (!orgId) {
      return new Response(JSON.stringify({ error: "no_org" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Consume credit server-side
    const { error: creditError } = await adminClient.rpc("consume_credit", {
      p_org_id: orgId,
      p_user_id: user.id,
      p_session_id: sessionId,
    });

    if (creditError) {
      const errMsg = creditError.message || "";
      if (errMsg.includes("no_credits")) {
        return new Response(JSON.stringify({ error: "no_credits" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("Credit consumption error:", creditError);
      return new Response(JSON.stringify({ error: "credit_error" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: Record<string, unknown>;

    switch (action) {
      case "distribute":
        result = await handleDistribute(freeText || "", destino || "lovable", skillSystemPrompt);
        break;
      case "refine":
        result = await handleRefine(fields || {}, destino || "lovable", skillSystemPrompt);
        break;
      case "saas-spec":
        result = await handleSaasSpec(
          promptFields || {},
          originalInput || "",
          destino || "lovable"
        );
        break;
      case "build":
        result = await handleBuild(answers || {});
        break;
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("refine-prompt error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
