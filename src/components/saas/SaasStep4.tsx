import type { SaasAnswers } from "@/pages/saas/SaasMode";

interface Props {
  answers: SaasAnswers;
  onChange: (p: Partial<SaasAnswers>) => void;
  onNext: () => void;
  onPrev: () => void;
  canNext: boolean;
}

const modelos = [
  { value: "saas_subscription", label: "SaaS Assinatura", desc: "Recorrência mensal/anual com planos" },
  { value: "freemium", label: "Freemium", desc: "Plano grátis com upgrade pago" },
  { value: "marketplace", label: "Marketplace", desc: "Comissão sobre transações" },
  { value: "pay_per_use", label: "Pay-per-use", desc: "Cobra por uso (API calls, créditos)" },
  { value: "license", label: "Licença", desc: "Pagamento único ou anual" },
];

export function SaasStep4({ answers, onChange, onNext, onPrev, canNext }: Props) {
  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title">4. Modelo de Negócio</div>
        <div className="saas-step-desc">Como seu SaaS vai monetizar? Selecione o modelo principal.</div>

        {modelos.map(m => (
          <div key={m.value}
            className={`saas-radio-card ${answers.modelo === m.value ? "sel" : ""}`}
            onClick={() => onChange({ modelo: m.value })}>
            <div className="saas-radio-dot"><div className="saas-radio-dot-inner" /></div>
            <div>
              <div className="saas-radio-label">{m.label}</div>
              <div className="saas-radio-desc">{m.desc}</div>
            </div>
          </div>
        ))}

        {answers.modelo && (
          <div className="prompt-field-group" style={{ marginTop: 16 }}>
            <div className="prompt-field-label">💰 Faixa de preço (opcional)</div>
            <input className="prompt-field-input" placeholder="Ex: R$ 49/mês, R$ 99/mês, R$ 199/mês"
              value={answers.pricing} onChange={(e) => onChange({ pricing: e.target.value })} />
          </div>
        )}

        <div className="saas-nav-row">
          <button className="saas-nav-btn" onClick={onPrev}>← Anterior</button>
          <button className="saas-nav-btn saas-nav-btn-primary" onClick={onNext} disabled={!canNext}>Próximo →</button>
        </div>
      </div>
    </div>
  );
}
