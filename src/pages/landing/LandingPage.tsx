import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction } from "@/lib/edgeFunctions";
import logo from "@/assets/logo-landing.png";
import "./landing.css";

interface PricingProduct {
  id: string;
  display_name: string | null;
  is_featured: boolean;
  credits_limit: number;
  prompts_limit: number;
  saas_specs_limit: number;
  modo_misto_limit: number;
  build_engine_limit: number;
  members_label: string | null;
  plan_tier: string;
  recurring_interval: string | null;
  features: { text: string; included: boolean }[];
  trial_period_days: number | null;
  cta_label: string | null;
  sort_order: number;
  price_brl: number;
  stripe_price_id: string | null;
  credit_unit_cost: number;
}

/* ── Terms & Privacy Content ── */
const TERMS_CONTENT =
<>
    <h2>Termos de Uso — Prompt Genius SaaS Builder</h2>
    <p><strong>Última atualização:</strong> 26 de fevereiro de 2026</p>

    <h3>1. Aceitação dos Termos</h3>
    <p>Ao criar uma conta ou utilizar qualquer funcionalidade da plataforma Prompt Genius SaaS Builder ("Plataforma"), você ("Usuário") declara que leu, compreendeu e concorda com os presentes Termos de Uso ("Termos"). Caso não concorde com qualquer disposição, não utilize a Plataforma.</p>

    <h3>2. Descrição do Serviço</h3>
    <p>O Prompt Genius SaaS Builder é uma plataforma de geração de prompts e especificações técnicas assistida por Inteligência Artificial. A Plataforma oferece quatro modos principais: Gerador de Prompt, SaaS Builder Wizard, Modo Misto e BUILD Engine.</p>

    <h3>3. Cadastro e Conta</h3>
    <p>3.1. Para acessar os recursos da Plataforma, é necessário criar uma conta com e-mail válido e senha.</p>
    <p>3.2. O Usuário é responsável pela confidencialidade de suas credenciais e por todas as ações realizadas em sua conta.</p>
    <p>3.3. Dados fornecidos no cadastro devem ser verídicos, completos e atualizados.</p>
    <p>3.4. É proibido criar contas automatizadas, em massa ou com finalidade de abuso do sistema de cotas ou indicações.</p>

    <h3>4. Planos, Cotas e Pagamentos</h3>
    <p>4.1. <strong>Plano Free:</strong> Oferece acesso gratuito com limite mensal de cotas. Inclui trial de 7 dias com recursos do plano Basic.</p>
    <p>4.2. <strong>Planos Pagos (Basic, Pro, Enterprise):</strong> Cobrados mensalmente via cartão de crédito.</p>
    <p>4.3. <strong>Cotas Mensais:</strong> Renovadas no início de cada ciclo de faturamento e não são cumulativas.</p>
    <p>4.4. <strong>Cotas Adicionais (Pacotes Avulsos):</strong> Permanentes, não expiram e se acumulam indefinidamente.</p>
    <p>4.5. <strong>Cotas de Indicação:</strong> Permanentes e não expiram.</p>

    <h3>5. Trial Gratuito</h3>
    <p>5.1. O período de trial tem duração de 7 dias a partir da criação da conta.</p>
    <p>5.2. No 6º dia, o Usuário receberá notificação sobre a proximidade do encerramento do trial.</p>
    <p>5.3. Após o encerramento do trial, a conta será bloqueada até que o Usuário contrate um plano pago ou adquira cotas adicionais.</p>

    <h3>6. Programa de Indicação</h3>
    <p>6.1. O programa de indicação é exclusivo para assinantes ativos de planos pagos (exceto contas em trial).</p>
    <p>6.2. Cada assinante pode indicar 1 (um) amigo por mês calendário.</p>
    <p>6.3. Ao indicar, ambos (referrer e indicado) recebem 5 cotas extras permanentes.</p>

    <h3>7. Propriedade Intelectual</h3>
    <p>7.1. O conteúdo gerado pela IA (prompts e especificações) pertence integralmente ao Usuário que o criou.</p>
    <p>7.2. A Plataforma, sua marca, código-fonte, design e funcionalidades são propriedade exclusiva da empresa operadora.</p>

    <h3>8. Uso Aceitável</h3>
    <p>É proibido: gerar conteúdo ilegal, ofensivo ou que viole direitos de terceiros; realizar engenharia reversa; automatizar acessos sem autorização; compartilhar contas.</p>

    <h3>9. Limitação de Responsabilidade</h3>
    <p>A Plataforma não garante que o conteúdo gerado pela IA esteja livre de erros. O Usuário é responsável por revisar e validar todo conteúdo gerado antes de aplicá-lo.</p>

    <h3>10. Cancelamento e Reembolso</h3>
    <p>10.1. O Usuário pode cancelar a assinatura a qualquer momento pelo painel.</p>
    <p>10.2. O acesso permanece ativo até o fim do período pago.</p>
    <p>10.3. Cotas adicionais e de indicação permanecem na conta após o cancelamento.</p>
  </>;


