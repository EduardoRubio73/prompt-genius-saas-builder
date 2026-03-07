import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";
import { callEdgeFunction } from "@/lib/edgeFunctions";
import JSZip from "jszip";

import { BuildStepper } from "../../components/build/BuildStepper";
import { BuildStep1 } from "../../components/build/BuildStep1";
import { BuildStep2 } from "../../components/build/BuildStep2";
import { BuildStep3 } from "../../components/build/BuildStep3";
import { BuildStep4 } from "../../components/build/BuildStep4";
import { BuildStep5 } from "../../components/build/BuildStep5";
import { BuildStep6 } from "../../components/build/BuildStep6";
import { BuildStep7 } from "../../components/build/BuildStep7";
import { BuildStep8 } from "../../components/build/BuildStep8";
import { BuildStep9 } from "../../components/build/BuildStep9";
import { BuildStep10 } from "../../components/build/BuildStep10";
import { MistoSpecLoading } from "@/components/misto/MistoSpecLoading";
import { CreditModal } from "@/components/misto/CreditModal";
import { UnifiedMemorySidebar } from "@/components/UnifiedMemorySidebar";

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
