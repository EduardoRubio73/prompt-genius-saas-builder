import { useNavigate } from "react-router-dom";

interface CreditModalProps {
  type: "no_credits" | "trial_expired" | "suspended";
  onClose: () => void;
}

const config = {
  no_credits: {
    icon: "💳",
    title: "Sem cotas disponíveis",
    desc: "Você atingiu o limite de cotas do período. Compre um pacote avulso ou faça upgrade do seu plano para continuar.",
  },
  trial_expired: {
    icon: "⏰",
    title: "Trial expirado",
    desc: "Seu período de teste terminou. Faça upgrade para um plano pago para continuar usando o Prompt Genius.",
  },
  suspended: {
    icon: "🚫",
    title: "Conta suspensa",
    desc: "Sua conta está suspensa. Entre em contato com o suporte para mais informações.",
  },
};

export function CreditModal({ type, onClose }: CreditModalProps) {
  const navigate = useNavigate();
  const { icon, title, desc } = config[type];

  return (
    <div className="misto-modal-overlay" onClick={onClose}>
      <div className="misto-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="misto-modal-icon">{icon}</div>
        <div className="misto-modal-title">{title}</div>
        <div className="misto-modal-desc">{desc}</div>
        <div className="misto-modal-actions">
          <button className="misto-btn-sm" onClick={onClose}>
            Fechar
          </button>
          {type !== "suspended" && (
            <button
              className="misto-btn-sm misto-btn-sm-g"
              onClick={() => navigate("/dashboard")}
            >
              Ver planos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
