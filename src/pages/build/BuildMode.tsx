import { useState, useCallback, useRef, useEffect } from "react";
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

function BuildStep1({ answers, onChange, onNext, canNext }: StepProps) {
  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title">1. Nome e Problema</div>
        <div className="prompt-field-group">
          <div className="prompt-field-label">📛 Nome do Produto</div>
          <input
            className="prompt-field-input"
            value={answers.productName}
            onChange={(e) => onChange({ productName: e.target.value })}
            placeholder="Ex: WhatsFlow"
          />
        </div>
        <div className="prompt-field-group">
          <div className="prompt-field-label">🎯 Problema</div>
          <textarea
            className="misto-textarea"
            style={{ minHeight: 160 }}
            value={answers.problema}
            onChange={(e) => onChange({ problema: e.target.value })}
            placeholder="Descreva o problema com detalhes..."
          />
        </div>
        <div className="saas-nav-row">
          <div />
          <button className="saas-nav-btn saas-nav-btn-primary" onClick={onNext} disabled={!canNext}>Próximo →</button>
        </div>
      </div>
    </div>
  );
}

function BuildStep2({ answers, onChange, onNext, onPrev, canNext }: StepProps) {
  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title">2. Público-Alvo</div>
        <div className="prompt-field-group">
          <div className="prompt-field-label">🏢 Segmento</div>
          <input className="prompt-field-input" value={answers.segmento} onChange={(e) => onChange({ segmento: e.target.value })} />
        </div>
        <div className="prompt-field-group">
          <div className="prompt-field-label">👤 Cargo</div>
          <input className="prompt-field-input" value={answers.cargo} onChange={(e) => onChange({ cargo: e.target.value })} />
        </div>
        <div className="prompt-field-group">
          <div className="prompt-field-label">😣 Principal Dor</div>
          <input className="prompt-field-input" value={answers.dor} onChange={(e) => onChange({ dor: e.target.value })} />
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
  const updateFeature = (idx: number, value: string) => {
    const next = [...answers.features];
    next[idx] = value;
    onChange({ features: next });
  };

  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title">3. Funcionalidades Core</div>
        <div className="saas-feature-list">
          {answers.features.map((feature, idx) => (
            <div key={idx} className="saas-feature-item">
              <span>{idx + 1}.</span>
              <input value={feature} onChange={(e) => updateFeature(idx, e.target.value)} placeholder={`Feature ${idx + 1}`} />
            </div>
          ))}
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
  const modelos = ["saas_subscription", "freemium", "marketplace", "pay_per_use", "license"];
  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title">4. Modelo de Negócio</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {modelos.map((m) => (
            <button key={m} className={`saas-chip ${answers.modelo === m ? "sel" : ""}`} onClick={() => onChange({ modelo: m })}>
              {m}
            </button>
          ))}
        </div>
        <div className="prompt-field-group" style={{ marginTop: 12 }}>
          <div className="prompt-field-label">💰 Pricing</div>
          <input className="prompt-field-input" value={answers.pricing} onChange={(e) => onChange({ pricing: e.target.value })} />
        </div>
        <div className="saas-nav-row">
          <button className="saas-nav-btn" onClick={() => onPrev?.()}>← Anterior</button>
          <button className="saas-nav-btn saas-nav-btn-primary" onClick={onNext} disabled={!canNext}>Próximo →</button>
        </div>
      </div>
    </div>
  );
}

