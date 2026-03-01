import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";

import { SaasStepper } from "@/components/saas/SaasStepper";
import { SaasStep1 } from "@/components/saas/SaasStep1";
import { SaasStep2 } from "@/components/saas/SaasStep2";
import { SaasStep3 } from "@/components/saas/SaasStep3";
import { SaasStep4 } from "@/components/saas/SaasStep4";
import { SaasStep5 } from "@/components/saas/SaasStep5";
import { SaasStep6 } from "@/components/saas/SaasStep6";
import { SaasStep7 } from "@/components/saas/SaasStep7";
import { MistoSpecLoading } from "@/components/misto/MistoSpecLoading";
import { CreditModal } from "@/components/misto/CreditModal";
import { UnifiedMemorySidebar } from "@/components/UnifiedMemorySidebar";

import "../misto/misto.css";

export interface SaasAnswers {
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
  integracoes: string[];
  integracoesCustom: string;
  prazo: string;
  prioridades: string[];
}

const emptyAnswers: SaasAnswers = {
  problema: "", segmento: "", cargo: "", dor: "",
  features: [""], modelo: "", pricing: "",
  stackFrontend: "", stackBackend: "", stackDatabase: "",
  integracoes: [], integracoesCustom: "",
  prazo: "", prioridades: [],
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://pcaebfncvuvdguyjmyxm.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjYWViZm5jdnV2ZGd1eWpteXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTM5ODAsImV4cCI6MjA4NzY4OTk4MH0.7pDeOmLlWzPoVKJKIRepxGKtMAD0PPJiyXHG8AYhy34";

type SaasStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | "generating" | "results";

export default function SaasMode() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { theme, toggleTheme } = useTheme();
  const orgId = profile?.personal_org_id ?? undefined;

  const [step, setStep] = useState<SaasStep>(1);
  const [answers, setAnswers] = useState<SaasAnswers>(emptyAnswers);
  const [specMarkdown, setSpecMarkdown] = useState("");
  const [specRating, setSpecRating] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [creditModal, setCreditModal] = useState<"no_credits" | "trial_expired" | "suspended" | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const startTime = useRef(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [memoryRefreshKey, setMemoryRefreshKey] = useState(0);

  const fetchBalance = useCallback(async () => {
    if (!orgId) return null;
    const { data, error } = await supabase.rpc("get_credit_balance", { p_org_id: orgId });
    if (error || !data?.[0]) return null;
    const b = data[0] as { total_remaining: number; account_status: string };
    setCreditBalance(b.total_remaining);
    return b;
  }, [orgId]);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token ?? SUPABASE_ANON_KEY}`,
    };
  };

  const updateAnswers = (partial: Partial<SaasAnswers>) => setAnswers(prev => ({ ...prev, ...partial }));

  const canNext = (s: number): boolean => {
    switch (s) {
      case 1: return answers.problema.length >= 50;
      case 2: return answers.segmento.length >= 3 && answers.dor.length >= 3;
      case 3: return answers.features.filter(f => f.length >= 3).length >= 3;
      case 4: return answers.modelo.length > 0;
      case 5: return true; // stack is optional (AI decides)
      case 6: return true; // integrations optional
      case 7: return answers.prazo.length > 0;
      default: return false;
    }
  };

  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!orgId || !user) { toast.error("Usuário não autenticado"); return; }

    const balance = await fetchBalance();
    if (!balance) { toast.error("Erro ao verificar cotas"); return; }
    if (balance.account_status === "trial_expired") { setCreditModal("trial_expired"); return; }
    if (balance.account_status === "suspended") { setCreditModal("suspended"); return; }
    if (balance.total_remaining <= 0) { setCreditModal("no_credits"); return; }

    startTime.current = Date.now();
    const headers = await getAuthHeaders();

    try {
      setStep("generating");

      // Create session BEFORE calling edge function
      const { data: sessionRecord, error: sessErr } = await supabase
        .from("sessions").insert({ org_id: orgId, user_id: user.id, mode: "saas" as const, tokens_total: 0 })
        .select().single();
      if (sessErr) throw sessErr;
      const currentSessionId = sessionRecord.id;
      setSessionId(currentSessionId);

      // Build a structured prompt from answers
      const prompt = `
Problema: ${answers.problema}
Público: ${answers.segmento} / ${answers.cargo} — Dor: ${answers.dor}
Features: ${answers.features.filter(Boolean).join(", ")}
Modelo: ${answers.modelo} ${answers.pricing ? `(${answers.pricing})` : ""}
Stack: Frontend=${answers.stackFrontend || "IA decide"}, Backend=${answers.stackBackend || "IA decide"}, DB=${answers.stackDatabase || "IA decide"}
Integrações: ${[...answers.integracoes, answers.integracoesCustom].filter(Boolean).join(", ") || "Nenhuma especificada"}
Prazo: ${answers.prazo}
Prioridades: ${answers.prioridades.join(", ") || "Não definidas"}
      `.trim();

      const specRes = await fetch(`${SUPABASE_URL}/functions/v1/refine-prompt`, {
        method: "POST", headers,
        body: JSON.stringify({
          action: "saas-spec",
          promptFields: {
            especialidade: "Product Manager / Software Architect",
            persona: "Technical advisor",
            tarefa: "Generate a complete SaaS technical specification",
            objetivo: "Deliver a production-ready spec document",
            contexto: prompt,
            destino: "lovable",
          },
          originalInput: answers.problema,
          destino: "lovable",
          sessionId: currentSessionId,
        }),
      });

      if (!specRes.ok) throw new Error("Falha na geração da spec");
      const specData = await specRes.json();
      setSpecMarkdown(specData.spec_md || "");

      // Consume credit
      await supabase.rpc("consume_credit", { p_org_id: orgId, p_user_id: user.id, p_session_id: currentSessionId });

      setTimeElapsed((Date.now() - startTime.current) / 1000);
      setStep("results");
      fetchBalance();
      toast.success("💰 Spec gerada! Você economizou ~R$ 15,00 vs criar manualmente.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar spec.");
      setStep(7);
    }
  }, [orgId, user, answers, fetchBalance]);

  const handleSave = useCallback(async () => {
    if (!orgId || !user) return;
    try {
      const { error: specErr } = await supabase.from("saas_specs").insert({
        session_id: sessionId, org_id: orgId, user_id: user.id,
        spec_md: specMarkdown, rating: specRating || null,
        project_name: answers.problema.slice(0, 100),
        answers: answers as any,
      });
      if (specErr) throw specErr;

      setIsSaved(true);
      setMemoryRefreshKey(k => k + 1);
      toast.success("Spec salva com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || ""));
    }
  }, [orgId, user, specMarkdown, specRating, answers, sessionId]);

  const handleNewSession = () => {
    setStep(1); setAnswers(emptyAnswers);
    setSpecMarkdown(""); setSpecRating(0);
    setIsSaved(false); setTimeElapsed(0); setSessionId(null);
  };

  const numericStep = typeof step === "number" ? step : step === "generating" ? 8 : 9;

  const copyText = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copiado!"); };
  const downloadMd = () => {
    const blob = new Blob([specMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "saas-spec.md"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="noise-overlay relative min-h-screen bg-background flex">
      <div className="flex-1 min-w-0">
        <div className="misto-header">
          <button className="misto-back-btn" onClick={() => navigate("/dashboard")}>← Dashboard</button>
          <div className="misto-mode-badge" style={{ background: "hsl(var(--accent) / 0.1)", borderColor: "hsl(var(--accent) / 0.25)" }}>
            <span className="misto-badge-pulse" style={{ background: "hsl(var(--accent))", boxShadow: "0 0 8px hsl(var(--accent))" }} />
            <span style={{ color: "hsl(var(--accent))" }}>🏗️ SaaS Builder</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="misto-theme-toggle" onClick={toggleTheme} aria-label="Alternar tema">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="misto-credits-pill"><strong>{creditBalance ?? "—"}</strong> cotas</div>
          </div>
        </div>

        {typeof step === "number" && <SaasStepper currentStep={step} />}

        <div className="misto-content">
          {step === 1 && <SaasStep1 answers={answers} onChange={updateAnswers} onNext={() => setStep(2)} canNext={canNext(1)} />}
          {step === 2 && <SaasStep2 answers={answers} onChange={updateAnswers} onNext={() => setStep(3)} onPrev={() => setStep(1)} canNext={canNext(2)} />}
          {step === 3 && <SaasStep3 answers={answers} onChange={updateAnswers} onNext={() => setStep(4)} onPrev={() => setStep(2)} canNext={canNext(3)} />}
          {step === 4 && <SaasStep4 answers={answers} onChange={updateAnswers} onNext={() => setStep(5)} onPrev={() => setStep(3)} canNext={canNext(4)} />}
          {step === 5 && <SaasStep5 answers={answers} onChange={updateAnswers} onNext={() => setStep(6)} onPrev={() => setStep(4)} canNext={canNext(5)} />}
          {step === 6 && <SaasStep6 answers={answers} onChange={updateAnswers} onNext={() => setStep(7)} onPrev={() => setStep(5)} canNext={canNext(6)} />}
          {step === 7 && <SaasStep7 answers={answers} onChange={updateAnswers} onGenerate={handleGenerate} onPrev={() => setStep(6)} canNext={canNext(7)} />}

          {step === "generating" && <MistoSpecLoading />}

          {step === "results" && (
            <div className="misto-step-enter">
              <div className="misto-result-header">
                <div>
                  <div className="misto-rh-title">Spec Técnica Pronta 🏗️</div>
                  <div className="misto-rh-badges">
                    <span className="misto-rb misto-rb-time">⏱ {timeElapsed.toFixed(1)}s</span>
                    <span className="misto-rb misto-rb-cota">1 cota consumida</span>
                  </div>
                </div>
                <div className="misto-rh-actions">
                  <button className="misto-btn-sm" onClick={handleNewSession}>Nova Spec</button>
                  <button className="misto-btn-sm misto-btn-sm-g" onClick={handleSave} disabled={isSaved}>
                    {isSaved ? "Salva ✓" : "Salvar"}
                  </button>
                </div>
              </div>

              <div className="misto-result-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span className="misto-pfb-label" style={{ color: "hsl(var(--accent))" }}>Spec Técnica — Markdown</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="misto-copy-btn misto-copy-btn-v" onClick={() => copyText(specMarkdown)}>Copiar</button>
                    <button className="misto-copy-btn misto-copy-btn-v" onClick={downloadMd}>⬇ .md</button>
                  </div>
                </div>
                <div className="misto-spec-md" dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(specMarkdown) }} />
                <div className="misto-rating-row">
                  <span className="misto-rating-label">Avaliar spec:</span>
                  <div className="misto-stars">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} className={`misto-star ${n <= specRating ? "on" : ""}`} onClick={() => setSpecRating(n)}>★</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {creditModal && <CreditModal type={creditModal} onClose={() => setCreditModal(null)} />}
      </div>

      <UnifiedMemorySidebar
        refreshKey={memoryRefreshKey}
        orgId={orgId}
        defaultMode="saas"
      />
    </div>
  );
}

function renderSimpleMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h2>$1</h2>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");
}
