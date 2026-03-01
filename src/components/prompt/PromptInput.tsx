import type { Enums } from "@/integrations/supabase/types";
import type { MistoFields } from "@/pages/misto/MistoMode";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const platforms: { label: string; value: Enums<"destination_platform"> }[] = [
  { label: "Lovable", value: "lovable" },
  { label: "ChatGPT", value: "chatgpt" },
  { label: "Claude", value: "claude" },
  { label: "Gemini", value: "gemini" },
  { label: "Cursor", value: "cursor" },
  { label: "v0.dev", value: "v0" },
];

const fieldDefs = [
  { key: "especialidade" as const, icon: "🎓", label: "Especialidade", placeholder: "Ex: Engenheiro de Software Sênior", tip: "Qual o perfil técnico da IA? Ex: Dev Backend, Designer UX, PM" },
  { key: "persona" as const, icon: "👤", label: "Persona", placeholder: "Ex: Técnico e direto ao ponto", tip: "Tom e estilo da resposta. Ex: Didático, Conciso, Criativo" },
  { key: "tarefa" as const, icon: "✅", label: "Tarefa", placeholder: "Ex: Criar arquitetura de microserviços", tip: "O que a IA deve fazer? Seja específico na ação desejada" },
  { key: "objetivo" as const, icon: "🎯", label: "Objetivo", placeholder: "Ex: Sistema escalável e performante", tip: "Resultado esperado. Ex: Código limpo, Documentação completa" },
  { key: "contexto" as const, icon: "🌐", label: "Contexto", placeholder: "Ex: Startup com 10 devs, stack Node.js", tip: "Informações de fundo: stack, equipe, restrições, domínio" },
  { key: "destino" as const, icon: "🚀", label: "Destino (override)", placeholder: "Deixe vazio para usar a seleção abaixo", tip: "Sobrescreve a plataforma selecionada abaixo, se preenchido" },
];

interface PromptInputProps {
  freeText: string;
  onFreeTextChange: (v: string) => void;
  manualFields: MistoFields;
  onManualFieldsChange: (f: MistoFields) => void;
  inputMode: "free" | "manual";
  onInputModeChange: (m: "free" | "manual") => void;
  destino: Enums<"destination_platform">;
  onDestinoChange: (v: Enums<"destination_platform">) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function PromptInput({
  freeText, onFreeTextChange,
  manualFields, onManualFieldsChange,
  inputMode, onInputModeChange,
  destino, onDestinoChange,
  onGenerate, isGenerating,
}: PromptInputProps) {
  const freeLen = freeText.length;
  const manualFilled = Object.values(manualFields).filter(v => v.length > 2).length;
  const canGenerate = inputMode === "free"
    ? freeLen >= 30 && freeLen <= 600 && !isGenerating
    : manualFilled >= 3 && !isGenerating;

  return (
    <div className="misto-step-enter">
      {/* Mode toggle */}
      <div className="misto-res-tabs" style={{ marginBottom: 20 }}>
        <button className={`misto-rt ${inputMode === "free" ? "on" : ""}`} onClick={() => onInputModeChange("free")}>
          💡 Texto Livre
        </button>
        <button className={`misto-rt ${inputMode === "manual" ? "on" : ""}`} onClick={() => onInputModeChange("manual")}>
          📝 Campos Manuais
        </button>
      </div>

      <div className="prompt-two-panel" style={inputMode === "manual" ? { gridTemplateColumns: "1fr" } : undefined}>
        {/* Left panel: free text */}
        {inputMode === "free" && (
          <div className="prompt-panel">
            <div className="misto-input-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              💡 Descreva o que precisa
              <InfoTooltip content="Descreva em linguagem natural. A IA extrai automaticamente especialidade, persona, tarefa e outros campos. Mínimo 30 caracteres." />
            </div>
            <textarea
              className="misto-textarea"
              placeholder="Descreva o que você precisa em texto livre. A IA vai extrair os campos automaticamente e gerar o prompt otimizado..."
              value={freeText}
              onChange={(e) => onFreeTextChange(e.target.value.slice(0, 600))}
              disabled={isGenerating}
              style={{ minHeight: 220 }}
            />
            <div className={`misto-char-count ${freeLen < 30 ? "warning" : ""}`}>
              {freeLen} / 600 {freeLen < 30 && "(mín. 30)"}
            </div>
          </div>
        )}

        {/* Manual fields */}
        {inputMode === "manual" && (
          <div className="prompt-panel">
            <div className="misto-input-label">📝 Preencha os campos diretamente</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {fieldDefs.map((f) => (
                <div key={f.key} className="prompt-field-group">
                  <div className="prompt-field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {f.icon} {f.label}
                    <InfoTooltip content={f.tip} />
                  </div>
                  <input
                    className="prompt-field-input"
                    placeholder={f.placeholder}
                    value={manualFields[f.key]}
                    onChange={(e) => onManualFieldsChange({ ...manualFields, [f.key]: e.target.value })}
                    disabled={isGenerating}
                  />
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "hsl(var(--mode-text-muted))", marginTop: 8 }}>
              Preencha pelo menos 3 campos para gerar ({manualFilled}/6 preenchidos)
            </div>
          </div>
        )}
      </div>

      {/* Platform selector */}
      <div style={{ marginTop: 20 }}>
        <div className="misto-destino-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          🚀 Plataforma de destino
          <InfoTooltip content="Escolha onde o prompt será usado. Cada plataforma tem otimizações específicas de formato e linguagem." />
        </div>
        <div className="misto-destino-pills">
          {platforms.map((p) => (
            <button key={p.value} className={`misto-dp ${destino === p.value ? "sel" : ""}`}
              onClick={() => onDestinoChange(p.value)} type="button">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <button className="misto-gen-btn" onClick={onGenerate} disabled={!canGenerate} type="button">
        ✨ Gerar Prompt — 1 cota
      </button>
    </div>
  );
}