function BuildStep5({ answers, onChange, onNext, onPrev, canNext }: StepProps) {
  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title">5. Stack Técnica</div>
        <div className="prompt-field-group"><div className="prompt-field-label">Frontend</div><input className="prompt-field-input" value={answers.stackFrontend} onChange={(e) => onChange({ stackFrontend: e.target.value })} /></div>
        <div className="prompt-field-group"><div className="prompt-field-label">Backend</div><input className="prompt-field-input" value={answers.stackBackend} onChange={(e) => onChange({ stackBackend: e.target.value })} /></div>
        <div className="prompt-field-group"><div className="prompt-field-label">Database</div><input className="prompt-field-input" value={answers.stackDatabase} onChange={(e) => onChange({ stackDatabase: e.target.value })} /></div>
        <div className="saas-nav-row"><button className="saas-nav-btn" onClick={() => onPrev?.()}>← Anterior</button><button className="saas-nav-btn saas-nav-btn-primary" onClick={onNext} disabled={!canNext}>Próximo →</button></div>
      </div>
    </div>
  );
}

function BuildStep6({ answers, onChange, onNext, onPrev, canNext }: StepProps) {
  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title">6. Infraestrutura</div>
        <div className="prompt-field-group"><div className="prompt-field-label">Hosting</div><input className="prompt-field-input" value={answers.hosting} onChange={(e) => onChange({ hosting: e.target.value })} /></div>
        <div className="prompt-field-group"><div className="prompt-field-label">CI/CD</div><input className="prompt-field-input" value={answers.cicd} onChange={(e) => onChange({ cicd: e.target.value })} /></div>
        <div className="prompt-field-group"><div className="prompt-field-label">Monitoring</div><input className="prompt-field-input" value={answers.monitoring} onChange={(e) => onChange({ monitoring: e.target.value })} /></div>
        <div className="saas-nav-row"><button className="saas-nav-btn" onClick={() => onPrev?.()}>← Anterior</button><button className="saas-nav-btn saas-nav-btn-primary" onClick={onNext} disabled={!canNext}>Próximo →</button></div>
      </div>
    </div>
  );
}

function BuildStep7({ answers, onChange, onNext, onPrev, canNext }: StepProps) {
  const authOpts = ["email_password", "magic_link", "oauth", "sso_saml"];
  const updateRole = (idx: number, value: string) => {
    const next = [...answers.roles];
    next[idx] = value;
    onChange({ roles: next });
  };

  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title">7. Auth & Roles</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {authOpts.map((opt) => (
            <button key={opt} className={`saas-chip ${answers.authMethod === opt ? "sel" : ""}`} onClick={() => onChange({ authMethod: opt })}>{opt}</button>
          ))}
        </div>
        <div className="prompt-field-group">
          <div className="prompt-field-label">Roles</div>
          {answers.roles.map((role, idx) => (
            <input key={idx} className="prompt-field-input" style={{ marginBottom: 8 }} value={role} onChange={(e) => updateRole(idx, e.target.value)} />
          ))}
        </div>
        <div className="saas-nav-row"><button className="saas-nav-btn" onClick={() => onPrev?.()}>← Anterior</button><button className="saas-nav-btn saas-nav-btn-primary" onClick={onNext} disabled={!canNext}>Próximo →</button></div>
      </div>
    </div>
  );
}

function BuildStep8({ answers, onChange, onNext, onPrev, canNext }: StepProps) {
  const opts = ["Users", "Billing", "Audit", "Feature Flags", "API Keys"];
  const toggle = (item: string) => onChange({
    adminFeatures: answers.adminFeatures.includes(item)
      ? answers.adminFeatures.filter((x) => x !== item)
      : [...answers.adminFeatures, item],
  });

  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title">8. Painel Admin</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{opts.map((o) => (<button key={o} className={`saas-chip ${answers.adminFeatures.includes(o) ? "sel" : ""}`} onClick={() => toggle(o)}>{o}</button>))}</div>
        <div className="saas-nav-row" style={{ marginTop: 16 }}><button className="saas-nav-btn" onClick={() => onPrev?.()}>← Anterior</button><button className="saas-nav-btn saas-nav-btn-primary" onClick={onNext} disabled={!canNext}>Próximo →</button></div>
      </div>
    </div>
  );
}

