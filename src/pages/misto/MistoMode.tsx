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

import { MistoStepper } from "@/components/misto/MistoStepper";
import { MistoInput } from "@/components/misto/MistoInput";
import { MistoRefining } from "@/components/misto/MistoRefining";
import { MistoSpecLoading } from "@/components/misto/MistoSpecLoading";
import { MistoResults } from "@/components/misto/MistoResults";
import { CreditModal } from "@/components/misto/CreditModal";
import { UnifiedMemorySidebar } from "@/components/UnifiedMemorySidebar";

import "./misto.css";

export type MistoStep = "input" | "distributing" | "refining" | "generating-spec" | "results";

export interface MistoFields {
  especialidade: string;
  persona: string;
  tarefa: string;
  objetivo: string;
  contexto: string;
  destino: string;
}

export default function MistoMode() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { theme, toggleTheme } = useTheme();
  const orgId = profile?.personal_org_id ?? undefined;

  // State
  const [step, setStep] = useState<MistoStep>("input");
  const [userInput, setUserInput] = useState("");
  const [destino, setDestino] = useState<Enums<"destination_platform">>("lovable");
  const [fields, setFields] = useState<MistoFields | null>(null);
  const [promptGerado, setPromptGerado] = useState("");
  const [specMarkdown, setSpecMarkdown] = useState("");
  const [promptRating, setPromptRating] = useState(0);
  const [specRating, setSpecRating] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [creditModal, setCreditModal] = useState<"no_credits" | "trial_expired" | "suspended" | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const startTime = useRef(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [memoryRefreshKey, setMemoryRefreshKey] = useState(0);

  // Fetch credit balance
  const fetchBalance = useCallback(async () => {
    if (!orgId) return null;
    const { data, error } = await supabase.rpc("get_credit_balance", { p_org_id: orgId });
    if (error || !data?.[0]) return null;
    const b = data[0] as { total_remaining: number; account_status: string };
    setCreditBalance(b.total_remaining);
    return b;
  }, [orgId]);

  const [sessionId, setSessionId] = useState<string | null>(null);

  // Main generate flow
  const handleGenerate = useCallback(async () => {
    if (!orgId || !user) {
      toast.error("Usuário não autenticado");
      return;
    }

    const balance = await fetchBalance();
    if (!balance) { toast.error("Erro ao verificar cotas"); return; }
    if (balance.account_status === "trial_expired") { setCreditModal("trial_expired"); return; }
    if (balance.account_status === "suspended") { setCreditModal("suspended"); return; }
    if (balance.total_remaining <= 0) { setCreditModal("no_credits"); return; }

    startTime.current = Date.now();

    try {
      setStep("distributing");

      // Create session BEFORE calling edge function
      const { data: sessionRecord, error: sessErr } = await supabase
        .from("sessions").insert({ org_id: orgId, user_id: user.id, mode: "misto" as const, tokens_total: 0 })
        .select().single();
      if (sessErr) throw sessErr;
      const currentSessionId = sessionRecord.id;
      setSessionId(currentSessionId);

      const distributeData = await callEdgeFunction("refine-prompt", {
        action: "distribute", freeText: userInput, destino, sessionId: currentSessionId,
      });
      const extractedFields: MistoFields = {
        especialidade: distributeData.especialidade || "",
        persona: distributeData.persona || "",
        tarefa: distributeData.tarefa || "",
        objetivo: distributeData.objetivo || "",
        contexto: distributeData.contexto || "",
        destino: distributeData.destino || destino,
      };
      setFields(extractedFields);

      setStep("refining");
      const refineData = await callEdgeFunction("refine-prompt", {
        action: "refine", fields: extractedFields, destino, sessionId: currentSessionId,
      });
      const refinedFields: MistoFields = {
        especialidade: refineData.especialidade || extractedFields.especialidade,
        persona: refineData.persona || extractedFields.persona,
        tarefa: refineData.tarefa || extractedFields.tarefa,
        objetivo: refineData.objetivo || extractedFields.objetivo,
        contexto: refineData.contexto || extractedFields.contexto,
        destino: refineData.destino || extractedFields.destino,
      };
      setFields(refinedFields);
      setPromptGerado(refineData.prompt_gerado || "");

      await supabase.rpc("consume_credit", { p_org_id: orgId, p_user_id: user.id, p_session_id: currentSessionId });

      setStep("generating-spec");
      const specData = await callEdgeFunction("refine-prompt", {
        action: "saas-spec", promptFields: refinedFields, originalInput: userInput, destino, sessionId: currentSessionId,
      });
      setSpecMarkdown(specData.spec_md || "");

      setTimeElapsed((Date.now() - startTime.current) / 1000);
      setStep("results");
      fetchBalance();
      toast.success("💰 Modo Misto concluído! Você economizou ~R$ 25,00 vs fazer manualmente.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar. Tente novamente.");
      setStep("input");
    }
  }, [orgId, user, userInput, destino, fetchBalance]);

  const handleSave = useCallback(async () => {
    if (!orgId || !user || !fields) return;
    try {
      const { data: promptRecord, error: promptErr } = await supabase
        .from("prompt_memory").insert({
          session_id: sessionId, org_id: orgId, user_id: user.id,
          especialidade: fields.especialidade, persona: fields.persona,
          tarefa: fields.tarefa, objetivo: fields.objetivo, contexto: fields.contexto,
          destino, prompt_gerado: promptGerado, rating: promptRating || null, categoria: "misto",
        }).select().single();
      if (promptErr) throw promptErr;

      const { error: specErr } = await supabase.from("saas_specs").insert({
        session_id: sessionId, org_id: orgId, user_id: user.id,
        prompt_memory_id: promptRecord.id, spec_md: specMarkdown,
        rating: specRating || null, answers: { original_input: userInput, destino },
      });
      if (specErr) throw specErr;

      setIsSaved(true);
      setMemoryRefreshKey(k => k + 1);
      toast.success("Sessão salva com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || ""));
    }
  }, [orgId, user, fields, promptGerado, specMarkdown, promptRating, specRating, userInput, destino, sessionId]);

  const handleNewSession = () => {
    setStep("input"); setUserInput(""); setFields(null);
    setPromptGerado(""); setSpecMarkdown("");
    setPromptRating(0); setSpecRating(0);
    setIsSaved(false); setTimeElapsed(0); setSessionId(null);
  };

  const isGenerating = step !== "input" && step !== "results";

  return (
    <div className="noise-overlay relative min-h-screen bg-background flex">
      <div className="flex-1 min-w-0">
        <div className="misto-header">
          <button className="misto-back-btn" onClick={() => navigate("/dashboard")}>← Dashboard</button>
          <div className="misto-mode-badge"><span className="misto-badge-pulse" /> ⚡ Modo Misto</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="misto-theme-toggle" onClick={toggleTheme} aria-label="Alternar tema">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="misto-credits-pill"><strong>{creditBalance ?? "—"}</strong> cotas restantes</div>
          </div>
        </div>

        <MistoStepper currentStep={step} />

        <div className="misto-content">
          {step === "input" && (
            <MistoInput userInput={userInput} onInputChange={setUserInput} destino={destino}
              onDestinoChange={setDestino} onGenerate={handleGenerate} isGenerating={isGenerating} />
          )}
          {(step === "distributing" || step === "refining") && (
            <MistoRefining fields={fields} promptPreview={promptGerado} status={step} />
          )}
          {step === "generating-spec" && <MistoSpecLoading />}
          {step === "results" && fields && (
            <MistoResults fields={fields} promptGerado={promptGerado} specMarkdown={specMarkdown}
              userInput={userInput} timeElapsed={timeElapsed} promptRating={promptRating}
              specRating={specRating} onPromptRating={setPromptRating} onSpecRating={setSpecRating}
              onNewSession={handleNewSession} onSave={handleSave} isSaved={isSaved} />
          )}
        </div>

        {creditModal && <CreditModal type={creditModal} onClose={() => setCreditModal(null)} />}
      </div>

      <UnifiedMemorySidebar
        refreshKey={memoryRefreshKey}
        orgId={orgId}
        defaultMode="mixed"
      />
    </div>
  );
}
