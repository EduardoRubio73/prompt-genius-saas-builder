import { useState, useCallback, useRef, useEffect } from "react";
import { useLoading } from "@/contexts/LoadingContext";
import { useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";
import type { Enums } from "@/integrations/supabase/types";
import { callEdgeFunction } from "@/lib/edgeFunctions";
import { findSkillById } from "@/hooks/useSkills";

import { PromptInput } from "@/components/prompt/PromptInput";
import { MistoRefining } from "@/components/misto/MistoRefining";
import { MistoResults } from "@/components/misto/MistoResults";
import { CreditModal } from "@/components/misto/CreditModal";
import { UnifiedMemorySidebar } from "@/components/UnifiedMemorySidebar";
import { CopyButton } from "@/components/CopyButton";
import type { MistoFields } from "@/pages/misto/MistoMode";

import "../misto/misto.css";

type PromptStep = "input" | "generating" | "results";

const stepsDef = [
  { label: "Entrada" },
  { label: "Gerando" },
  { label: "Resultado" },
];

export default function PromptMode() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { theme, toggleTheme } = useTheme();
  const orgId = profile?.personal_org_id ?? undefined;

  const [step, setStep] = useState<PromptStep>("input");
  const [freeText, setFreeText] = useState("");
  const [manualFields, setManualFields] = useState<MistoFields>({
    especialidade: "", persona: "", tarefa: "", objetivo: "", contexto: "", destino: "",
  });
  const [inputMode, setInputMode] = useState<"free" | "manual" | "skills">("free");
  const [destino, setDestino] = useState<Enums<"destination_platform">>("lovable");
  const [fields, setFields] = useState<MistoFields | null>(null);
  const [promptGerado, setPromptGerado] = useState("");
  const [promptRating, setPromptRating] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [creditModal, setCreditModal] = useState<"no_credits" | "trial_expired" | "suspended" | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [genStatus, setGenStatus] = useState<"distributing" | "refining">("distributing");
  const startTime = useRef(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [memoryRefreshKey, setMemoryRefreshKey] = useState(0);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [skillComplement, setSkillComplement] = useState("");

  const fetchBalance = useCallback(async () => {
    if (!orgId) return null;
    try {
      const b = await callEdgeFunction("org-dashboard", { org_id: orgId });
      setCreditBalance(b.total_remaining);
      return b;
    } catch {
      return null;
    }
  }, [orgId]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  const [sessionId, setSessionId] = useState<string | null>(null);

  const { showLoading, hideLoading } = useLoading();

  const handleGenerate = useCallback(async () => {
    if (!orgId || !user) { toast.error("Usuário não autenticado"); return; }

    const balance = await fetchBalance();
    if (!balance) { toast.error("Erro ao verificar cotas"); return; }
    if (balance.account_status === "trial_expired") { setCreditModal("trial_expired"); return; }
    if (balance.account_status === "suspended") { setCreditModal("suspended"); return; }
    if (balance.total_remaining <= 0) { setCreditModal("no_credits"); return; }

    startTime.current = Date.now();
    showLoading("Gerando Prompt...");

    const skill = findSkillById(selectedSkill);
    const skillSystemPrompt = skill?.systemPrompt || undefined;

    try {
      setStep("generating");

      const { data: sessionRecord, error: sessErr } = await supabase
        .from("sessions").insert({ org_id: orgId, user_id: user.id, mode: "prompt" as const, tokens_total: 0 })
        .select().single();
      if (sessErr) throw sessErr;
      const currentSessionId = sessionRecord.id;
      setSessionId(currentSessionId);

      let localRefined: MistoFields;
      let localPrompt: string;

      if (inputMode === "skills") {
        // Skills mode: use refine directly with skill context
        setGenStatus("refining");
        const skillFields: MistoFields = {
          especialidade: skill?.label || "",
          persona: skill?.label || "",
          tarefa: skillComplement || "Executar conforme instruções do agente especializado",
          objetivo: "Resultado otimizado conforme especialidade do agente",
          contexto: skillComplement || "",
          destino: destino,
        };
        setFields(skillFields);

        const r = await callEdgeFunction("refine-prompt", {
          action: "refine", fields: skillFields, destino, sessionId: currentSessionId, skillSystemPrompt,
        });
        localRefined = {
          especialidade: r.especialidade || skillFields.especialidade,
          persona: r.persona || skillFields.persona,
          tarefa: r.tarefa || skillFields.tarefa,
          objetivo: r.objetivo || skillFields.objetivo,
          contexto: r.contexto || skillFields.contexto,
          destino: r.destino || skillFields.destino,
        };
        localPrompt = r.prompt_gerado || "";
        setFields(localRefined);
        setPromptGerado(localPrompt);
      } else if (inputMode === "free") {
        setGenStatus("distributing");
        const d = await callEdgeFunction("refine-prompt", {
          action: "distribute", freeText, destino, sessionId: currentSessionId, skillSystemPrompt,
        });
        const extracted: MistoFields = {
          especialidade: d.especialidade || "", persona: d.persona || "",
          tarefa: d.tarefa || "", objetivo: d.objetivo || "",
          contexto: d.contexto || "", destino: d.destino || destino,
        };
        setFields(extracted);

        setGenStatus("refining");
        const r = await callEdgeFunction("refine-prompt", {
          action: "refine", fields: extracted, destino, sessionId: currentSessionId, skillSystemPrompt,
        });
        localRefined = {
          especialidade: r.especialidade || extracted.especialidade,
          persona: r.persona || extracted.persona,
          tarefa: r.tarefa || extracted.tarefa,
          objetivo: r.objetivo || extracted.objetivo,
          contexto: r.contexto || extracted.contexto,
          destino: r.destino || extracted.destino,
        };
        localPrompt = r.prompt_gerado || "";
        setFields(localRefined);
        setPromptGerado(localPrompt);
      } else {
        setGenStatus("refining");
        setFields(manualFields);
        const r = await callEdgeFunction("refine-prompt", {
          action: "refine", fields: manualFields, destino, sessionId: currentSessionId, skillSystemPrompt,
        });
        localRefined = {
          especialidade: r.especialidade || manualFields.especialidade,
          persona: r.persona || manualFields.persona,
          tarefa: r.tarefa || manualFields.tarefa,
          objetivo: r.objetivo || manualFields.objetivo,
          contexto: r.contexto || manualFields.contexto,
          destino: r.destino || manualFields.destino,
        };
        localPrompt = r.prompt_gerado || "";
        setFields(localRefined);
        setPromptGerado(localPrompt);
      }

      setTimeElapsed((Date.now() - startTime.current) / 1000);
      setStep("results");
      hideLoading();
      fetchBalance();

      await supabase.from("sessions").update({ completed: true }).eq("id", currentSessionId);

      try {
        await supabase.from("prompt_memory").insert({
          session_id: currentSessionId, org_id: orgId, user_id: user.id,
          especialidade: localRefined.especialidade, persona: localRefined.persona,
          tarefa: localRefined.tarefa, objetivo: localRefined.objetivo,
          contexto: localRefined.contexto,
          destino, prompt_gerado: localPrompt, rating: null, categoria: "prompt",
        });
        setIsSaved(true);
        setMemoryRefreshKey(k => k + 1);
        toast.success("✅ Salvo automaticamente");
      } catch (e) {
        console.warn("Auto-save falhou:", e);
      }

      toast.success("💰 Prompt gerado! Você economizou ~R$ 8,00 vs escrever manualmente.");
    } catch (err: any) {
      hideLoading();
      toast.error(err.message || "Erro ao processar.");
      setStep("input");
    }
  }, [orgId, user, freeText, manualFields, inputMode, destino, selectedSkill, skillComplement, fetchBalance]);

  const handleNewSession = () => {
    setStep("input"); setFreeText(""); setFields(null);
    setManualFields({ especialidade: "", persona: "", tarefa: "", objetivo: "", contexto: "", destino: "" });
    setPromptGerado(""); setPromptRating(0); setIsSaved(false); setTimeElapsed(0); setSessionId(null);
    setSkillComplement("");
  };

  const isGenerating = step === "generating";
  const activeStepIdx = step === "input" ? 0 : step === "generating" ? 1 : 2;

  return (
    <div className="noise-overlay relative min-h-screen bg-background flex">
      <div className="flex-1 min-w-0">
        <div className="misto-header">
          <button className="misto-back-btn" onClick={() => navigate("/dashboard")}>← Dashboard</button>
          <div className="misto-mode-badge" style={{ background: "hsl(var(--primary) / 0.1)", borderColor: "hsl(var(--primary) / 0.25)" }}>
            <span className="misto-badge-pulse" style={{ background: "hsl(var(--primary))", boxShadow: "0 0 8px hsl(var(--primary))" }} />
            <span style={{ color: "hsl(var(--primary))" }}>✨ Modo Prompt</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="misto-theme-toggle" onClick={toggleTheme} aria-label="Alternar tema">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="misto-credits-pill"><strong>{creditBalance ?? "—"}</strong> cotas restantes</div>
          </div>
        </div>

        {/* Stepper */}
        <div className="misto-stepper">
          <div className="step-track">
            {stepsDef.map((s, i) => {
              const isDone = i < activeStepIdx;
              const isActive = i === activeStepIdx;
              return (
                <div key={i} className={`step-node ${isDone ? "done" : isActive ? "active" : "future"}`}>
                  <div className={`step-circle ${isDone ? "sc-done" : isActive ? "sc-active" : "sc-future"}`}>
                    {isDone ? "✓" : i + 1}
                  </div>
                  <div className={`step-label ${isDone ? "sl-done" : isActive ? "sl-active" : "sl-future"}`}>{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="misto-content">
          {step === "input" && (
            <PromptInput
              freeText={freeText} onFreeTextChange={setFreeText}
              manualFields={manualFields} onManualFieldsChange={setManualFields}
              inputMode={inputMode} onInputModeChange={setInputMode}
              destino={destino} onDestinoChange={setDestino}
              onGenerate={handleGenerate} isGenerating={isGenerating}
              selectedSkill={selectedSkill} onSelectedSkillChange={setSelectedSkill}
              skillComplement={skillComplement} onSkillComplementChange={setSkillComplement}
            />
          )}

          {step === "generating" && (
            <MistoRefining fields={fields} promptPreview={promptGerado} status={genStatus} />
          )}

          {step === "results" && fields && (
            <div className="misto-step-enter">
              <div className="misto-result-header">
                <div>
                  <div className="misto-rh-title">Prompt Gerado ✨</div>
                  <div className="misto-rh-badges">
                    <span className="misto-rb misto-rb-time">⏱ {timeElapsed.toFixed(1)}s</span>
                    <span className="misto-rb misto-rb-cota">1 cota consumida</span>
                  </div>
                </div>
                <div className="misto-rh-actions">
                  <button className="misto-btn-sm" onClick={handleNewSession}>Nova Sessão</button>
                  <span className="misto-btn-sm misto-btn-sm-g" style={{ opacity: 0.7, cursor: "default" }}>Salvo ✓</span>
                </div>
              </div>

              <div className="misto-result-panel">
                <div className="misto-fields-result">
                  {(["especialidade","persona","tarefa","objetivo","contexto","destino"] as const).map((key) => (
                    <div key={key} className="misto-field-result-card">
                      <div className="misto-frc-label">{key}</div>
                      <div className="misto-frc-val">{fields[key]}</div>
                    </div>
                  ))}
                </div>
                <div className="misto-prompt-final-box">
                  <div className="misto-pfb-header">
                    <div className="misto-pfb-label">Prompt Final</div>
                    <CopyButton text={promptGerado} />
                  </div>
                  <div className="misto-prompt-text">{promptGerado}</div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <div className="misto-rating-row">
                    <span className="misto-rating-label">Avaliar:</span>
                    <div className="misto-stars">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} className={`misto-star ${n <= promptRating ? "on" : ""}`} onClick={() => setPromptRating(n)}>★</button>
                      ))}
                    </div>
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
        defaultMode="prompt"
      />
    </div>
  );
}
