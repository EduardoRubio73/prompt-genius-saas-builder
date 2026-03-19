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

export interface BuildMetadata {
  appName?: string;
  dor?: string;
  roles?: string;
  modelo?: string;
  cargo?: string;
  tone?: string;
  // Extra fields from answers
  authMethod?: string;
  revenueModel?: string;
  integrations?: string;
  primaryColor?: string;
  brandName?: string;
  stackFrontend?: string;
  stackBackend?: string;
  stackDatabase?: string;
  stackHosting?: string;
  stackIcons?: string;
  stackStyling?: string;
}

const PHASE_LABELS: Record<string, { num: string; title: string; emoji: string }> = {
  erd:            { num: '01', title: 'ERD — Modelo de Dados',              emoji: '🗂️' },
  prd:            { num: '02', title: 'PRD — Requisitos do Produto',         emoji: '📋' },
  rbac:           { num: '03', title: 'RBAC — Controle de Acesso',           emoji: '🔐' },
  roadmap:        { num: '04', title: 'Roadmap de Desenvolvimento',          emoji: '🗺️' },
  sql:            { num: '05', title: 'SQL — Schema + ENUMs + RLS',          emoji: '🗄️' },
  fluxosUx:       { num: '06', title: 'Fluxos UX — Jornadas do Usuário',    emoji: '🔄' },
  admin:          { num: '07', title: 'Painel Administrativo',               emoji: '⚙️' },
  prompt:         { num: '08', title: 'Prompt de Implementação (Lovable)',   emoji: '🚀' },
  testes:         { num: '09', title: 'Plano de Testes',                    emoji: '🧪' },
  deploy:         { num: '10', title: 'Deploy e Infraestrutura',             emoji: '☁️' },
  designSystem:   { num: '11', title: 'Design System — Tokens & PWA',       emoji: '🎨' },
  routesCrud:     { num: '12', title: 'Rotas & Especificação Field-Level',   emoji: '📐' },
  landingPage:    { num: '13', title: 'Landing Page — Copy & Estrutura',    emoji: '🏠' },
  seedData:       { num: '14', title: 'Seed Data & Usuários Demo',          emoji: '🌱' },
  checklistDeps:  { num: '15', title: 'Checklist Final & Dependências',     emoji: '✅' },
};

const PHASE_ORDER: (keyof BuildOutputs)[] = [
  'erd', 'prd', 'rbac', 'roadmap', 'sql',
  'fluxosUx', 'admin', 'prompt', 'testes', 'deploy',
  'designSystem', 'routesCrud', 'landingPage', 'seedData', 'checklistDeps',
];

export function generateBuildMasterDoc(outputs: BuildOutputs, metadata: BuildMetadata = {}): string {
  const appName = metadata.appName || 'Projeto';
  const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  // Header
  let doc = `# ${appName} — Documento Mestre de Implementação\n\n`;
  doc += `⚠️ ATENÇÃO DESENVOLVEDOR: Este é um documento de instrução técnica. NÃO gere conteúdo criativo. Execute as instruções abaixo na ordem das fases, sem pular etapas.\n\n`;
  doc += `> Gerado pelo Prompt Genius · BUILD Mode · ${now}\n\n`;

  // Metadata
  const metaLines: string[] = [];
  if (metadata.dor) metaLines.push(`> **Dor/Problema:** ${metadata.dor}`);
  if (metadata.roles) metaLines.push(`> **Roles:** ${metadata.roles}`);
  if (metadata.modelo) metaLines.push(`> **Modelo de negócio:** ${metadata.modelo}`);
  if (metadata.cargo) metaLines.push(`> **Cargo:** ${metadata.cargo}`);
  if (metadata.tone) metaLines.push(`> **Tom:** ${metadata.tone}`);
  if (metaLines.length > 0) {
    doc += metaLines.join('\n') + '\n\n';
  }

  doc += `---\n\n`;

  // Stack section
  const stackFields = [
    { key: 'stackFrontend' as const, label: 'Frontend' },
    { key: 'stackBackend' as const, label: 'Backend/Auth/DB' },
    { key: 'stackDatabase' as const, label: 'Database' },
    { key: 'stackHosting' as const, label: 'Hosting' },
    { key: 'stackIcons' as const, label: 'Ícones' },
    { key: 'stackStyling' as const, label: 'Estilização' },
  ];
  const hasStack = stackFields.some(({ key }) => metadata[key]);
  if (hasStack) {
    doc += `## STACK OBRIGATÓRIA\n\n`;
    for (const { key, label } of stackFields) {
      if (metadata[key]) doc += `- ${label}: ${metadata[key]}\n`;
    }
    if (metadata.primaryColor) doc += `- Paleta principal: ${metadata.primaryColor}\n`;
    doc += `\n---\n\n`;
  }

  // General rules
  doc += `## REGRAS GERAIS DE IMPLEMENTAÇÃO\n\n`;
  const rules: string[] = [
    'Stack: React + TypeScript + Tailwind CSS + Shadcn/UI + Supabase',
    'Layout responsivo (desktop, tablet e mobile)',
    'Todos os formulários com validação e feedback de erro',
    'Toda operação assíncrona com loading state',
    'Não use dados mockados — tudo deve vir do banco em tempo real',
  ];
  if (metadata.authMethod) rules.push(`Autenticação: ${metadata.authMethod}`);
  if (metadata.revenueModel) rules.push(`Modelo de receita: ${metadata.revenueModel}`);
  if (metadata.integrations) rules.push(`Integrações: ${metadata.integrations}`);
  if (metadata.primaryColor) rules.push(`Cor primária da marca: ${metadata.primaryColor}`);
  if (metadata.brandName) rules.push(`Nome da marca: ${metadata.brandName}`);
  for (const r of rules) doc += `- ${r}\n`;
  doc += `\n---\n\n`;

  // Phases
  for (const key of PHASE_ORDER) {
    const content = outputs[key];
    if (!content) continue;
    const phase = PHASE_LABELS[key];
    doc += `## FASE ${phase.num} — ${phase.emoji} ${phase.title}\n\n${content}\n\n---\n\n`;
  }

  return doc.trimEnd() + '\n';
}
