import type { SaasAnswers } from "@/pages/saas/SaasMode";

interface Props {
  answers: SaasAnswers;
  onChange: (p: Partial<SaasAnswers>) => void;
  onNext: () => void;
  onPrev: () => void;
  canNext: boolean;
}

const segmentoSuggestions = ["PMEs", "Startups", "Enterprise", "Freelancers", "E-commerce", "Saúde"];
const dorSuggestions = ["Processos manuais", "Falta de visibilidade", "Custo alto", "Perda de tempo", "Dados descentralizados"];

export function SaasStep2({ answers, onChange, onNext, onPrev, canNext }: Props) {
  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title">2. Público-Alvo</div>
        <div className="saas-step-desc">Quem vai usar seu SaaS? Entender o público ajuda a definir a experiência certa.</div>

        <div className="prompt-field-group">
          <div className="prompt-field-label">🏢 Segmento</div>
          <input className="prompt-field-input" placeholder="Ex: Pequenas empresas de consultoria"
            value={answers.segmento} onChange={(e) => onChange({ segmento: e.target.value })} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {segmentoSuggestions.map(s => (
              <button key={s} className={`saas-chip ${answers.segmento === s ? "sel" : ""}`}
                onClick={() => onChange({ segmento: s })}>{s}</button>
            ))}
          </div>
        </div>

        <div className="prompt-field-group">
          <div className="prompt-field-label">👤 Cargo / Perfil</div>
          <input className="prompt-field-input" placeholder="Ex: CEO, Gerente de Projetos"
            value={answers.cargo} onChange={(e) => onChange({ cargo: e.target.value })} />
        </div>

        <div className="prompt-field-group">
          <div className="prompt-field-label">😣 Principal Dor</div>
          <input className="prompt-field-input" placeholder="Ex: Perdem horas com planilhas manuais"
            value={answers.dor} onChange={(e) => onChange({ dor: e.target.value })} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {dorSuggestions.map(s => (
              <button key={s} className={`saas-chip ${answers.dor === s ? "sel" : ""}`}
                onClick={() => onChange({ dor: s })}>{s}</button>
            ))}
          </div>
        </div>

        <div className="saas-nav-row">
          <button className="saas-nav-btn" onClick={onPrev}>← Anterior</button>
          <button className="saas-nav-btn saas-nav-btn-primary" onClick={onNext} disabled={!canNext}>Próximo →</button>
        </div>
      </div>
    </div>
  );
}
