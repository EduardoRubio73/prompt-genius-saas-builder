import { useEffect, useState } from "react";

const specSteps = [
  "Stack detectada",
  "Features mapeadas",
  "Segurança...",
  "Deploy...",
];

export function MistoSpecLoading() {
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    const timers = specSteps.map((_, i) =>
      setTimeout(() => setDoneCount(i + 1), 800 * (i + 1))
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="misto-step-enter">
      <div className="misto-spec-loading">
        <div className="misto-sl-icon">🏗️</div>
        <div className="misto-sl-title">Gerando Especificação Técnica...</div>
        <div className="misto-sl-sub">
          Usando o prompt gerado para criar sua spec completa
        </div>
        <div className="misto-prog-track">
          <div className="misto-prog-fill" />
        </div>
        <div style={{ fontSize: "12px", color: "hsl(var(--mode-text-muted))" }}>
          Analisando stack, arquitetura e requisitos...
        </div>
        <div className="misto-prog-steps">
          {specSteps.map((s, i) => (
            <div key={s} className={`misto-ps ${i < doneCount ? "ok" : ""}`}>
              <div className="misto-ps-dot" />
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
