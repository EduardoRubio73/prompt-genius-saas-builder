import { useState, useCallback, useRef, useEffect } from "react";
import { useLoading } from "@/contexts/LoadingContext";
import { useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";
import { callEdgeFunction } from "@/lib/edgeFunctions";
import JSZip from "jszip";

import { MistoSpecLoading } from "@/components/misto/MistoSpecLoading";
import { CreditModal } from "@/components/misto/CreditModal";
import { UnifiedMemorySidebar } from "@/components/UnifiedMemorySidebar";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { CopyButton } from "@/components/CopyButton";

import "../misto/misto.css";

export interface BuildAnswers {
  productName: string;
  problema: string;
  segmento: string;
  cargo: string;
  dor: string;
  features: string[];
  modelo: string;
  pricing: string;
  stackFrontend: string;
  stackBackend: string;
  stackDatabase: string;
  hosting: string;
  cicd: string;
  monitoring: string;
  authMethod: string;
  roles: string[];
  adminFeatures: string[];
  integracoes: string[];
  integracoesCustom: string;
  appName: string;
  colorPalette: string;
  tone: string;
}

const emptyAnswers: BuildAnswers = {
  productName: "", problema: "", segmento: "", cargo: "", dor: "",
  features: ["", "", ""], modelo: "", pricing: "",
  stackFrontend: "", stackBackend: "", stackDatabase: "",
  hosting: "", cicd: "", monitoring: "",
  authMethod: "", roles: ["admin", "user"],
  adminFeatures: [], integracoes: [], integracoesCustom: "",
  appName: "", colorPalette: "", tone: "",
};

type BuildStep = 1|2|3|4|5|6|7|8|9|10|"generating"|"results";

const DOC_LABELS: Record<string, string> = {
  prd_md: "📋 PRD — Product Requirements",
  erd_md: "🗂️ ERD — Modelo de Dados",
  rbac_md: "🔐 RBAC — Permissões",
  ux_flows_md: "🔄 Fluxos UX",
  test_plan_md: "🧪 Plano de Testes",
  roadmap_md: "🗺️ Roadmap",
  admin_doc_md: "⚙️ Doc Admin",
  sql_schema: "💾 SQL Schema",
  build_prompt: "🤖 Build Prompt",
  deploy_guide_md: "🚀 Guia de Deploy",
};

const DOC_KEYS = Object.keys(DOC_LABELS);

type StepProps = {
  answers: BuildAnswers;
  onChange: (partial: Partial<BuildAnswers>) => void;
  onNext: () => void;
  onPrev?: () => void;
  canNext: boolean;
};

type FinalStepProps = {
  answers: BuildAnswers;
  onChange: (partial: Partial<BuildAnswers>) => void;
  onGenerate: () => void;
  onPrev: () => void;
  canNext: boolean;
};

/* ── Dynamic suggestion engine ── */
const SEGMENT_MAP: Record<string, string[]> = {
  saude: ["Saúde", "Clínicas", "Hospitais", "Telemedicina"],
  medic: ["Saúde", "Clínicas", "Hospitais"],
  financ: ["Fintech", "Bancos", "Seguradoras", "Contabilidade"],
  educa: ["EdTech", "Escolas", "Universidades", "Cursos Online"],
  imobili: ["Imobiliário", "Corretoras", "Construtoras"],
  juridi: ["Jurídico", "Escritórios de Advocacia", "LegalTech"],
  logist: ["Logística", "Transportes", "Supply Chain"],
  aliment: ["Food Tech", "Restaurantes", "Delivery"],
  agro: ["AgroTech", "Fazendas", "Cooperativas"],
  rh: ["RH", "Recrutamento", "Gestão de Pessoas"],
  market: ["Marketing", "Agências", "Growth"],
  ecommerce: ["E-commerce", "Varejo", "Marketplace"],
  arquitet: ["Arquitetura", "Engenharia Civil", "Construção"],
  contab: ["Contabilidade", "Auditoria", "Finanças"],
  whats: ["Atendimento", "Suporte", "Comunicação"],
};

const CARGO_MAP: Record<string, string[]> = {
  saude: ["Médico", "Enfermeiro", "Gestor Clínico", "Paciente"],
  financ: ["CFO", "Contador", "Analista Financeiro", "Investidor"],
  educa: ["Professor", "Aluno", "Coordenador", "Diretor"],
  imobili: ["Corretor", "Proprietário", "Inquilino", "Síndico"],
  juridi: ["Advogado", "Paralegal", "Cliente", "Juiz"],
  logist: ["Motorista", "Despachante", "Gerente de Frota"],
  rh: ["Recrutador", "Gestor de RH", "Candidato", "Colaborador"],
  market: ["CMO", "Analista de Marketing", "Designer", "Copywriter"],
  ecommerce: ["Lojista", "Comprador", "Gestor de Estoque"],
};

const FEATURE_SUGGESTIONS_BASE = [
  "Dashboard analítico", "Gestão de usuários", "Notificações",
  "Relatórios PDF", "Chat interno", "API REST",
  "Faturamento", "Agenda/Calendário", "Upload de arquivos",
  "Busca avançada", "Multi-idioma", "Exportar dados",
];

function getKeywordMatch(text: string): string {
  const lower = text.toLowerCase();
  for (const key of Object.keys(SEGMENT_MAP)) {
    if (lower.includes(key)) return key;
  }
  return "";
}

function getSuggestions(text: string, map: Record<string, string[]>, fallback: string[]): string[] {
  const key = getKeywordMatch(text);
  return key && map[key] ? map[key] : fallback;
}

function ChipSelector({ options, value, onChange, multi = false }: {
  options: string[]; value: string | string[]; onChange: (v: any) => void; multi?: boolean;
}) {
  if (multi) {
    const arr = value as string[];
    return (
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map(o => (
          <button key={o} type="button" className={`saas-chip ${arr.includes(o) ? "sel" : ""}`}
            onClick={() => onChange(arr.includes(o) ? arr.filter(x => x !== o) : [...arr, o])}>
            {arr.includes(o) ? "✓ " : ""}{o}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map(o => (
        <button key={o || "ia"} type="button" className={`saas-chip ${value === o ? "sel" : ""}`}
          onClick={() => onChange(o)}>
          {o || "🤖 IA decide"}
        </button>
      ))}
    </div>
  );
}

const WIZARD_STEPS = [
  { num: 1, label: "Produto" },
  { num: 2, label: "Público" },
  { num: 3, label: "Features" },
  { num: 4, label: "Modelo" },
  { num: 5, label: "Stack" },
  { num: 6, label: "Infra" },
  { num: 7, label: "Auth" },
  { num: 8, label: "Admin" },
  { num: 9, label: "Integrações" },
  { num: 10, label: "Branding" },
];

function BuildStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="misto-stepper" style={{ maxWidth: 1000 }}>
      <div className="step-track">
        {WIZARD_STEPS.map((s) => {
          const isDone = s.num < currentStep;
          const isActive = s.num === currentStep;
          return (
            <div key={s.num} className={`step-node ${isDone ? "done" : isActive ? "active" : "future"}`}>
              <div className={`step-circle ${isDone ? "sc-done" : isActive ? "sc-active" : "sc-future"}`}>
                {isDone ? "✓" : s.num}
              </div>
              <div className={`step-label ${isDone ? "sl-done" : isActive ? "sl-active" : "sl-future"}`}>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const EXAMPLE_PROBLEMA = "Uma plataforma para clínicas médicas gerenciarem pacientes, agendamentos, prontuários eletrônicos e faturamento, com painel de indicadores e integração com WhatsApp para lembretes.";

function BuildStep1({ answers, onChange, onNext, canNext }: StepProps) {
  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          1. Nome e Problema
          <InfoTooltip content="Dê um nome ao seu produto e descreva o problema que ele resolve. Quanto mais contexto (público, cenário atual, diferenciais), melhor será a spec gerada." />
        </div>
        <div className="prompt-field-group">
          <div className="prompt-field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            📛 Nome do Produto
            <InfoTooltip content="Nome comercial ou provisório do seu SaaS. Ex: WhatsFlow, ClinicaPro, FreelanceHub." />
          </div>
          <input className="prompt-field-input" value={answers.productName}
            onChange={(e) => onChange({ productName: e.target.value })}
            placeholder="Ex: WhatsFlow, ClinicaPro, FreelanceHub" />
        </div>
        <div className="prompt-field-group">
          <div className="prompt-field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            🎯 Problema
            <InfoTooltip content="Descreva com detalhes: quem sofre o problema, como é resolvido hoje e por que sua solução seria melhor. Mín. 50 caracteres." />
          </div>
          <textarea className="misto-textarea" style={{ minHeight: 160 }} value={answers.problema}
            onChange={(e) => onChange({ problema: e.target.value })}
            placeholder="Descreva o problema com detalhes... Quem sofre? Como resolvem hoje? O que torna sua solução única?" />
          <div className={`misto-char-count ${answers.problema.length < 50 ? "warning" : ""}`}>
            {answers.problema.length} caracteres {answers.problema.length < 50 && "(mín. 50)"}
          </div>
        </div>
        <div className="saas-tip">💡 Dica: Inclua público-alvo, cenário atual e diferenciais competitivos.</div>
        {!answers.problema && (
          <button className="saas-chip" style={{ marginTop: 8 }} onClick={() => onChange({ problema: EXAMPLE_PROBLEMA })}>
            📋 Usar exemplo
          </button>
        )}
        <div className="saas-nav-row">
          <div />
          <button className="saas-nav-btn saas-nav-btn-primary" onClick={onNext} disabled={!canNext}>Próximo →</button>
        </div>
      </div>
    </div>
  );
}

function BuildStep2({ answers, onChange, onNext, onPrev, canNext }: StepProps) {
  const ctx = answers.problema + " " + answers.productName;
  const segSuggestions = getSuggestions(ctx, SEGMENT_MAP, ["Tecnologia", "Saúde", "Educação", "Varejo", "Serviços"]);
  const cargoSuggestions = getSuggestions(ctx, CARGO_MAP, ["CEO", "Gerente", "Analista", "Usuário Final", "Admin"]);
  const dorSuggestions = ["Processos manuais", "Falta de visibilidade", "Custos altos", "Comunicação ineficiente", "Perda de dados"];

  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          2. Público-Alvo
          <InfoTooltip content="Defina quem são os usuários do seu produto. Segmento de mercado, cargos que usarão e a principal dor que enfrentam." />
        </div>
        <div className="saas-step-desc">Identifique seu público. Clique nas sugestões ou escreva livremente.</div>

        <div className="prompt-field-group">
          <div className="prompt-field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            🏢 Segmento
            <InfoTooltip content="Nicho de mercado. Ex: Saúde, Fintech, EdTech, Logística, Varejo." />
          </div>
          <input className="prompt-field-input" value={answers.segmento} onChange={(e) => onChange({ segmento: e.target.value })}
            placeholder="Ex: Saúde, Fintech, EdTech..." />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            {segSuggestions.map(s => (
              <button key={s} type="button" className={`saas-chip ${answers.segmento === s ? "sel" : ""}`}
                onClick={() => onChange({ segmento: s })}>{s}</button>
            ))}
          </div>
        </div>

        <div className="prompt-field-group">
          <div className="prompt-field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            👤 Cargo / Persona
            <InfoTooltip content="Quem vai usar no dia a dia? Ex: Médico, CEO, Analista, Aluno." />
          </div>
          <input className="prompt-field-input" value={answers.cargo} onChange={(e) => onChange({ cargo: e.target.value })}
            placeholder="Ex: Médico, Gerente, Analista..." />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            {cargoSuggestions.map(s => (
              <button key={s} type="button" className={`saas-chip ${answers.cargo === s ? "sel" : ""}`}
                onClick={() => onChange({ cargo: s })}>{s}</button>
            ))}
          </div>
        </div>

        <div className="prompt-field-group">
          <div className="prompt-field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            😣 Principal Dor
            <InfoTooltip content="O maior problema que seu público enfrenta hoje. Ex: 'Perdem horas com planilhas manuais'." />
          </div>
          <input className="prompt-field-input" value={answers.dor} onChange={(e) => onChange({ dor: e.target.value })}
            placeholder="Ex: Processos manuais e perda de dados..." />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            {dorSuggestions.map(s => (
              <button key={s} type="button" className={`saas-chip ${answers.dor === s ? "sel" : ""}`}
                onClick={() => onChange({ dor: s })}>{s}</button>
            ))}
          </div>
        </div>

        <div className="saas-nav-row">
          <button className="saas-nav-btn" onClick={() => onPrev?.()}>← Anterior</button>
          <button className="saas-nav-btn saas-nav-btn-primary" onClick={onNext} disabled={!canNext}>Próximo →</button>
        </div>
      </div>
    </div>
  );
}

function BuildStep3({ answers, onChange, onNext, onPrev, canNext }: StepProps) {
  const features = answers.features;
  const updateFeature = (idx: number, value: string) => {
    const next = [...features]; next[idx] = value; onChange({ features: next });
  };
  const addFeature = () => { if (features.length < 8) onChange({ features: [...features, ""] }); };
  const removeFeature = (idx: number) => { if (features.length > 1) onChange({ features: features.filter((_, i) => i !== idx) }); };
  const addSuggestion = (s: string) => {
    if (!features.includes(s)) {
      const emptyIdx = features.findIndex(f => !f);
      if (emptyIdx >= 0) { const next = [...features]; next[emptyIdx] = s; onChange({ features: next }); }
      else if (features.length < 8) onChange({ features: [...features, s] });
    }
  };

  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          3. Funcionalidades Core
          <InfoTooltip content="Liste as funcionalidades essenciais do MVP. Foque no que diferencia seu produto. Mín. 3, máx. 8 features." />
        </div>
        <div className="saas-step-desc">Liste as funcionalidades essenciais (mínimo 3, máximo 8). Clique nas sugestões para adicionar rapidamente.</div>

        <div className="saas-feature-list">
          {features.map((f, idx) => (
            <div key={idx} className="saas-feature-item">
              <span style={{ color: "hsl(var(--primary))", fontWeight: 700, fontSize: 13 }}>{idx + 1}.</span>
              <input value={f} onChange={(e) => updateFeature(idx, e.target.value)} placeholder={`Feature ${idx + 1}`} />
              {features.length > 1 && (
                <button className="saas-feature-remove" onClick={() => removeFeature(idx)}>×</button>
              )}
            </div>
          ))}
        </div>
        {features.length < 8 && (
          <button className="saas-add-btn" onClick={addFeature}>+ Adicionar feature</button>
        )}

        <div style={{ marginTop: 16 }}>
          <div className="prompt-field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            💡 Sugestões
            <InfoTooltip content="Clique para adicionar automaticamente ao primeiro campo vazio." />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {FEATURE_SUGGESTIONS_BASE.map(s => (
              <button key={s} type="button" className={`saas-chip ${features.includes(s) ? "sel" : ""}`}
                onClick={() => addSuggestion(s)}>{s}</button>
            ))}
          </div>
        </div>

        <div className="saas-nav-row">
          <button className="saas-nav-btn" onClick={() => onPrev?.()}>← Anterior</button>
          <button className="saas-nav-btn saas-nav-btn-primary" onClick={onNext} disabled={!canNext}>Próximo →</button>
        </div>
      </div>
    </div>
  );
}

function BuildStep4({ answers, onChange, onNext, onPrev, canNext }: StepProps) {
  const modelos = [
    { value: "saas_subscription", label: "SaaS Assinatura", desc: "Recorrência mensal/anual com planos" },
    { value: "freemium", label: "Freemium", desc: "Plano grátis com upgrade pago" },
    { value: "marketplace", label: "Marketplace", desc: "Comissão sobre transações" },
    { value: "pay_per_use", label: "Pay-per-use", desc: "Cobra por uso (API calls, créditos)" },
    { value: "license", label: "Licença", desc: "Pagamento único ou anual" },
  ];

  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          4. Modelo de Negócio
          <InfoTooltip content="Como seu SaaS vai gerar receita? Escolha o modelo que melhor se encaixa no seu público e proposta de valor." />
        </div>
        <div className="saas-step-desc">Selecione o modelo de monetização principal.</div>

        {modelos.map(m => (
          <div key={m.value}
            className={`saas-radio-card ${answers.modelo === m.value ? "sel" : ""}`}
            onClick={() => onChange({ modelo: m.value })}>
            <div className="saas-radio-dot"><div className="saas-radio-dot-inner" /></div>
            <div>
              <div className="saas-radio-label">{m.label}</div>
              <div className="saas-radio-desc">{m.desc}</div>
            </div>
          </div>
        ))}

        {answers.modelo && (
          <div className="prompt-field-group" style={{ marginTop: 16 }}>
            <div className="prompt-field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              💰 Faixa de preço (opcional)
              <InfoTooltip content="Informe os valores dos planos. Ex: R$ 49/mês, R$ 99/mês. Ajuda a IA a projetar a estrutura de billing." />
            </div>
            <input className="prompt-field-input" placeholder="Ex: R$ 49/mês, R$ 99/mês, R$ 199/mês"
              value={answers.pricing} onChange={(e) => onChange({ pricing: e.target.value })} />
          </div>
        )}

        <div className="saas-nav-row">
          <button className="saas-nav-btn" onClick={() => onPrev?.()}>← Anterior</button>
          <button className="saas-nav-btn saas-nav-btn-primary" onClick={onNext} disabled={!canNext}>Próximo →</button>
        </div>
      </div>
    </div>
  );
}

function BuildStep5({ answers, onChange, onNext, onPrev }: StepProps) {
  const frontendOpts = ["React", "Next.js", "Vue", "Svelte", ""];
  const backendOpts = ["Node.js", "Python", "Go", "Supabase Edge", ""];
  const dbOpts = ["PostgreSQL", "MongoDB", "MySQL", "Supabase", ""];

  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          5. Stack Técnica
          <InfoTooltip content="Escolha as tecnologias ou deixe a IA decidir. Você pode mudar depois." />
        </div>
        <div className="saas-step-desc">Escolha sua stack ou selecione "IA decide" se não tem preferência.</div>
        <div className="saas-tip">🤖 A spec recomendará a melhor opção quando "IA decide" estiver selecionado.</div>

        <div className="prompt-field-group">
          <div className="prompt-field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            ⚛️ Frontend
            <InfoTooltip content="Framework de interface. React é padrão para Lovable. Next.js para SSR/SEO." />
          </div>
          <ChipSelector options={frontendOpts} value={answers.stackFrontend} onChange={(v: string) => onChange({ stackFrontend: v })} />
        </div>
        <div className="prompt-field-group">
          <div className="prompt-field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            ⚙️ Backend
            <InfoTooltip content="Lógica de servidor. Supabase Edge é ideal para Lovable Cloud. Node.js para maior flexibilidade." />
          </div>
          <ChipSelector options={backendOpts} value={answers.stackBackend} onChange={(v: string) => onChange({ stackBackend: v })} />
        </div>
        <div className="prompt-field-group">
          <div className="prompt-field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            🗄️ Database
            <InfoTooltip content="Banco de dados. PostgreSQL/Supabase são recomendados para RLS e autenticação integrada." />
          </div>
          <ChipSelector options={dbOpts} value={answers.stackDatabase} onChange={(v: string) => onChange({ stackDatabase: v })} />
        </div>

        <div className="saas-nav-row">
          <button className="saas-nav-btn" onClick={() => onPrev?.()}>← Anterior</button>
          <button className="saas-nav-btn saas-nav-btn-primary" onClick={onNext}>Próximo →</button>
        </div>
      </div>
    </div>
  );
}

function BuildStep6({ answers, onChange, onNext, onPrev }: StepProps) {
  const hostingOpts = ["Vercel", "AWS", "Railway", "Fly.io", ""];
  const cicdOpts = ["GitHub Actions", "GitLab CI", "CircleCI", ""];
  const monitoringOpts = ["Sentry", "Datadog", "LogRocket", ""];

  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          6. Infraestrutura
          <InfoTooltip content="Defina hosting, CI/CD e monitoramento. Selecione 'IA decide' se não tem preferência." />
        </div>
        <div className="saas-step-desc">Configure a infra do seu projeto ou deixe a IA recomendar.</div>

        <div className="prompt-field-group">
          <div className="prompt-field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            ☁️ Hosting
            <InfoTooltip content="Onde seu app vai rodar. Vercel é ótimo para frontend. AWS para escala enterprise." />
          </div>
          <ChipSelector options={hostingOpts} value={answers.hosting} onChange={(v: string) => onChange({ hosting: v })} />
        </div>
        <div className="prompt-field-group">
          <div className="prompt-field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            🔄 CI/CD
            <InfoTooltip content="Pipeline de deploy automático. GitHub Actions é o mais popular para projetos open-source." />
          </div>
          <ChipSelector options={cicdOpts} value={answers.cicd} onChange={(v: string) => onChange({ cicd: v })} />
        </div>
        <div className="prompt-field-group">
          <div className="prompt-field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            📊 Monitoring
            <InfoTooltip content="Monitoramento de erros e performance. Sentry é o padrão para projetos web." />
          </div>
          <ChipSelector options={monitoringOpts} value={answers.monitoring} onChange={(v: string) => onChange({ monitoring: v })} />
        </div>

        <div className="saas-nav-row">
          <button className="saas-nav-btn" onClick={() => onPrev?.()}>← Anterior</button>
          <button className="saas-nav-btn saas-nav-btn-primary" onClick={onNext}>Próximo →</button>
        </div>
      </div>
    </div>
  );
}

function BuildStep7({ answers, onChange, onNext, onPrev, canNext }: StepProps) {
  const authOpts = [
    { value: "email_password", label: "Email + Senha", desc: "Padrão, simples de implementar" },
    { value: "magic_link", label: "Magic Link", desc: "Login sem senha, via e-mail" },
    { value: "oauth", label: "OAuth (Google, GitHub)", desc: "Login social, rápido para usuários" },
    { value: "sso_saml", label: "SSO/SAML", desc: "Enterprise, integração corporativa" },
  ];

  const roleSuggestions = ["admin", "user", "moderator", "editor", "viewer", "manager", "billing_admin"];
  const roles = answers.roles;

  const updateRole = (idx: number, value: string) => {
    const next = [...roles]; next[idx] = value; onChange({ roles: next });
  };
  const addRole = () => { if (roles.length < 8) onChange({ roles: [...roles, ""] }); };
  const removeRole = (idx: number) => { if (roles.length > 1) onChange({ roles: roles.filter((_, i) => i !== idx) }); };
  const addRoleSuggestion = (s: string) => {
    if (!roles.includes(s)) {
      const emptyIdx = roles.findIndex(r => !r);
      if (emptyIdx >= 0) { const next = [...roles]; next[emptyIdx] = s; onChange({ roles: next }); }
      else if (roles.length < 8) onChange({ roles: [...roles, s] });
    }
  };

  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          7. Auth & Roles
          <InfoTooltip content="Defina o método de autenticação e os papéis (roles) do sistema. Roles controlam permissões de acesso." />
        </div>
        <div className="saas-step-desc">Selecione o método de login e configure os papéis de usuário.</div>

        <div className="prompt-field-group">
          <div className="prompt-field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            🔑 Método de Auth
            <InfoTooltip content="Como os usuários vão fazer login. Pode combinar múltiplos métodos depois." />
          </div>
          {authOpts.map(m => (
            <div key={m.value}
              className={`saas-radio-card ${answers.authMethod === m.value ? "sel" : ""}`}
              onClick={() => onChange({ authMethod: m.value })}>
              <div className="saas-radio-dot"><div className="saas-radio-dot-inner" /></div>
              <div>
                <div className="saas-radio-label">{m.label}</div>
                <div className="saas-radio-desc">{m.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="prompt-field-group" style={{ marginTop: 16 }}>
          <div className="prompt-field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            👥 Roles (papéis)
            <InfoTooltip content="Defina os papéis de usuário. Ex: admin, user, moderator. Cada role terá permissões específicas no RBAC." />
          </div>
          <div className="saas-feature-list">
            {roles.map((role, idx) => (
              <div key={idx} className="saas-feature-item">
                <span style={{ color: "hsl(var(--primary))", fontWeight: 700, fontSize: 13 }}>{idx + 1}.</span>
                <input value={role} onChange={(e) => updateRole(idx, e.target.value)} placeholder={`Role ${idx + 1}`} />
                {roles.length > 1 && (
                  <button className="saas-feature-remove" onClick={() => removeRole(idx)}>×</button>
                )}
              </div>
            ))}
          </div>
          {roles.length < 8 && (
            <button className="saas-add-btn" onClick={addRole}>+ Adicionar role</button>
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {roleSuggestions.filter(s => !roles.includes(s)).map(s => (
              <button key={s} type="button" className="saas-chip" onClick={() => addRoleSuggestion(s)}>{s}</button>
            ))}
          </div>
        </div>

        <div className="saas-nav-row">
          <button className="saas-nav-btn" onClick={() => onPrev?.()}>← Anterior</button>
          <button className="saas-nav-btn saas-nav-btn-primary" onClick={onNext} disabled={!canNext}>Próximo →</button>
        </div>
      </div>
    </div>
  );
}

function BuildStep8({ answers, onChange, onNext, onPrev }: StepProps) {
  const opts = [
    { key: "Users", desc: "Gestão de usuários, ativação, bloqueio" },
    { key: "Billing", desc: "Planos, assinaturas, faturas" },
    { key: "Audit", desc: "Logs de ações, trilha de auditoria" },
    { key: "Feature Flags", desc: "Ativar/desativar funcionalidades" },
    { key: "API Keys", desc: "Gerenciar chaves de API" },
    { key: "Analytics", desc: "Métricas de uso, relatórios" },
    { key: "Settings", desc: "Configurações globais da plataforma" },
    { key: "Support Tickets", desc: "Sistema de suporte interno" },
  ];
  const toggle = (item: string) => onChange({
    adminFeatures: answers.adminFeatures.includes(item)
      ? answers.adminFeatures.filter((x) => x !== item)
      : [...answers.adminFeatures, item],
  });

  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          8. Painel Admin
          <InfoTooltip content="Selecione quais funcionalidades o painel administrativo deve ter. Isso define o escopo do back-office." />
        </div>
        <div className="saas-step-desc">Quais módulos o painel admin precisa? Selecione todos que se aplicam.</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {opts.map((o) => (
            <div key={o.key}
              className={`saas-radio-card ${answers.adminFeatures.includes(o.key) ? "sel" : ""}`}
              onClick={() => toggle(o.key)}
              style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{answers.adminFeatures.includes(o.key) ? "✅" : "⬜"}</span>
                <div>
                  <div className="saas-radio-label">{o.key}</div>
                  <div className="saas-radio-desc">{o.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="saas-nav-row" style={{ marginTop: 16 }}>
          <button className="saas-nav-btn" onClick={() => onPrev?.()}>← Anterior</button>
          <button className="saas-nav-btn saas-nav-btn-primary" onClick={onNext}>Próximo →</button>
        </div>
      </div>
    </div>
  );
}

function BuildStep9({ answers, onChange, onNext, onPrev }: StepProps) {
  const opts = [
    "Stripe", "SendGrid/Resend", "Supabase Storage", "Analytics",
    "Webhooks", "WhatsApp API", "Slack", "Zapier", "OpenAI/LLM",
    "Google Maps", "Firebase Push",
  ];
  const toggle = (item: string) => onChange({
    integracoes: answers.integracoes.includes(item)
      ? answers.integracoes.filter((x) => x !== item)
      : [...answers.integracoes, item],
  });

  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          9. Integrações
          <InfoTooltip content="Selecione serviços externos que seu SaaS precisa. Isso impacta a arquitetura e o custo operacional." />
        </div>
        <div className="saas-step-desc">Selecione as integrações necessárias. Você pode adicionar outras manualmente.</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {opts.map((o) => (
            <button key={o} type="button" className={`saas-chip ${answers.integracoes.includes(o) ? "sel" : ""}`} onClick={() => toggle(o)}>
              {answers.integracoes.includes(o) ? "✓ " : ""}{o}
            </button>
          ))}
        </div>

        <div className="prompt-field-group">
          <div className="prompt-field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            ✏️ Outras integrações
            <InfoTooltip content="Adicione integrações não listadas acima. Separe por vírgula. Ex: Twilio, HubSpot, Mailchimp" />
          </div>
          <input className="prompt-field-input" placeholder="Ex: Twilio, HubSpot, Mailchimp..."
            value={answers.integracoesCustom} onChange={(e) => onChange({ integracoesCustom: e.target.value })} />
        </div>

        <div className="saas-nav-row">
          <button className="saas-nav-btn" onClick={() => onPrev?.()}>← Anterior</button>
          <button className="saas-nav-btn saas-nav-btn-primary" onClick={onNext}>Próximo →</button>
        </div>
      </div>
    </div>
  );
}

function BuildStep10({ answers, onChange, onGenerate, onPrev, canNext }: FinalStepProps) {
  const colorSuggestions = ["Azul Corporativo", "Verde Natureza", "Roxo Tech", "Laranja Energia", "Dark Mode Elegante", "Minimalista Branco"];
  const toneSuggestions = ["Profissional", "Casual", "Técnico", "Amigável", "Corporativo", "Moderno"];

  useEffect(() => {
    if (!answers.appName && answers.productName) {
      onChange({ appName: answers.productName });
    }
  }, []);

  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          10. Branding
          <InfoTooltip content="Defina a identidade visual e o tom de comunicação do seu produto. Isso guia o design system gerado." />
        </div>
        <div className="saas-step-desc">Configure a identidade do seu produto.</div>

        <div className="prompt-field-group">
          <div className="prompt-field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            📱 App Name
            <InfoTooltip content="Nome que aparecerá na interface, PWA e comunicações. Pode ser diferente do nome comercial." />
          </div>
          <input className="prompt-field-input" value={answers.appName} onChange={(e) => onChange({ appName: e.target.value })}
            placeholder="Ex: WhatsFlow App" />
        </div>

        <div className="prompt-field-group">
          <div className="prompt-field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            🎨 Paleta de Cores
            <InfoTooltip content="Escolha um estilo visual ou descreva cores específicas. Ex: Azul (#1E40AF) com acentos em verde." />
          </div>
          <input className="prompt-field-input" value={answers.colorPalette} onChange={(e) => onChange({ colorPalette: e.target.value })}
            placeholder="Ex: Azul corporativo com acentos em verde" />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            {colorSuggestions.map(s => (
              <button key={s} type="button" className={`saas-chip ${answers.colorPalette === s ? "sel" : ""}`}
                onClick={() => onChange({ colorPalette: s })}>{s}</button>
            ))}
          </div>
        </div>

        <div className="prompt-field-group">
          <div className="prompt-field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            ✍️ Tom de Comunicação
            <InfoTooltip content="O tom dos textos e mensagens do app. Define o estilo de copy e UX writing." />
          </div>
          <input className="prompt-field-input" value={answers.tone} onChange={(e) => onChange({ tone: e.target.value })}
            placeholder="Ex: Profissional e amigável" />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            {toneSuggestions.map(s => (
              <button key={s} type="button" className={`saas-chip ${answers.tone === s ? "sel" : ""}`}
                onClick={() => onChange({ tone: s })}>{s}</button>
            ))}
          </div>
        </div>

        <div className="saas-nav-row">
          <button className="saas-nav-btn" onClick={onPrev}>← Anterior</button>
          <button className="saas-nav-btn saas-nav-btn-primary" onClick={onGenerate} disabled={!canNext}>
            {!canNext && canNext !== undefined ? (
              <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" /> Gerando...</>
            ) : (
              "🚀 Gerar Projeto BUILD — 5 cotas"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
export default function BuildMode() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { theme, toggleTheme } = useTheme();
  const orgId = profile?.personal_org_id ?? undefined;

  const [step, setStep] = useState<BuildStep>(1);
  const [answers, setAnswers] = useState<BuildAnswers>(emptyAnswers);
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [creditModal, setCreditModal] = useState<"no_credits"|"trial_expired"|"suspended"|null>(null);
  const [creditBalance, setCreditBalance] = useState<number|null>(null);
  const [activeDoc, setActiveDoc] = useState(DOC_KEYS[0]);
  const startTime = useRef(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [sessionId, setSessionId] = useState<string|null>(null);
  const [memoryRefreshKey, setMemoryRefreshKey] = useState(0);

  const fetchBalance = useCallback(async () => {
    if (!orgId) return null;
    try {
      const b = await callEdgeFunction("org-dashboard", { org_id: orgId });
      setCreditBalance(b.total_remaining);
      return b;
    } catch { return null; }
  }, [orgId]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  const updateAnswers = (partial: Partial<BuildAnswers>) => setAnswers(prev => ({ ...prev, ...partial }));

  const canNext = (s: number): boolean => {
    switch (s) {
      case 1: return answers.problema.length >= 50 && answers.productName.length >= 2;
      case 2: return answers.segmento.length >= 3 && answers.dor.length >= 3;
      case 3: return answers.features.filter(f => f.length >= 3).length >= 3;
      case 4: return answers.modelo.length > 0;
      case 7: return answers.authMethod.length > 0;
      case 10: return answers.appName.length >= 2;
      default: return true;
    }
  };

  const { showLoading, hideLoading } = useLoading();

  const handleGenerate = useCallback(async () => {
    if (!orgId || !user) { toast.error("Usuário não autenticado"); return; }

    const balance = await fetchBalance();
    if (!balance) { toast.error("Erro ao verificar cotas"); return; }
    if (balance.account_status === "trial_expired") { setCreditModal("trial_expired"); return; }
    if (balance.account_status === "suspended") { setCreditModal("suspended"); return; }
    if (balance.total_remaining <= 0) { setCreditModal("no_credits"); return; }

    startTime.current = Date.now();
    showLoading("Gerando Projeto BUILD...");

    try {
      setStep("generating");

      const { data: sessionRecord, error: sessErr } = await supabase
        .from("sessions").insert({ org_id: orgId, user_id: user.id, mode: "build" as const, tokens_total: 0 })
        .select().single();
      if (sessErr) throw sessErr;
      const currentSessionId = sessionRecord.id;
      setSessionId(currentSessionId);

      const result = await callEdgeFunction("refine-prompt", {
        action: "build",
        answers,
        sessionId: currentSessionId,
      });

      setOutputs(result as Record<string, string>);
      setTimeElapsed((Date.now() - startTime.current) / 1000);
      setStep("results");
      hideLoading();

      await supabase.from("sessions").update({ completed: true, raw_input: answers.problema }).eq("id", currentSessionId);
      fetchBalance();

      // Auto-save
      try {
        await supabase.from("build_projects").insert({
          session_id: currentSessionId,
          org_id: orgId,
          user_id: user.id,
          project_name: answers.appName || answers.productName,
          answers: answers as any,
          outputs: result as any,
        });
        setIsSaved(true);
        setMemoryRefreshKey(k => k + 1);
        toast.success("✅ Salvo automaticamente");
      } catch (e) {
        console.warn("Auto-save falhou:", e);
      }

      toast.success("🚀 Projeto BUILD gerado com sucesso!");
    } catch (err: any) {
      hideLoading();
      toast.error(err.message || "Erro ao gerar projeto.");
      setStep(10);
    }
  }, [orgId, user, answers, fetchBalance]);

  const handleDownloadZip = useCallback(async () => {
    const zip = new JSZip();
    for (const key of DOC_KEYS) {
      if (outputs[key]) {
        const ext = key === "sql_schema" ? "sql" : "md";
        zip.file(`${key}.${ext}`, outputs[key]);
      }
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${answers.appName || "build-project"}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }, [outputs, answers.appName]);

  const handleNewSession = () => {
    setStep(1); setAnswers(emptyAnswers);
    setOutputs({}); setIsSaved(false);
    setTimeElapsed(0); setSessionId(null);
    setActiveDoc(DOC_KEYS[0]);
  };

  const copyText = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copiado!"); };

  const numericStep = typeof step === "number" ? step : step === "generating" ? 11 : 12;

  return (
    <div className="noise-overlay relative min-h-screen bg-background flex">
      <div className="flex-1 min-w-0">
        <div className="misto-header">
          <button className="misto-back-btn" onClick={() => navigate("/dashboard")}>← Dashboard</button>
          <div className="misto-mode-badge" style={{ background: "hsl(var(--primary) / 0.1)", borderColor: "hsl(var(--primary) / 0.25)" }}>
            <span className="misto-badge-pulse" style={{ background: "hsl(var(--primary))", boxShadow: "0 0 8px hsl(var(--primary))" }} />
            <span style={{ color: "hsl(var(--primary))" }}>🚀 Modo BUILD</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="misto-theme-toggle" onClick={toggleTheme} aria-label="Alternar tema">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="misto-credits-pill"><strong>{creditBalance ?? "—"}</strong> cotas</div>
          </div>
        </div>

        {typeof step === "number" && <BuildStepper currentStep={step} />}

        <div className="misto-content">
          {step === 1 && <BuildStep1 answers={answers} onChange={updateAnswers} onNext={() => setStep(2)} canNext={canNext(1)} />}
          {step === 2 && <BuildStep2 answers={answers} onChange={updateAnswers} onNext={() => setStep(3)} onPrev={() => setStep(1)} canNext={canNext(2)} />}
          {step === 3 && <BuildStep3 answers={answers} onChange={updateAnswers} onNext={() => setStep(4)} onPrev={() => setStep(2)} canNext={canNext(3)} />}
          {step === 4 && <BuildStep4 answers={answers} onChange={updateAnswers} onNext={() => setStep(5)} onPrev={() => setStep(3)} canNext={canNext(4)} />}
          {step === 5 && <BuildStep5 answers={answers} onChange={updateAnswers} onNext={() => setStep(6)} onPrev={() => setStep(4)} canNext={canNext(5)} />}
          {step === 6 && <BuildStep6 answers={answers} onChange={updateAnswers} onNext={() => setStep(7)} onPrev={() => setStep(5)} canNext={canNext(6)} />}
          {step === 7 && <BuildStep7 answers={answers} onChange={updateAnswers} onNext={() => setStep(8)} onPrev={() => setStep(6)} canNext={canNext(7)} />}
          {step === 8 && <BuildStep8 answers={answers} onChange={updateAnswers} onNext={() => setStep(9)} onPrev={() => setStep(7)} canNext={canNext(8)} />}
          {step === 9 && <BuildStep9 answers={answers} onChange={updateAnswers} onNext={() => setStep(10)} onPrev={() => setStep(8)} canNext={canNext(9)} />}
          {step === 10 && <BuildStep10 answers={answers} onChange={updateAnswers} onGenerate={handleGenerate} onPrev={() => setStep(9)} canNext={canNext(10)} />}

          {step === "generating" && <MistoSpecLoading />}

          {step === "results" && (
            <div className="misto-step-enter">
              <div className="misto-result-header">
                <div>
                  <div className="misto-rh-title">Projeto BUILD Gerado 🚀</div>
                  <div className="misto-rh-badges">
                    <span className="misto-rb misto-rb-time">⏱ {timeElapsed.toFixed(1)}s</span>
                    <span className="misto-rb misto-rb-cota">5 cotas consumidas</span>
                    <span className="misto-rb" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                      {DOC_KEYS.filter(k => outputs[k]).length} documentos
                    </span>
                  </div>
                </div>
                <div className="misto-rh-actions">
                  <button className="misto-btn-sm" onClick={handleNewSession}>Novo Projeto</button>
                  <button className="misto-btn-sm" onClick={handleDownloadZip}>⬇ ZIP</button>
                  <span className="misto-btn-sm misto-btn-sm-g" style={{ opacity: 0.7, cursor: "default" }}>Salvo ✓</span>
                </div>
              </div>

              {/* Document tabs */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {DOC_KEYS.map((key) => (
                  <button key={key}
                    className={`misto-dp ${activeDoc === key ? "sel" : ""}`}
                    onClick={() => setActiveDoc(key)}
                    style={{ fontSize: 11, padding: "6px 12px" }}>
                    {DOC_LABELS[key]}
                  </button>
                ))}
              </div>

              {/* Active document */}
              <div className="misto-result-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span className="misto-pfb-label" style={{ color: "hsl(var(--primary))" }}>{DOC_LABELS[activeDoc]}</span>
                  <CopyButton text={outputs[activeDoc] || ""} className="misto-copy-btn misto-copy-btn-v" />
                </div>
                <pre style={{
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                  lineHeight: 1.7, color: "hsl(var(--foreground))",
                  maxHeight: 600, overflow: "auto",
                }}>
                  {outputs[activeDoc] || "Documento não gerado."}
                </pre>
              </div>
            </div>
          )}
        </div>

        {creditModal && <CreditModal type={creditModal} onClose={() => setCreditModal(null)} />}
      </div>

      <UnifiedMemorySidebar refreshKey={memoryRefreshKey} orgId={orgId} defaultMode="build" />
    </div>
  );
}