const PRIVACY_CONTENT =
<>
    <h2>Política de Privacidade — Prompt Genius SaaS Builder</h2>
    <p><strong>Última atualização:</strong> 26 de fevereiro de 2026</p>

    <h3>1. Dados Coletados</h3>
    <p><strong>Dados de Cadastro:</strong> Nome completo, endereço de e-mail, senha (armazenada com hash criptográfico via Supabase Auth).</p>
    <p><strong>Dados de Uso:</strong> Prompts gerados, especificações, sessões, ratings, favoritos, timestamps de atividade.</p>
    <p><strong>Dados de Pagamento:</strong> Processados diretamente pelo Stripe. Não armazenamos dados de cartão de crédito.</p>
    <p><strong>Dados Técnicos:</strong> Endereço IP, user agent do navegador, registrados em logs de auditoria.</p>

    <h3>2. Finalidade do Tratamento</h3>
    <ul>
      <li>Fornecer, manter e melhorar os serviços da Plataforma</li>
      <li>Autenticar o Usuário e proteger a conta</li>
      <li>Processar pagamentos e gerenciar assinaturas</li>
      <li>Gerar análises internas e métricas de uso</li>
      <li>Cumprir obrigações legais e regulatórias</li>
    </ul>

    <h3>3. Compartilhamento de Dados</h3>
    <p>Compartilhamos dados apenas com: Supabase (infraestrutura e autenticação), Stripe (processamento de pagamentos), Google AI / Gemini (processamento de IA). Não vendemos dados a terceiros.</p>

    <h3>4. Armazenamento e Segurança</h3>
    <p>Os dados são armazenados em infraestrutura Supabase com criptografia em trânsito (TLS) e em repouso. Implementamos Row Level Security (RLS) para garantir que cada Usuário acesse apenas seus próprios dados.</p>

    <h3>5. Retenção de Dados</h3>
    <p>Dados de conta: mantidos enquanto a conta estiver ativa. Dados de uso (prompts, specs): mantidos por até 2 anos após a desativação da conta. Logs de auditoria: mantidos por até 1 ano.</p>

    <h3>6. Direitos do Titular (LGPD)</h3>
    <p>Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), o Usuário pode solicitar: acesso, correção, exclusão, portabilidade e revogação de consentimento dos seus dados pessoais.</p>

    <h3>7. Cookies e Rastreamento</h3>
    <p>Utilizamos cookies estritamente necessários para autenticação e sessão do Usuário. Não utilizamos cookies de marketing ou rastreamento de terceiros.</p>

    <h3>8. Contato</h3>
    <p>Para dúvidas ou solicitações relacionadas à privacidade, entre em contato: <strong>zragencyia@gmail.com</strong></p>
  </>;


/* ── Modal Component ── */
function Modal({ open, onClose, children }: {open: boolean;onClose: () => void;children: React.ReactNode;}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";else
    document.body.style.overflow = "";
    return () => {document.body.style.overflow = "";};
  }, [open]);

  if (!open) return null;
  return (
    <div className="landing-modal-overlay" onClick={onClose}>
      <div className="landing-modal" onClick={(e) => e.stopPropagation()}>
        <button className="landing-modal-close" onClick={onClose}>✕</button>
        {children}
      </div>
    </div>);

}

/* ── Contact Modal Content ── */
function ContactModalContent() {
  const [message, setMessage] = useState("");
  const baseBody = "Venho através da página Prompt Genius SaaS Builder e gostaria de informações: ";

  const handleEmail = () => {
    const body = baseBody + (message || "digite aqui sua dúvida");
    const mailto = `mailto:zragencyia@gmail.com?subject=${encodeURIComponent("Contato com a equipe zragency")}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_blank");
  };

  const handleWhatsApp = () => {
    const body = baseBody + (message || "digite aqui sua dúvida");
    const url = `https://api.whatsapp.com/send?phone=5515998034648&text=${encodeURIComponent(body)}`;
    window.open(url, "_blank");
  };

  return (
    <>
      <h2>📬 Contato com a equipe zragency</h2>
      <p style={{ color: "var(--mu)", fontSize: "14px", marginBottom: "8px" }}>
        Escolha o canal e nos envie sua dúvida. Responderemos o mais breve possível.
      </p>
      <textarea
        className="contact-textarea"
        placeholder="Digite aqui sua dúvida..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={1000} />

      <div className="contact-actions">
        <button className="contact-btn contact-btn-email" onClick={handleEmail}>
          ✉️ Enviar por E-mail
        </button>
        <button className="contact-btn contact-btn-whatsapp" onClick={handleWhatsApp}>
          💬 Enviar por WhatsApp
        </button>
      </div>
    </>);

}

