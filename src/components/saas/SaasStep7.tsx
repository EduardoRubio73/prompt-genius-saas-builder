import type { SaasAnswers } from "@/pages/saas/SaasMode";

interface Props {
  answers: SaasAnswers;
  onChange: (p: Partial<SaasAnswers>) => void;
  onGenerate: () => void;
  onPrev: () => void;
  canNext: boolean;
}

const prazos = [
  { value: "1_month", label: "1 mês", desc: "MVP rápido, essencial apenas" },
  { value: "3_months", label: "3 meses", desc: "MVP robusto com funcionalidades core" },
  { value: "6_months", label: "6 meses", desc: "Produto completo v1.0" },
  { value: "12_months", label: "12+ meses", desc: "Plataforma enterprise-grade" },
];

const prioridadeOpts = ["Performance", "Segurança", "UX/Design", "Escalabilidade", "Time-to-market", "Custo baixo"];

export function SaasStep7({ answers, onChange, onGenerate, onPrev, canNext }: Props) {
  const togglePrio = (p: string) => {
    const current = answers.prioridades;
    onChange({
      prioridades: current.includes(p)
        ? current.filter(i => i !== p)
        : [...current, p],
    });
  };

  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title">7. Prazo e Prioridades</div>
        <div className="saas-step-desc">Defina o timeline e o que é mais importante para o projeto.</div>

        <div className="prompt-field-label" style={{ marginBottom: 12 }}>⏰ Prazo estimado</div>
        {prazos.map(p => (
          <div key={p.value}
            className={`saas-radio-card ${answers.prazo === p.value ? "sel" : ""}`}
            onClick={() => onChange({ prazo: p.value })}>
            <div className="saas-radio-dot"><div className="saas-radio-dot-inner" /></div>
            <div>
              <div className="saas-radio-label">{p.label}</div>
              <div className="saas-radio-desc">{p.desc}</div>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 20 }}>
          <div className="prompt-field-label">🎯 Prioridades (selecione as mais importantes)</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {prioridadeOpts.map(p => (
              <button key={p} className={`saas-chip ${answers.prioridades.includes(p) ? "sel" : ""}`}
                onClick={() => togglePrio(p)}>
                {answers.prioridades.includes(p) ? "✓ " : ""}{p}
              </button>
            ))}
          </div>
        </div>

        <div className="saas-nav-row">
          <button className="saas-nav-btn" onClick={onPrev}>← Anterior</button>
          <button className="saas-nav-btn saas-nav-btn-primary" onClick={onGenerate} disabled={!canNext}>
            🏗️ Gerar Spec — 1 cota
          </button>
        </div>
      </div>
    </div>
  );
}
