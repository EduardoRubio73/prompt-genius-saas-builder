import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";
import type { Enums } from "@/integrations/supabase/types";
import { callEdgeFunction } from "@/lib/edgeFunctions";

import { PromptInput } from "@/components/prompt/PromptInput";
import { MistoRefining } from "@/components/misto/MistoRefining";
import { MistoResults } from "@/components/misto/MistoResults";
import { CreditModal } from "@/components/misto/CreditModal";
import { UnifiedMemorySidebar } from "@/components/UnifiedMemorySidebar";
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
  const [inputMode, setInputMode] = useState<"free" | "manual">("free");
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
  const fetchBalance = useCallback(async () => {
    if (!orgId) return null;
    const { data, error } = await supabase.rpc("get_credit_balance", { p_org_id: orgId });
    if (error || !data?.[0]) return null;
    const b = data[0] as { total_remaining: number; account_status: string };
    setCreditBalance(b.total_remaining);
    return b;
  }, [orgId]);

  const [sessionId, setSessionId] = useState<string | null>(null);

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

      // Create session BEFORE calling edge function
      const { data: sessionRecord, error: sessErr } = await supabase
        .from("sessions").insert({ org_id: orgId, user_id: user.id, mode: "prompt" as const, tokens_total: 0 })
        .select().single();
      if (sessErr) throw sessErr;
      const currentSessionId = sessionRecord.id;
      setSessionId(currentSessionId);

      if (inputMode === "free") {
        // Distribute free text into fields
        setGenStatus("distributing");
        const d = await callEdgeFunction("refine-prompt", {
          action: "distribute", freeText, destino, sessionId: currentSessionId,
        });
        const extracted: MistoFields = {
          especialidade: d.especialidade || "", persona: d.persona || "",
          tarefa: d.tarefa || "", objetivo: d.objetivo || "",
          contexto: d.contexto || "", destino: d.destino || destino,
        };
        setFields(extracted);

        // Refine
        setGenStatus("refining");
        const r = await callEdgeFunction("refine-prompt", {
          action: "refine", fields: extracted, destino, sessionId: currentSessionId,
        });
        const refined: MistoFields = {
          especialidade: r.especialidade || extracted.especialidade,
          persona: r.persona || extracted.persona,
          tarefa: r.tarefa || extracted.tarefa,
          objetivo: r.objetivo || extracted.objetivo,
          contexto: r.contexto || extracted.contexto,
          destino: r.destino || extracted.destino,
        };
        setFields(refined);
        setPromptGerado(r.prompt_gerado || "");
      } else {
        // Manual fields → skip distribute, go straight to refine
        setGenStatus("refining");
        setFields(manualFields);
        const r = await callEdgeFunction("refine-prompt", {
          action: "refine", fields: manualFields, destino, sessionId: currentSessionId,
        });
        const refined: MistoFields = {
          especialidade: r.especialidade || manualFields.especialidade,
          persona: r.persona || manualFields.persona,
          tarefa: r.tarefa || manualFields.tarefa,
          objetivo: r.objetivo || manualFields.objetivo,
          contexto: r.contexto || manualFields.contexto,
          destino: r.destino || manualFields.destino,
        };
        setFields(refined);
        setPromptGerado(r.prompt_gerado || "");
      }

      // Consume credit
      await supabase.rpc("consume_credit", { p_org_id: orgId, p_user_id: user.id, p_session_id: currentSessionId });

      setTimeElapsed((Date.now() - startTime.current) / 1000);
      setStep("results");
      fetchBalance();
      toast.success("💰 Prompt gerado! Você economizou ~R$ 8,00 vs escrever manualmente.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar.");
      setStep("input");
    }
  }, [orgId, user, freeText, manualFields, inputMode, destino, fetchBalance]);

  const handleSave = useCallback(async () => {
    if (!orgId || !user || !fields) return;
    try {
      const { error: promptErr } = await supabase.from("prompt_memory").insert({
        session_id: sessionId, org_id: orgId, user_id: user.id,
        especialidade: fields.especialidade, persona: fields.persona,
        tarefa: fields.tarefa, objetivo: fields.objetivo, contexto: fields.contexto,
        destino, prompt_gerado: promptGerado, rating: promptRating || null, categoria: "prompt",
      });
      if (promptErr) throw promptErr;

      setIsSaved(true);
      setMemoryRefreshKey(k => k + 1);
      toast.success("Prompt salvo com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || ""));
    }
  }, [orgId, user, fields, promptGerado, promptRating, destino, sessionId]);

  const handleNewSession = () => {
    setStep("input"); setFreeText(""); setFields(null);
    setManualFields({ especialidade: "", persona: "", tarefa: "", objetivo: "", contexto: "", destino: "" });
    setPromptGerado(""); setPromptRating(0); setIsSaved(false); setTimeElapsed(0); setSessionId(null);
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
                  <button className="misto-btn-sm misto-btn-sm-g" onClick={handleSave} disabled={isSaved}>
                    {isSaved ? "Salvo ✓" : "Salvar"}
                  </button>
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
                    <button className="misto-copy-btn" onClick={() => { navigator.clipboard.writeText(promptGerado); toast.success("Copiado!"); }}>
                      Copiar
                    </button>
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