/* ── Typewriter Hook ── */
function useTypewriter(words: string[], speed = 75, delSpeed = 38, pause = 1900) {
  const [text, setText] = useState("");
  const ref = useRef({ wi: 0, ci: 0, del: false });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function tick() {
      const { wi, ci, del } = ref.current;
      const word = words[wi];
      if (!del) {
        setText(word.slice(0, ci + 1));
        ref.current.ci++;
        if (ci + 1 === word.length) {
          ref.current.del = true;
          timer = setTimeout(tick, pause);
        } else {
          timer = setTimeout(tick, speed);
        }
      } else {
        setText(word.slice(0, ci - 1));
        ref.current.ci--;
        if (ci - 1 === 0) {
          ref.current.del = false;
          ref.current.wi = (wi + 1) % words.length;
          timer = setTimeout(tick, 320);
        } else {
          timer = setTimeout(tick, delSpeed);
        }
      }
    }
    timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, [words, speed, delSpeed, pause]);

  return text;
}

function TypeWriter({ words, className }: {words: string[];className?: string;}) {
  const text = useTypewriter(words);
  return <span className={className}>{text}<span style={{ display: "inline-block", width: 2, height: "1em", background: "var(--v)", marginLeft: 2, verticalAlign: "middle", animation: "blink .7s step-end infinite" }} /></span>;
}

/* ── FAQ Item ── */
function FaqItem({ q, a }: {q: string;a: string;}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`fi ${open ? "open" : ""}`} onClick={() => setOpen(!open)}>
      <div className="fiq">{q}<span className="fii">+</span></div>
      <div className="fia" dangerouslySetInnerHTML={{ __html: a }} />
    </div>);

}

