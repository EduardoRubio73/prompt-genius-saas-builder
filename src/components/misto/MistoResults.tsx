import { useState } from "react";
import { RatingStars } from "./RatingStars";
import type { MistoFields } from "@/pages/misto/MistoMode";
import { toast } from "sonner";

const fieldDefs = [
  { key: "especialidade" as const, icon: "🎓", label: "Especialidade" },
  { key: "persona" as const, icon: "👤", label: "Persona" },
  { key: "tarefa" as const, icon: "✅", label: "Tarefa" },
  { key: "objetivo" as const, icon: "🎯", label: "Objetivo" },
  { key: "contexto" as const, icon: "🌐", label: "Contexto" },
  { key: "destino" as const, icon: "🚀", label: "Destino" },
];

type TabKey = "prompt" | "spec" | "compare";

interface MistoResultsProps {
  fields: MistoFields;
  promptGerado: string;
  specMarkdown: string;
  userInput: string;
  timeElapsed: number;
  promptRating: number;
  specRating: number;
  onPromptRating: (r: number) => void;
  onSpecRating: (r: number) => void;
  onNewSession: () => void;
  onSave: () => void;
  isSaved: boolean;
}

export function MistoResults({
  fields,
  promptGerado,
  specMarkdown,
  userInput,
  timeElapsed,
  promptRating,
  specRating,
  onPromptRating,
  onSpecRating,
  onNewSession,
  onSave,
  isSaved,
}: MistoResultsProps) {
  const [tab, setTab] = useState<TabKey>("prompt");

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const downloadMd = () => {
    const blob = new Blob([specMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spec-tecnica.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="misto-step-enter">
      {/* Header */}
      <div className="misto-result-header">
        <div>
          <div className="misto-rh-title">Sessão Mista Concluída ⚡</div>
          <div className="misto-rh-badges">
            <span className="misto-rb misto-rb-time">
              ⏱ Gerado em {timeElapsed.toFixed(1)}s
            </span>
            <span className="misto-rb misto-rb-cota">1 cota consumida</span>
          </div>
        </div>
        <div className="misto-rh-actions">
          <button className="misto-btn-sm" onClick={onNewSession}>
            Nova Sessão
          </button>
          <button
            className="misto-btn-sm misto-btn-sm-g"
            onClick={onSave}
            disabled={isSaved}
          >
            {isSaved ? "Salvo ✓" : "Salvar Tudo"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="misto-res-tabs">
        {([
          { key: "prompt" as TabKey, label: "✨ Prompt Otimizado" },
          { key: "spec" as TabKey, label: "🏗️ Spec Técnica" },
          { key: "compare" as TabKey, label: "⚖️ Comparação" },
        ]).map((t) => (
          <button
            key={t.key}
            className={`misto-rt ${tab === t.key ? "on" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "prompt" && (
        <div className="misto-result-panel">
          <div className="misto-fields-result">
            {fieldDefs.map((f) => (
              <div key={f.key} className="misto-field-result-card">
                <div className="misto-frc-label">
                  {f.icon} {f.label}
                </div>
                <div className={`misto-frc-val ${f.key === "destino" ? "!text-secondary" : ""}`}>
                  {fields[f.key]}
                </div>
              </div>
            ))}
          </div>

          <div className="misto-prompt-final-box">
            <div className="misto-pfb-header">
              <div className="misto-pfb-label">Prompt Final Gerado</div>
              <button
                className="misto-copy-btn"
                onClick={() => copyText(promptGerado, "Prompt")}
              >
                Copiar
              </button>
            </div>
            <div className="misto-prompt-text">{promptGerado}</div>
          </div>
          <RatingStars
            rating={promptRating}
            onChange={onPromptRating}
            label="Avaliar este prompt:"
          />
        </div>
      )}

      {tab === "spec" && (
        <div className="misto-result-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span className="misto-pfb-label" style={{ color: "hsl(var(--primary))" }}>
              Spec Técnica — Markdown
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="misto-copy-btn misto-copy-btn-v"
                onClick={() => copyText(specMarkdown, "Markdown")}
              >
                Copiar Markdown
              </button>
              <button className="misto-copy-btn misto-copy-btn-v" onClick={downloadMd}>
                ⬇ .md
              </button>
            </div>
          </div>
          <div
            className="misto-spec-md"
            dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(specMarkdown) }}
          />
          <RatingStars
            rating={specRating}
            onChange={onSpecRating}
            label="Avaliar esta spec:"
          />
        </div>
      )}

      {tab === "compare" && (
        <div className="misto-result-panel">
          <div className="misto-compare-grid">
            <div>
              <div className="misto-compare-label" style={{ color: "hsl(var(--mode-text-muted))" }}>
                Input Original
              </div>
              <div className="misto-compare-box">
                {userInput}
              </div>
            </div>
            <div>
              <div className="misto-compare-label" style={{ color: "hsl(195 100% 50%)" }}>
                ✨ Prompt Gerado
              </div>
              <div className="misto-compare-box" style={{ fontSize: 12 }}>
                {promptGerado ? promptGerado.slice(0, 300) + (promptGerado.length > 300 ? "..." : "") : "6 campos estruturados + instrução de destino otimizada."}
              </div>
            </div>
            <div>
              <div className="misto-compare-label" style={{ color: "hsl(var(--primary))" }}>
                🏗️ Spec Gerada
              </div>
              <div className="misto-compare-box" style={{ fontSize: 12 }}>
                {specMarkdown ? specMarkdown.slice(0, 300) + (specMarkdown.length > 300 ? "..." : "") : "Stack completa definida, funcionalidades core detalhadas."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Very simple markdown → HTML for spec rendering */
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
