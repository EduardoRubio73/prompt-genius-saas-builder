import type { Enums } from "@/integrations/supabase/types";

const platforms: { label: string; value: Enums<"destination_platform"> }[] = [
  { label: "Lovable", value: "lovable" },
  { label: "ChatGPT", value: "chatgpt" },
  { label: "Claude", value: "claude" },
  { label: "Gemini", value: "gemini" },
  { label: "Cursor", value: "cursor" },
  { label: "v0.dev", value: "v0" },
];

interface MistoInputProps {
  userInput: string;
  onInputChange: (v: string) => void;
  destino: Enums<"destination_platform">;
  onDestinoChange: (v: Enums<"destination_platform">) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function MistoInput({
  userInput,
  onInputChange,
  destino,
  onDestinoChange,
  onGenerate,
  isGenerating,
}: MistoInputProps) {
  const len = userInput.length;
  const canGenerate = len >= 50 && len <= 800 && !isGenerating;

  return (
    <div className="misto-step-enter">
      <div className="misto-input-card">
        <div className="misto-input-label">💡 Descreva sua ideia ou projeto</div>
        <textarea
          className="misto-textarea"
          placeholder="Descreva seu projeto ou ideia... Ex: Quero criar um SaaS de gestão de contratos com IA para pequenas empresas, com assinatura digital, lembretes automáticos e dashboard de vencimentos."
          value={userInput}
          onChange={(e) => onInputChange(e.target.value.slice(0, 800))}
          disabled={isGenerating}
        />
        <div className={`misto-char-count ${len < 50 ? "warning" : ""}`}>
          {len} / 800 caracteres {len < 50 && `(mín. 50)`}
        </div>

        <div className="misto-destino-label">🚀 Plataforma de destino</div>
        <div className="misto-destino-pills">
          {platforms.map((p) => (
            <button
              key={p.value}
              className={`misto-dp ${destino === p.value ? "sel" : ""}`}
              onClick={() => onDestinoChange(p.value)}
              type="button"
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          className="misto-gen-btn"
          onClick={onGenerate}
          disabled={!canGenerate}
          type="button"
        >
          ⚡ Gerar com IA — 1 cota
        </button>
      </div>
    </div>
  );
}
