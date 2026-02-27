import type { SaasAnswers } from "@/pages/saas/SaasMode";

interface Props {
  answers: SaasAnswers;
  onChange: (p: Partial<SaasAnswers>) => void;
  onNext: () => void;
  onPrev: () => void;
  canNext: boolean;
}

const integrationOptions = [
  "Autenticação (OAuth/SSO)", "Pagamentos (Stripe)", "Email (SendGrid/Resend)",
  "Storage (S3/Supabase)", "Analytics", "Webhooks", "Chat/Messaging",
  "CI/CD", "Monitoramento (Sentry)",
];

export function SaasStep6({ answers, onChange, onNext, onPrev }: Props) {
  const toggle = (item: string) => {
    const current = answers.integracoes;
    onChange({
      integracoes: current.includes(item)
        ? current.filter(i => i !== item)
        : [...current, item],
    });
  };

  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title">6. Integrações</div>
        <div className="saas-step-desc">Selecione as integrações que seu SaaS precisa. Você pode adicionar outras manualmente.</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {integrationOptions.map(opt => (
            <button key={opt} className={`saas-chip ${answers.integracoes.includes(opt) ? "sel" : ""}`}
              onClick={() => toggle(opt)}>
              {answers.integracoes.includes(opt) ? "✓ " : ""}{opt}
            </button>
          ))}
        </div>

        <div className="prompt-field-group">
          <div className="prompt-field-label">✏️ Outras integrações</div>
          <input className="prompt-field-input" placeholder="Ex: Slack, Zapier, WhatsApp API..."
            value={answers.integracoesCustom} onChange={(e) => onChange({ integracoesCustom: e.target.value })} />
        </div>

        <div className="saas-nav-row">
          <button className="saas-nav-btn" onClick={onPrev}>← Anterior</button>
          <button className="saas-nav-btn saas-nav-btn-primary" onClick={onNext}>Próximo →</button>
        </div>
      </div>
    </div>
  );
}