/* ── Main Landing Page ── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [modal, setModal] = useState<"terms" | "privacy" | "contact" | null>(null);
  const [pricingProducts, setPricingProducts] = useState<PricingProduct[]>([]);

const handleSubscribe = async (priceId: string | null) => {

  if (!priceId) {
    navigate("/login");
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    navigate("/login");
    return;
  }

  try {

    const { data: org } = await supabase
      .from("tenant_users")
      .select("tenant_id")
      .eq("user_id", session.user.id)
      .single();

    if (!org?.tenant_id) {
      console.error("Tenant não encontrado");
      return;
    }

    const data = await callEdgeFunction(
      "create-checkout-session",
      {
        price_id: priceId,
        org_id: org.tenant_id
      }
    );

    if (!data?.url) {
      console.error("Checkout URL não retornada");
      return;
    }

    window.location.href = data.url;

  } catch (err) {
    console.error("Erro ao iniciar checkout:", err);
  }

};

  useEffect(() => {
    async function fetchPricing() {
      const { data } = await supabase
        .from("v_active_stripe_plans")
        .select("*")
        .order("sort_order");
      if (data) {
        const parsedFeatures = (raw: any) => {
          if (!raw) return [];
          if (Array.isArray(raw)) return raw;
          try { return JSON.parse(raw); } catch { return []; }
        };
        setPricingProducts(data.filter((p: any) => !p.name?.startsWith("Topup")).map((p: any) => ({
          id: p.product_id,
          display_name: p.display_name || p.name,
          is_featured: p.is_featured ?? false,
          credits_limit: p.credits_limit ?? 0,
          prompts_limit: p.prompts_limit ?? 0,
          saas_specs_limit: p.saas_specs_limit ?? 0,
          modo_misto_limit: p.modo_misto_limit ?? 0,
          build_engine_limit: p.build_engine_limit ?? 0,
          members_label: p.members_label ?? null,
          plan_tier: p.plan_tier ?? "free",
          recurring_interval: p.recurring_interval ?? null,
          features: parsedFeatures(p.features),
          trial_period_days: p.trial_period_days ?? null,
          cta_label: p.cta_label ?? "Assinar",
          sort_order: p.sort_order || 0,
          price_brl: Number(p.price_brl ?? 0),
          stripe_price_id: p.stripe_price_id ?? null,
          credit_unit_cost: p.credit_unit_cost ?? 0.87,
        })));
      }
    }
    fetchPricing();
  }, []);

  // Intersection Observer for reveal animations
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {if (e.isIntersecting) e.target.classList.add("vis");}),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".landing-page .rv").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="landing-page">
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
      <div className="orb o1" /><div className="orb o2" />
      <div className="orb o3" /><div className="orb o4" />

      {/* NAV */}
      <nav>
        <a className="nav-logo" href="#">
          <img alt="Prompt Genius SaaS Builder" src="/lovable-uploads/a06a4c23-de16-4d60-a563-0ed4f968f538.png" />
          <span className="nav-name">Prompt Genius SaaS Builder Engineer </span>
        </a>
        <div className="nav-r">
          <a href="#features" className="nav-link">Funcionalidades</a>
          <a href="#indicacao" className="nav-link">Indicação</a>
          <a href="#cotas" className="nav-link">Cotas Extra</a>
          <a href="#precos" className="nav-link">Preços</a>
          <button className="nav-btn" onClick={() => navigate("/login")}>Começar Grátis</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-logo-wrap">
          <img alt="Prompt Genius SaaS Builder" className="hero-logo object-fill" src="/lovable-uploads/688355bf-1ebd-477f-a16a-4f11633d41d7.png" />
        </div>
        <div className="tag"><span className="tag-dot" />IA + SaaS Builder + Programa de Indicação</div>
        <h1>
          Crie prompts e SaaS<br />
          <span className="tw-line"><span className="grad"><TypeWriter words={["com IA — ganhe cotas", "1 cota ≈ R$0,87", "em segundos, com IA", "BUILD ≈ R$4,35", "e indique amigos"]} /></span></span>
          <br />indicando amigos
        </h1>
        <p className="hero-sub">Quatro modos de IA para gerar prompts perfeitos e especificações técnicas completas. Indique um amigo e ambos ganham 5 cotas extras gratuitamente.</p>
        <div className="hero-acts">
          <button className="btn-p" onClick={() => navigate("/login")}>Começar Grátis — 7 dias →</button>
          <a href="#indicacao" className="btn-o">Ver programa de indicação</a>
        </div>
        <div className="hero-badge-row">
          <div className="hb"><span className="hb-dot" />Sem cartão no trial</div>
          <div className="hb"><span className="hb-dot" />5 cotas grátis no cadastro</div>
          <div className="hb"><span className="hb-dot" />Cotas extras nunca expiram</div>
        </div>

        {/* MOCKUP */}
        <div className="hero-mock">
          <div className="mock-shell">
            <div className="mock-bar">
              <div className="dot dr" /><div className="dot dy" /><div className="dot dg" />
              <span className="mock-label">prompt-genius — modo misto ⚡ — 3 cotas restantes</span>
            </div>
            <div className="mock-body">
              <div className="mp"><div className="mp-i">✨</div><div className="mp-n">Gerador Prompt</div><div className="mp-d">Texto → Estruturado</div></div>
              <div className="mp hi"><div className="mp-i">⚡</div><div className="mp-n">Modo Misto</div><div className="mp-d">Prompt + SaaS juntos</div></div>
              <div className="mp"><div className="mp-i">🏗️</div><div className="mp-n">SaaS Builder</div><div className="mp-d">7 perguntas → Spec</div></div>
              <div className="mock-sep"><div className="sep-l" /><span>gerado em ~3s · 1 cota consumida</span><div className="sep-l" /></div>
              <div className="mock-out"><span>// Prompt gerado:</span> Atue como especialista em SaaS B2B. Persona: consultor direto. <span>TAREFA:</span> Criar sistema de CRM com IA... <span>// + Spec Next.js 15 + Supabase + Stripe pronta para Lovable ✓</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-bar rv">
        <div className="stats-inner">
          <div className="st"><div className="st-v">3</div><div className="st-l">Modos de IA</div></div>
          <div className="st"><div className="st-v">&lt;3s</div><div className="st-l">Tempo de geração</div></div>
          <div className="st"><div className="st-v">7</div><div className="st-l">Plataformas</div></div>
          <div className="st"><div className="st-v">+5</div><div className="st-l">Cotas por indicação</div></div>
          <div className="st"><div className="st-v">∞</div><div className="st-l">Cotas extras não expiram</div></div>
        </div>
      </div>

      {/* FEATURES */}
      <section className="features rv" id="features">
        <div className="wrap">
          <div className="tag">Funcionalidades</div>
          <h2 className="sh">Tudo que você precisa para <TypeWriter words={["construir mais rápido", "lançar com IA", "escalar do zero"]} /></h2>
          <div className="feat-grid feat-grid-4">
            <div className="fc"><div className="fc-i iv">✨</div><div className="fc-t">Gerador de Prompt</div><div className="fc-d">Texto livre → campos estruturados: especialidade, persona, tarefa, objetivo e contexto. Prompt pronto em segundos.</div></div>
            <div className="fc"><div className="fc-i ib">🏗️</div><div className="fc-t">SaaS Builder Wizard</div><div className="fc-d">7 perguntas geram spec técnica completa: stack, banco, arquitetura, segurança e plano de implementação.</div></div>
            <div className="fc"><div className="fc-i ic">⚡</div><div className="fc-t">Modo Misto — 2 outputs</div><div className="fc-d">Um input gera simultaneamente prompt otimizado E spec técnica, retroalimentados automaticamente.</div></div>
            <div className="fc"><div className="fc-i ip">⚙️</div><div className="fc-t">BUILD Engine</div><div className="fc-d">Transforme uma ideia em pacote deploy-ready: PRD, SQL, prompts e documentação completa. Economia de até R$50 por projeto.</div></div>
          </div>
          <div className="feat-grid feat-grid-3">
            <div className="fc"><div className="fc-i ig">🎁</div><div className="fc-t">Programa de Indicação</div><div className="fc-d">Compartilhe seu código. Cada amigo que se cadastrar ganha 5 cotas — e você também. Sem limite de indicações.</div></div>
            <div className="fc"><div className="fc-i iv">🎯</div><div className="fc-t">Few-Shot Learning</div><div className="fc-d">O sistema aprende com seus melhores prompts (rating ≥ 4★) e os usa como exemplos nas próximas gerações.</div></div>
            <div className="fc"><div className="fc-i ic">🔌</div><div className="fc-t">7 Plataformas de Destino</div><div className="fc-d">Lovable, ChatGPT, Claude, Gemini, Cursor, v0 e mais. Cada destino com instruções e formato específicos.</div></div>
          </div>
        </div>
      </section>

      {/* MODES */}
      <section className="modes rv">
        <div className="wrap">
          <div className="tag">Como funciona</div>
          <h2 className="sh">Quatro modos, <TypeWriter words={["uma plataforma", "resultados reais", "zero retrabalho"]} /></h2>
          <div className="modes-grid">
            <div className="mc mc-p"><div className="mc-badge mb-pop">Mais usado</div><div className="mc-icon">✨</div><div className="mc-title">Gerador de Prompt</div><div className="mc-desc">Escreva sua ideia. A IA distribui em especialidade, persona, tarefa, objetivo e contexto. Copie o prompt pronto.</div><div className="mc-pill"><strong>1 cota</strong> por geração</div><div className="mc-n">01</div></div>
            <div className="mc mc-s"><div className="mc-icon">🏗️</div><div className="mc-title">SaaS Builder</div><div className="mc-desc">7 perguntas objetivas geram especificação técnica Markdown completa pronta para o Lovable.</div><div className="mc-pill"><strong>2 cotas</strong> por geração</div><div className="mc-n">02</div></div>
            <div className="mc mc-m"><div className="mc-badge mb-new">Novo ⚡</div><div className="mc-icon">⚡</div><div className="mc-title">Modo Misto</div><div className="mc-desc">Um input único gera prompt otimizado + spec técnica completa. O mais poderoso dos quatro modos.</div><div className="mc-pill"><strong>3 cotas</strong> por sessão</div><div className="mc-n">03</div></div>
            <div className="mc mc-m"><div className="mc-badge mb-new">PRO 🚀</div><div className="mc-icon">⚙️</div><div className="mc-title">BUILD Engine</div><div className="mc-desc">Transforme uma ideia em pacote deploy-ready: PRD, SQL, prompts e documentação completa. Economia de até R$50 por projeto.</div><div className="mc-pill"><strong>5 cotas</strong> por projeto</div><div className="mc-n">04</div></div>
          </div>
        </div>
      </section>

      {/* REFERRAL */}
      <section className="referral-sec rv" id="indicacao">
        <div className="wrap">
          <div className="ref-inner">
            <div>
              <div className="tag">Programa de Indicação</div>
              <h2 className="sh">Indique e ganhe<br /><TypeWriter words={["cotas para sempre", "sem gastar nada", "recompensas reais"]} /></h2>
              <p className="sub" style={{ marginTop: 14 }}>Assinantes ativos podem indicar <strong style={{ color: "var(--tx)" }}>1 amigo por mês</strong>. Quando o indicado se cadastrar com seu código, ambos ganham 5 cotas extras — válido apenas para planos pagos (não trial).</p>
              <div className="ref-steps">
                <div className="ref-step"><div className="ref-num">1</div><div><div className="ref-step-title">Copie seu código único</div><div className="ref-step-desc">Disponível no painel após ativar um plano pago, no formato GENIUS-XXXXXX</div></div></div>
                <div className="ref-step"><div className="ref-num">2</div><div><div className="ref-step-title">Indique 1 amigo por mês</div><div className="ref-step-desc">Envie seu código por WhatsApp, e-mail ou redes sociais</div></div></div>
                <div className="ref-step"><div className="ref-num">3</div><div><div className="ref-step-title">Ambos ganham 5 cotas extras</div><div className="ref-step-desc">Creditadas após o indicado ativar uma conta paga. As cotas não expiram.</div></div></div>
              </div>
            </div>
            <div className="ref-card">
              <div className="ref-card-title">Como funciona seu código</div>
              <div className="ref-code-box">
                <div style={{ fontSize: 12, color: "var(--mu)", lineHeight: 1.6 }}>Após criar sua conta, você recebe um código único no formato <span style={{ color: "var(--g)", fontFamily: "monospace", fontWeight: 700 }}>GENIUS-XXXXXX</span>. Este é um <strong style={{ color: "var(--tx)" }}>exemplo ilustrativo</strong> — o seu código real estará disponível no painel após o cadastro.</div>
                <div className="ref-code">GENIUS-??????</div>
              </div>
              <div className="ref-rewards">
                <div className="ref-reward"><div className="ref-reward-val">+5</div><div className="ref-reward-label">cotas para você</div></div>
                <div className="ref-reward"><div className="ref-reward-val">+5</div><div className="ref-reward-label">cotas para o amigo</div></div>
              </div>
              <div className="ref-note">⚠️ <strong>Atenção:</strong> O programa de indicação é válido para assinantes ativos (planos pagos). Cada assinante pode realizar <strong>1 indicação válida por mês</strong>.</div>
            </div>
          </div>
        </div>
      </section>

      {/* CREDIT PACKS */}
      <section className="credits-sec rv" id="cotas">
        <div className="wrap">
          <div className="tag">Cotas Adicionais</div>
          <h2 className="sh">Estourou o limite?<br /><TypeWriter words={["Compre cotas extras", "Continue sem parar", "Mais criações, agora"]} /></h2>
          <p className="sub" style={{ marginTop: 12 }}>Cotas adicionais nunca expiram e se acumulam ao longo do tempo.</p>
          <div className="credits-grid">
            <div className="credit-card">
              <div className="cc-amount">5</div><div className="cc-unit">cotas adicionais</div>
              <div className="cc-price">R$4,99</div><div className="cc-per">R$1,00 por cota</div>
              <div className="cc-note">✓ Nunca expiram</div>
              <button className="cc-btn cc-btn-o">Comprar</button>
            </div>
            <div className="credit-card featured-c">
              <div className="cc-top-badge">⚡ Melhor custo</div>
              <div className="cc-amount">15</div><div className="cc-unit">cotas adicionais</div>
              <div className="cc-price">R$12,99</div><div className="cc-per">R$0,87 por cota — economia de 13%</div>
              <div className="cc-note">✓ Nunca expiram</div>
              <button className="cc-btn cc-btn-g">Comprar</button>
            </div>
            <div className="credit-card">
              <div className="cc-amount">40</div><div className="cc-unit">cotas adicionais</div>
              <div className="cc-price">R$29,99</div><div className="cc-per">R$0,75 por cota — economia de 25%</div>
              <div className="cc-note">✓ Nunca expiram</div>
              <button className="cc-btn cc-btn-o">Comprar</button>
            </div>
          </div>
          <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--mu)", marginTop: 24 }}>Cotas adicionais são consumidas após as cotas mensais do plano se esgotarem.</p>
        </div>
      </section>

      {/* TRIAL */}
      <section className="trial-sec rv">
        <div className="trial-inner">
          <div>
            <div className="tag">Trial Gratuito</div>
            <h2 className="sh">7 dias para<br /><TypeWriter words={["testar tudo", "criar sem limites", "validar sua ideia"]} /></h2>
            <p className="sub" style={{ marginTop: 12 }}>O plano Free inclui 7 dias completos com recursos do plano Basic. Após o trial, a conta é bloqueada — você escolhe um plano ou compra cotas avulsas.</p>
            <div className="trial-timeline">
              <div className="tl-item"><div className="tl-dot tl-ok">✓</div><div className="tl-body"><div className="tl-title">Dias 1–5 — Uso livre</div><div className="tl-desc">5 cotas disponíveis, todos os modos ativos.</div></div></div>
              <div className="tl-item"><div className="tl-dot tl-warn">!</div><div className="tl-body"><div className="tl-title">Dia 6 — Aviso de expiração</div><div className="tl-desc">Notificação in-app e e-mail.</div></div></div>
              <div className="tl-item"><div className="tl-dot tl-block">✕</div><div className="tl-body"><div className="tl-title">Dia 8 — Conta bloqueada</div><div className="tl-desc">Acesso suspenso até assinar um plano.</div></div></div>
            </div>
          </div>
          <div className="trial-card">
            <div className="trial-card-header">
              <div className="tc-icon">⏳</div>
              <div><div className="tc-title">Trial expirando</div><div className="tc-sub">Exemplo de aviso in-app</div></div>
            </div>
            <div className="trial-progress">
              <div className="tp-label"><span>Dias usados</span><span style={{ color: "var(--r)" }}>6 / 7</span></div>
              <div className="tp-track"><div className="tp-fill" /></div>
            </div>
            <button className="trial-cta" onClick={() => navigate("/login")}>Fazer upgrade agora →</button>
            <div className="trial-note">Ou compre 5 cotas avulsas por R$4,99</div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing rv" id="precos">
        <div className="wrap">
          <div className="tag" style={{ margin: "0 auto 18px", display: "table" }}>Planos</div>
          <h2 className="sh" style={{ textAlign: "center", margin: "0 auto" }}>Simples, transparente,<br /><TypeWriter words={["sem surpresas", "sem asteriscos", "sem letras miúdas"]} /></h2>
          <div className="plans-grid">
            {pricingProducts.map((p) => {
              const price = Number(p.price_brl);
              const colorClass = p.is_featured ? "v" : p.sort_order === 3 ? "g" : p.sort_order === 1 ? "c" : "";
              const isUnlimited = p.plan_tier === "enterprise";
              const interval = p.recurring_interval ?? "mês";
              const fmtVal = (val: number) => isUnlimited ? "Ilimitado" : `${val} / ${interval}`;
              return (
                <div key={p.id} className={`pc${p.is_featured ? " feat" : ""}`}>
                  {p.is_featured && <div className="pc-top-badge">⚡ Mais popular</div>}
                  <div className="pc-name" style={p.is_featured ? { color: "var(--v)", marginTop: 24 } : undefined}>{p.display_name}</div>
                  <div className="pc-price" style={p.is_featured ? { background: "linear-gradient(90deg,var(--c),var(--v))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" } : undefined}>
                    {price === 0 ? "R$ 0" : `R$ ${price}`}
                  </div>
                  <div className="pc-period">por {interval}</div>
                  {p.trial_period_days && p.trial_period_days > 0 && <div className="pc-trial">{p.trial_period_days} dias grátis</div>}
                  <div className="pc-div" />
                  <div className="pc-limits">
                    <div className="lrow"><span className="ll">✨ Prompts (1 cota)</span><span className={`lv ${colorClass}`}>{fmtVal(p.prompts_limit)}</span></div>
                    <div className="lrow"><span className="ll">🏗️ SaaS Specs (2 cotas)</span><span className={`lv ${colorClass}`}>{fmtVal(p.saas_specs_limit)}</span></div>
                    <div className="lrow"><span className="ll">⚡ Modo Misto (2 cotas)</span><span className={`lv ${colorClass}`}>{fmtVal(p.modo_misto_limit)}</span></div>
                    <div className="lrow"><span className="ll">⚙️ BUILD Engine (5 cotas)</span><span className={`lv ${colorClass}`}>{fmtVal(p.build_engine_limit)}</span></div>
                    <div className="lrow"><span className="ll">👥 Membros</span><span className={`lv ${colorClass}`}>{isUnlimited ? "Ilimitado" : (p.members_label ?? "1")}</span></div>
                    <div className="lrow"><span className="ll">📦 Total</span><span className={`lv ${colorClass}`}>{isUnlimited ? "Ilimitado" : `${p.credits_limit} cotas / ${interval}`}</span></div>
                  </div>
                  <p style={{ fontSize: 10.5, color: "var(--mu)", textAlign: "center", marginTop: 4, marginBottom: 4, lineHeight: 1.5 }}>
                    Cotas compartilhadas entre todas as ações
                  </p>
                  <ul className="pc-feats">
                    {p.features.map((f, i) => (
                      <li key={i} className={f.included ? "" : "no"}>{f.text}</li>
                    ))}
                  </ul>
                  <button className={`pc-btn ${p.is_featured ? "pc-btn-g" : "pc-btn-o"}`} onClick={() => handleSubscribe(p.stripe_price_id)}>{p.cta_label}</button>
                </div>
              );
            })}
          </div>

          {(() => {
            const creditCost = pricingProducts[0]?.credit_unit_cost ?? 0.87;
            const promptCost = (creditCost * 1).toFixed(2).replace(".", ",");
            const buildCost = (creditCost * 5).toFixed(2).replace(".", ",");
            const creditCostFmt = creditCost.toFixed(2).replace(".", ",");
            return (
              <div className="cost-note rv" style={{ marginTop: 40 }}>
                <strong>📊 Transparência de custos:</strong> Cada cota equivale a ~R${creditCostFmt}. Um <strong>BUILD Engine</strong> (5 cotas ≈ R${buildCost}) substitui trabalho manual que custaria <strong>R$25–60</strong>. Um Prompt (1 cota ≈ R${promptCost}) substitui ~R$8 de trabalho manual.
              </div>
            );
          })()}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testi rv">
        <div className="wrap">
          <div className="tag">Depoimentos</div>
          <h2 className="sh">Quem já usa <TypeWriter words={["adora", "recomenda", "não para"]} /></h2>
          <div className="testi-grid">
            <div className="tcard"><div className="stars">★★★★★</div><p className="tcard-text">"Em 2 minutos tinha um prompt perfeito pro Lovable. O Modo Misto entregou o prompt + toda a spec técnica do projeto. Zero retrabalho."</p><div className="tcard-author"><div className="tav">JD</div><div><div className="t-name">João Dias</div><div className="t-role">Founder, Startup SaaS</div></div></div></div>
            <div className="tcard"><div className="stars">★★★★★</div><p className="tcard-text">"Indiquei 8 amigos — ganhei 40 cotas extras que nunca expiram. Agora praticamente não preciso pagar por cotas adicionais."</p><div className="tcard-author"><div className="tav">AM</div><div><div className="t-name">Ana Moreira</div><div className="t-role">Dev Indie, No-code Builder</div></div></div></div>
            <div className="tcard"><div className="stars">★★★★☆</div><p className="tcard-text">"O sistema de cotas é justo. Quando estouro o limite, compro 15 cotas por R$12,99 e duram semanas."</p><div className="tcard-author"><div className="tav">RC</div><div><div className="t-name">Rafael Costa</div><div className="t-role">Consultor de Tecnologia</div></div></div></div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section rv" id="faq">
        <div className="wrap" style={{ textAlign: "center" }}>
          <div className="tag" style={{ margin: "0 auto 18px", display: "table" }}>FAQ</div>
          <h2 className="sh" style={{ margin: "0 auto" }}>Perguntas <TypeWriter words={["frequentes", "importantes", "respondidas"]} /></h2>
        </div>
        <div className="faq-wrap">
          <FaqItem q='O que conta como uma "cota"?' a='Cada ação consome cotas diferenciadas: <strong>Prompt = 1 cota</strong>, <strong>SaaS Spec = 2 cotas</strong>, <strong>Modo Misto = 3 cotas</strong>, <strong>BUILD Engine = 5 cotas</strong>. Refinar texto <strong>não</strong> consome cota adicional.' />
          <FaqItem q="As cotas adicionais realmente nunca expiram?" a="Sim. Cotas compradas e cotas ganhas por indicação são permanentes e se acumulam indefinidamente." />
          <FaqItem q="O que acontece quando o trial de 7 dias termina?" a="No dia 6 você recebe um aviso. No dia 8 a conta é bloqueada. Para retomar, assine qualquer plano ou compre cotas avulsas." />
          <FaqItem q="Tem limite de indicações?" a="Não. Você pode indicar quantas pessoas quiser. Cada indicação válida = 5 cotas permanentes para você e o indicado." />
          <FaqItem q="Posso cancelar a assinatura quando quiser?" a="Sim. Cancele pelo painel a qualquer momento. Suas cotas adicionais e de indicação permanecem." />
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-fin rv">
        <h2>Comece grátis hoje.<br /><span className="grad">Indique e ganhe cotas.</span></h2>
        <p>7 dias grátis. Sem cartão de crédito. Código de indicação gerado automaticamente.</p>
        <button className="btn-p" style={{ fontSize: 16, padding: "17px 42px" }} onClick={() => navigate("/login")}>Criar conta grátis →</button>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="fl">
          <img src={logo} alt="PG" />
          <span style={{ fontWeight: 800, fontSize: 14, background: "linear-gradient(90deg,var(--c),var(--v))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Prompt Genius SaaS Builder Engineer</span>
        </div>
        <div className="fc-copy">© 2026 Prompt Genius. Todos os direitos reservados.</div>
        <div className="flinks">
          <button onClick={() => setModal("terms")}>Termos</button>
          <button onClick={() => setModal("privacy")}>Privacidade</button>
          <button onClick={() => setModal("contact")}>Contato</button>
        </div>
      </footer>

      {/* MODALS */}
      <Modal open={modal === "terms"} onClose={() => setModal(null)}>
        {TERMS_CONTENT}
      </Modal>
      <Modal open={modal === "privacy"} onClose={() => setModal(null)}>
        {PRIVACY_CONTENT}
      </Modal>
      <Modal open={modal === "contact"} onClose={() => setModal(null)}>
        <ContactModalContent />
      </Modal>
    </div>);

}
