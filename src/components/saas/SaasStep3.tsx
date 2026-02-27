import type { SaasAnswers } from "@/pages/saas/SaasMode";

interface Props {
  answers: SaasAnswers;
  onChange: (p: Partial<SaasAnswers>) => void;
  onNext: () => void;
  onPrev: () => void;
  canNext: boolean;
}

const suggestions = ["Dashboard analítico", "Gestão de usuários", "Notificações", "Relatórios PDF", "Chat interno", "Integração com API"];

export function SaasStep3({ answers, onChange, onNext, onPrev, canNext }: Props) {
  const features = answers.features;

  const updateFeature = (i: number, val: string) => {
    const next = [...features];
    next[i] = val;
    onChange({ features: next });
  };

  const addFeature = () => {
    if (features.length < 8) onChange({ features: [...features, ""] });
  };

  const removeFeature = (i: number) => {
    if (features.length > 1) onChange({ features: features.filter((_, idx) => idx !== i) });
  };

  const addSuggestion = (s: string) => {
    if (!features.includes(s)) {
      const emptyIdx = features.findIndex(f => !f);
      if (emptyIdx >= 0) {
        const next = [...features]; next[emptyIdx] = s; onChange({ features: next });
      } else if (features.length < 8) {
        onChange({ features: [...features, s] });
      }
    }
  };

  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title">3. Funcionalidades Core</div>
        <div className="saas-step-desc">Liste as funcionalidades essenciais do seu SaaS (mínimo 3, máximo 8).</div>

        <div className="saas-feature-list">
          {features.map((f, i) => (
            <div key={i} className="saas-feature-item">
              <span style={{ color: "hsl(var(--primary))", fontWeight: 700, fontSize: 13 }}>{i + 1}.</span>
              <input placeholder={`Feature ${i + 1}`} value={f}
                onChange={(e) => updateFeature(i, e.target.value)} />
              {features.length > 1 && (
                <button className="saas-feature-remove" onClick={() => removeFeature(i)}>×</button>
              )}
            </div>
          ))}
        </div>

        {features.length < 8 && (
          <button className="saas-add-btn" onClick={addFeature}>+ Adicionar feature</button>
        )}

        <div style={{ marginTop: 16 }}>
          <div className="prompt-field-label">💡 Sugestões</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {suggestions.map(s => (
              <button key={s} className={`saas-chip ${features.includes(s) ? "sel" : ""}`}
                onClick={() => addSuggestion(s)}>{s}</button>
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
