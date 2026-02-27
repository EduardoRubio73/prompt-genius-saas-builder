import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import type { MistoFields } from "@/pages/misto/MistoMode";

const fieldDefs = [
  { key: "especialidade" as const, icon: "🎓", label: "Especialidade", tooltip: "Qual é a área de expertise que o prompt deve simular? Ex: Engenheiro de Software Sênior, Designer UX" },
  { key: "persona" as const, icon: "👤", label: "Persona", tooltip: "Como a IA deve se comportar? Tom, estilo de resposta, personalidade" },
  { key: "tarefa" as const, icon: "✅", label: "Tarefa", tooltip: "O que exatamente deve ser feito? A ação central do prompt" },
  { key: "objetivo" as const, icon: "🎯", label: "Objetivo", tooltip: "Qual o resultado esperado? O que o usuário quer alcançar" },
  { key: "contexto" as const, icon: "🌐", label: "Contexto", tooltip: "Informações adicionais que a IA precisa saber para responder bem" },
  { key: "destino" as const, icon: "🚀", label: "Destino", tooltip: "Para qual plataforma este prompt será usado? Cada uma tem particularidades" },
];

interface MistoRefiningProps {
  fields: MistoFields | null;
  promptPreview: string;
  status: "distributing" | "refining";
}

export function MistoRefining({ fields, promptPreview, status }: MistoRefiningProps) {
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    if (!promptPreview) return;
    if (visibleChars >= promptPreview.length) return;
    const t = setTimeout(() => setVisibleChars((c) => Math.min(c + 3, promptPreview.length)), 30);
    return () => clearTimeout(t);
  }, [visibleChars, promptPreview]);

  useEffect(() => {
    setVisibleChars(0);
  }, [promptPreview]);

  const statusLabel =
    status === "distributing" ? "⟳ distribuindo..." : "⟳ refinando campos...";

  return (
    <div className="misto-step-enter">
      <div className="s2-grid">
        {/* Fields Panel */}
        <div className="misto-panel">
          <div className="misto-panel-title">
            <span className="misto-pt-dot" />
            Campos Extraídos
          </div>
          {fieldDefs.map((f, i) => {
            const value = fields?.[f.key];
            return (
              <div
                key={f.key}
                className="misto-field-row"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="misto-fr-icon">{f.icon}</div>
                <div className="misto-fr-body">
                  <div className="misto-fr-label">
                    {f.label}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="misto-fr-tooltip">
                          <HelpCircle className="h-2.5 w-2.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        {f.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {value ? (
                    <div className={`misto-fr-val ${f.key === "destino" ? "!text-secondary" : ""}`}>
                      {value}
                    </div>
                  ) : (
                    <div className="misto-fr-skeleton" style={{ width: `${60 + i * 5}%` }} />
                  )}
                </div>
              </div>
            );
          })}
          <div className={`misto-status-badge ${fields ? "sb-done" : "sb-loading"}`}>
            {fields ? "✓ Campos prontos" : statusLabel}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="misto-panel">
          <div className="misto-panel-title">
            <span className="misto-pt-dot" />
            Preview do Prompt
          </div>
          <div className="misto-preview-text">
            {promptPreview.slice(0, visibleChars)}
            {visibleChars < promptPreview.length && <span className="misto-cursor" />}
          </div>
          <div className={`misto-status-badge ${visibleChars >= promptPreview.length && promptPreview ? "sb-done" : "sb-loading"}`}>
            {visibleChars >= promptPreview.length && promptPreview
              ? "✓ Prompt pronto"
              : statusLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
