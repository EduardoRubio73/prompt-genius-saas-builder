import { useState, useEffect } from "react";
import { IoShareSocial } from "react-icons/io5"; // Ícone de 3 pontos (padrão Android/Web)
import { toast } from "sonner";
import "./landing.css";

/* ── Conteúdos Fixos ── */
const TERMS_CONTENT = (
  <>
    <h2>Termos de Uso — Prompt Genius SaaS Builder</h2>
    <p><strong>Última atualização:</strong> 26 de fevereiro de 2026</p>
    <h3>1. Aceitação dos Termos</h3>
    <p>Ao utilizar a plataforma, você concorda com os termos aqui descritos...</p>
    {/* ... restante do seu texto de termos ... */}
  </>
);

const PRIVACY_CONTENT = (
  <>
    <h2>Política de Privacidade</h2>
    <p>Seus dados são processados via Supabase e Stripe com total segurança...</p>
    {/* ... restante do seu texto de privacidade ... */}
  </>
);

/* ── Componente de Modal ── */
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="landing-modal-overlay" onClick={onClose}>
      <div className="landing-modal" onClick={(e) => e.stopPropagation()}>
        <button className="landing-modal-close" onClick={onClose}>✕</button>
        {children}
      </div>
    </div>
  );
}

/* ── Conteúdo do Modal de Contato ── */
const CONTACT_CATEGORIES = ["Dúvida", "Sugestão", "Elogios", "Críticas", "Dicas / Ideias"];

function ContactModalContent() {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("");

  const handleEmail = () => {
    if (!category) {
      toast.error("Por favor, selecione uma categoria.");
      return;
    }
    const subject = encodeURIComponent(`[${category}] Contato via Prompt Genius`);
    const body = encodeURIComponent(message || "Olá, gostaria de saber mais sobre a plataforma.");
    window.location.href = `mailto:zragencyia@://gmail.com{subject}&body=${body}`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Prompt Genius SaaS Builder',
          text: 'Confira esta plataforma incrível para criar SaaS com IA!',
          url: window.location.href,
        });
      } catch (err) {
        console.log("Erro ao compartilhar", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  return (
    <div className="contact-modal-container">
      <h2>Entre em Contato</h2>
      
      <div className="contact-form-group">
        <label>Categoria:</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Selecione uma opção</option>
          {CONTACT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div className="contact-form-group">
        <label>Sua Mensagem:</label>
        <textarea 
          placeholder="Como podemos ajudar?" 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <button className="btn-send-email" onClick={handleEmail}>
        Enviar E-mail
      </button>

      <hr className="modal-divider" />

      <div className="contact-share">
        <p>🚀 Gostou de nossa plataforma? Compartilhe!</p>
        <button className="contact-share-btn" onClick={handleShare}>
          <IoShareSocial size={18} /> Compartilhar
        </button>
      </div>
    </div>
  );
}

/* ── Componente Principal da Landing Page ── */
export default function LandingPage() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  return (
    <div className="landing-page">
      {/* Exemplo de header/botão para abrir os modais */}
      <header>
        <button onClick={() => setIsContactOpen(true)}>Contato / Compartilhar</button>
      </header>

      {/* Seção de conteúdo principal aqui... */}

      {/* Modais */}
      <Modal open={isContactOpen} onClose={() => setIsContactOpen(false)}>
        <ContactModalContent />
      </Modal>

      <Modal open={isTermsOpen} onClose={() => setIsTermsOpen(false)}>
        <div className="legal-content">
          {TERMS_CONTENT}
        </div>
      </Modal>

      <footer className="landing-footer">
        <p>© 2026 Prompt Genius SaaS Builder. Todos os direitos reservados.</p>
        <button onClick={() => setIsTermsOpen(true)} className="btn-link">Termos de Uso</button>
      </footer>
    </div>
  );
}