function BuildStep9({ answers, onChange, onNext, onPrev, canNext }: StepProps) {
  const opts = ["Stripe", "SendGrid", "S3", "Analytics", "Webhooks", "WhatsApp"];
  const toggle = (item: string) => onChange({
    integracoes: answers.integracoes.includes(item)
      ? answers.integracoes.filter((x) => x !== item)
      : [...answers.integracoes, item],
  });

  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title">9. Integrações</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{opts.map((o) => (<button key={o} className={`saas-chip ${answers.integracoes.includes(o) ? "sel" : ""}`} onClick={() => toggle(o)}>{o}</button>))}</div>
        <div className="prompt-field-group" style={{ marginTop: 12 }}>
          <div className="prompt-field-label">Outras integrações</div>
          <input className="prompt-field-input" value={answers.integracoesCustom} onChange={(e) => onChange({ integracoesCustom: e.target.value })} />
        </div>
        <div className="saas-nav-row"><button className="saas-nav-btn" onClick={() => onPrev?.()}>← Anterior</button><button className="saas-nav-btn saas-nav-btn-primary" onClick={onNext} disabled={!canNext}>Próximo →</button></div>
      </div>
    </div>
  );
}

function BuildStep10({ answers, onChange, onGenerate, onPrev, canNext }: FinalStepProps) {
  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title">10. Branding</div>
        <div className="prompt-field-group"><div className="prompt-field-label">App Name</div><input className="prompt-field-input" value={answers.appName} onChange={(e) => onChange({ appName: e.target.value })} /></div>
        <div className="prompt-field-group"><div className="prompt-field-label">Color Palette</div><input className="prompt-field-input" value={answers.colorPalette} onChange={(e) => onChange({ colorPalette: e.target.value })} /></div>
        <div className="prompt-field-group"><div className="prompt-field-label">Tone</div><input className="prompt-field-input" value={answers.tone} onChange={(e) => onChange({ tone: e.target.value })} /></div>
        <div className="saas-nav-row"><button className="saas-nav-btn" onClick={onPrev}>← Anterior</button><button className="saas-nav-btn saas-nav-btn-primary" onClick={onGenerate} disabled={!canNext}>🚀 Gerar Projeto BUILD — 5 cotas</button></div>
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

  const handleGenerate = useCallback(async () => {
    if (!orgId || !user) { toast.error("Usuário não autenticado"); return; }

    const balance = await fetchBalance();
    if (!balance) { toast.error("Erro ao verificar cotas"); return; }
    if (balance.account_status === "trial_expired") { setCreditModal("trial_expired"); return; }
    if (balance.account_status === "suspended") { setCreditModal("suspended"); return; }
    if (balance.total_remaining <= 0) { setCreditModal("no_credits"); return; }

    startTime.current = Date.now();

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

      await supabase.from("sessions").update({ completed: true, raw_input: answers.problema }).eq("id", currentSessionId);
      fetchBalance();
      toast.success("🚀 Projeto BUILD gerado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar projeto.");
      setStep(10);
    }
  }, [orgId, user, answers, fetchBalance]);

  const handleSave = useCallback(async () => {
    if (!orgId || !user) return;
    try {
      const { error } = await supabase.from("build_projects").insert({
        session_id: sessionId,
        org_id: orgId,
        user_id: user.id,
        project_name: answers.appName || answers.productName,
        answers: answers as any,
        outputs: outputs as any,
      });
      if (error) throw error;
      setIsSaved(true);
      setMemoryRefreshKey(k => k + 1);
      toast.success("Projeto salvo com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || ""));
    }
  }, [orgId, user, answers, outputs, sessionId]);

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
                  <button className="misto-btn-sm misto-btn-sm-g" onClick={handleSave} disabled={isSaved}>
                    {isSaved ? "Salvo ✓" : "Salvar"}
                  </button>
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
                  <button className="misto-copy-btn misto-copy-btn-v" onClick={() => copyText(outputs[activeDoc] || "")}>Copiar</button>
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
