import type { SaasAnswers } from "@/pages/saas/SaasMode";

interface Props {
  answers: SaasAnswers;
  onChange: (p: Partial<SaasAnswers>) => void;
  onNext: () => void;
  canNext: boolean;
}

const example = "Uma plataforma para freelancers gerenciarem seus contratos, enviarem propostas e acompanharem pagamentos, com painel financeiro e lembretes automáticos.";

export function SaasStep1({ answers, onChange, onNext, canNext }: Props) {
  return (
    <div className="misto-step-enter">
      <div className="saas-wizard-card">
        <div className="saas-step-title">1. Qual problema seu SaaS resolve?</div>
        <div className="saas-step-desc">
          Descreva o problema ou a ideia central do seu produto. Quanto mais detalhes, melhor será a spec gerada.
        </div>
        <div className="saas-tip">
          💡 Dica: Inclua quem sofre o problema, como é resolvido hoje e por que sua solução seria melhor.
        </div>
        <textarea
          className="misto-textarea"
          placeholder="Descreva o problema que seu SaaS resolve..."
          value={answers.problema}
          onChange={(e) => onChange({ problema: e.target.value })}
          style={{ minHeight: 180 }}
        />
        <div className={`misto-char-count ${answers.problema.length < 50 ? "warning" : ""}`}>
          {answers.problema.length} caracteres {answers.problema.length < 50 && "(mín. 50)"}
        </div>

        {!answers.problema && (
          <button
            className="saas-chip"
            style={{ marginTop: 12 }}
            onClick={() => onChange({ problema: example })}
          >
            📋 Usar exemplo
          </button>
        )}

        <div className="saas-nav-row">
          <div />
          <button className="saas-nav-btn saas-nav-btn-primary" onClick={onNext} disabled={!canNext}>
            Próximo →
          </button>
        </div>
      </div>
    </div>
  );
}
