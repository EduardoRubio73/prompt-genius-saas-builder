import type { SaasAnswers } from "@/pages/saas/SaasMode";

interface Props {
  answers: SaasAnswers;
  onChange: (p: Partial<SaasAnswers>) => void;
  onNext: () => void;
  onPrev: () => void;
  canNext: boolean;
}

const frontendOpts = ["React", "Next.js", "Vue", "Svelte", ""];
const backendOpts = ["Node.js", "Python", "Go", "Supabase Edge", ""];
const dbOpts = ["PostgreSQL", "MongoDB", "MySQL", "Supabase", ""];

function StackSelector({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="prompt-field-group">
      <div className="prompt-field-label">{label}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map(o => (
          <button key={o || "ai"} className={`saas-chip ${value === o ? "sel" : ""}`}
            onClick={() => onChange(o)}>
            {o || "🤖 IA decide"}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SaasStep5({ answers, onChange, onNext, onPrev, canNext }: Props) {
  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title">5. Stack Técnica</div>
        <div className="saas-step-desc">
          Escolha sua stack ou deixe a IA decidir. Não se preocupe, você pode mudar depois.
        </div>
        <div className="saas-tip">🤖 Selecione "IA decide" se não tem preferência — a spec recomendará a melhor opção.</div>

        <StackSelector label="⚛️ Frontend" options={frontendOpts}
          value={answers.stackFrontend} onChange={(v) => onChange({ stackFrontend: v })} />
        <StackSelector label="⚙️ Backend" options={backendOpts}
          value={answers.stackBackend} onChange={(v) => onChange({ stackBackend: v })} />
        <StackSelector label="🗄️ Database" options={dbOpts}
          value={answers.stackDatabase} onChange={(v) => onChange({ stackDatabase: v })} />

        <div className="saas-nav-row">
          <button className="saas-nav-btn" onClick={onPrev}>← Anterior</button>
          <button className="saas-nav-btn saas-nav-btn-primary" onClick={onNext} disabled={!canNext}>Próximo →</button>
        </div>
      </div>
    </div>
  );
}
