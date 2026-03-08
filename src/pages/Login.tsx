import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import logo from "@/assets/logo.png";

// ────────────────────────────────────────────────────────────────────────────────
// CONFIG — busca dinâmica do admin_settings (category = "whatsapp")
// ────────────────────────────────────────────────────────────────────────────────
async function getEvolutionConfig() {
  const { data, error } = await supabase.rpc("get_whatsapp_config");

  if (error || !data || data.length === 0) {
    throw new Error("Configuração da Evolution API não encontrada. Peça ao admin para configurar em /admin/settings/whatsapp");
  }

  const map: Record<string, string> = {};
  data.forEach((r: { key: string; value: string }) => { map[r.key] = r.value; });

  if (!map.evolution_api_url || !map.evolution_api_key || !map.evolution_instance) {
    throw new Error("Configuração incompleta da Evolution API.");
  }

  return {
    url: map.evolution_api_url,
    apiKey: map.evolution_api_key,
    instance: map.evolution_instance,
  };
}

function buildReactivationMailto(name: string, email: string, userId: string) {
  const now = new Date().toLocaleString("pt-BR");
  const subject = encodeURIComponent(`Solicitação de Reativação - ${name || "Usuário"}`);
  const body = encodeURIComponent(
`Olá equipe de suporte,

O usuário ${name || "N/A"} (${email}) solicitou REATIVAÇÃO da conta.

Dados:
• ID: ${userId}
• Data da solicitação: ${now}

Aguardando aprovação manual.

---
Sistema Genius`
  );
  return `mailto:zragencyia@gmail.com?subject=${subject}&body=${body}`;
}

/* Gera código numérico aleatório de 6 dígitos */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/* Normaliza celular para formato internacional (sem + nem espaços) */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return "55" + digits;
}

function parseAuthRateLimitSeconds(message: string): number | null {
  const match = message.match(/after\s+(\d+)\s+seconds/i);
  if (match?.[1]) return Number(match[1]);
  return null;
}

/* Verifica se a instância Evolution está conectada */
async function checkInstanceConnected(config: { url: string; apiKey: string; instance: string }): Promise<void> {
  try {
    const res = await fetch(
      `${config.url}/instance/connectionState/${config.instance}`,
      { method: "GET", headers: { apikey: config.apiKey } }
    );
    if (!res.ok) return; // não bloqueia se o endpoint não existir
    const data = await res.json();
    const state = data?.instance?.state ?? data?.state;
    if (state && state !== "open") {
      throw new Error("WhatsApp desconectado. O administrador precisa reconectar a instância.");
    }
  } catch (err: any) {
    if (err?.message?.includes("desconectado")) throw err;
    // ignora erros de rede no pre-flight — o sendText vai falhar com erro mais claro
  }
}

/* Envia mensagem via Evolution API */
async function sendWhatsAppCode(phone: string, code: string, userName?: string): Promise<void> {
  const config = await getEvolutionConfig();

  // Pre-flight: verifica se instância está conectada
  await checkInstanceConnected(config);

  const normalized = normalizePhone(phone);
  const response = await fetch(
    `${config.url}/message/sendText/${config.instance}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey,
      },
      body: JSON.stringify({
        number: normalized,
        text: `🔐 *Genius — Verificação de Segurança*\n\nOlá${userName ? `, ${userName}` : ""}! Seu código de verificação é:\n\n*${code}*\n\nEle expira em 10 minutos.\nNão compartilhe este código com ninguém.\n\n— Equipe Genius`,
      }),
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = body?.response?.message?.[0] ?? body?.message ?? body?.error;

    if (response.status === 401) {
      throw new Error("Token da Evolution API inválido. Contate o administrador.");
    }
    if (detail?.includes?.("sendMessage")) {
      throw new Error("Instância WhatsApp desconectada. Contate o suporte.");
    }
    throw new Error(detail ?? "Falha ao enviar WhatsApp. Tente novamente.");
  }
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [celular, setCelular] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modal conta inativa
  const [inactiveModal, setInactiveModal] = useState(false);
  const [inactiveUser, setInactiveUser] = useState<{ name: string; email: string; id: string } | null>(null);

  // Modal verificação WhatsApp
  const [verifyModal, setVerifyModal] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [verifyLoading, setVerifyLoading] = useState(false);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [signupCooldown, setSignupCooldown] = useState(0);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  // Countdown do botão "Reenviar"
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Countdown para novo tentativa de signup quando Auth aplica rate limit
  useEffect(() => {
    if (signupCooldown <= 0) return;
    const t = setTimeout(() => setSignupCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [signupCooldown]);

  const checkAccountActive = async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("profiles")
      .select("ativo, full_name, email")
      .eq("id", userId)
      .single();

    if (data && data.ativo === false) {
      setInactiveUser({ name: data.full_name ?? "", email: data.email, id: userId });
      setInactiveModal(true);
      return false;
    }
    return true;
  };

  // Gera + persiste + envia código
  const createAndSendCode = async (userId: string, phone: string): Promise<void> => {
    const code = generateCode();

    const { error } = await supabase.rpc("insert_phone_verification", {
      p_user_id: userId,
      p_phone: normalizePhone(phone),
      p_code: code,
    });

    if (error) throw new Error("Erro ao salvar código: " + error.message);

    await sendWhatsAppCode(phone, code);
  };

  // Verifica código digitado pelo usuário
  const handleVerifyCode = async () => {
    const verifyCode = digits.join("");
    if (!pendingUserId || verifyCode.length !== 6) return;
    setVerifyLoading(true);

    try {
      const { data: result, error } = await supabase.rpc("verify_phone_code", {
        p_user_id: pendingUserId,
        p_code: verifyCode.trim(),
      });

      if (error) throw new Error(error.message);

      if (result === "expired") {
        toast({ title: "Código expirado ou inválido.", description: "Solicite um novo código.", variant: "destructive" });
        return;
      }
      if (result === "too_many_attempts") {
        toast({ title: "Muitas tentativas.", description: "Solicite um novo código.", variant: "destructive" });
        return;
      }
      if (result?.startsWith("wrong_code:")) {
        const attempt = result.split(":")[1];
        toast({ title: "Código incorreto.", description: `Tentativa ${attempt}/5`, variant: "destructive" });
        return;
      }

      setVerifyModal(false);
      toast({ title: "✔ WhatsApp verificado!" });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Erro na verificação", description: err.message, variant: "destructive" });
    } finally {
      setVerifyLoading(false);
    }
  };

  // Reenviar código
  const handleResendCode = async () => {
    if (!pendingUserId || resendCooldown > 0) return;
    try {
      await createAndSendCode(pendingUserId, celular);
      setDigits(Array(6).fill(""));
      setTimeout(() => digitRefs.current[0]?.focus(), 100);
      setResendCooldown(60);
      toast({ title: "Código reenviado!", description: "Verifique seu WhatsApp." });
    } catch (err: any) {
      toast({ title: "Erro ao reenviar", description: err.message, variant: "destructive" });
    }
  };

  // Submit principal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSignUp && signupCooldown > 0) {
      toast({
        title: "Aguarde para tentar novamente",
        description: `Você poderá tentar novo cadastro em ${signupCooldown}s.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) throw new Error("Nome completo é obrigatório.");
        if (!celular.trim()) throw new Error("Celular é obrigatório.");

        const digitsOnly = celular.replace(/\D/g, "");
        if (digitsOnly.length < 10 || digitsOnly.length > 13) {
          throw new Error("Celular inválido. Use DDD + número (ex: 11999998888).");
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });

        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error("Erro inesperado ao criar conta.");

        const userId = signUpData.user.id;

        await supabase.rpc("update_profile_celular", {
          p_user_id: userId,
          p_celular: normalizePhone(celular),
        });

        toast({ title: "Conta criada!", description: "Confirme seu e-mail e depois faça login." });
      } else {
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (authData.user) {
          const isActive = await checkAccountActive(authData.user.id);
          if (!isActive) {
            await supabase.auth.signOut();
            return;
          }

          // Check referral code
          const refCode = new URLSearchParams(window.location.search).get("ref");
          if (refCode) {
            const { data: prof } = await supabase
              .from("profiles")
              .select("personal_org_id")
              .eq("id", authData.user.id)
              .single();

            if (prof?.personal_org_id) {
              const { data: result } = await supabase.rpc("process_referral", {
                p_code: refCode,
                p_invitee_org: prof.personal_org_id,
                p_invitee_user: authData.user.id,
              });

              const referralMessages: Record<string, { title: string; variant?: "destructive" }> = {
                ok_trial: { title: "Convite registrado!" },
                invalid_code: { title: "Código de convite inválido.", variant: "destructive" },
                own_code: { title: "Você não pode usar seu próprio código.", variant: "destructive" },
                already_used: { title: "Este convite já foi utilizado.", variant: "destructive" },
                limit_reached: { title: "Este código atingiu o limite de utilizações.", variant: "destructive" },
              };

              const msg = referralMessages[result as string];
              if (msg) toast({ title: msg.title, variant: msg.variant });
            }
            window.history.replaceState({}, "", "/login");
          }

          // Check WhatsApp phone verification
          const { data: isVerified } = await supabase.rpc("check_phone_verified", {
            p_user_id: authData.user.id,
          });

          if (!isVerified) {
            // Fetch celular from profile
            const { data: profile } = await supabase
              .from("profiles")
              .select("celular")
              .eq("id", authData.user.id)
              .single();

            const userPhone = profile?.celular;
            if (!userPhone) {
              // No phone registered — skip verification, go to dashboard
              navigate("/dashboard");
              return;
            }

            setCelular(userPhone);
            setPendingUserId(authData.user.id);
            await createAndSendCode(authData.user.id, userPhone);
            setDigits(Array(6).fill(""));
            setResendCooldown(60);
            setVerifyModal(true);
            toast({ title: "Verificação necessária", description: "Insira o código enviado ao seu WhatsApp." });
            return;
          }
        }

        navigate("/dashboard");
      }
    } catch (err: any) {
      const message = err?.message ?? "Erro inesperado ao autenticar.";

      if (isSignUp && (err?.status === 429 || err?.code === "over_email_send_rate_limit" || /email rate limit exceeded/i.test(message))) {
        const retryAfter = parseAuthRateLimitSeconds(message);

        if (retryAfter && retryAfter > 0) {
          setSignupCooldown(retryAfter);
        }

        toast({
          title: "Limite de envio atingido",
          description: retryAfter
            ? `Aguarde ${retryAfter}s e tente novamente. Verifique também sua caixa de entrada (e spam).`
            : "O Supabase aplicou um limite temporário de e-mails (pode ocorrer até na primeira tentativa). Aguarde alguns minutos e tente novamente.",
          variant: "destructive",
        });
        return;
      }

      if (isSignUp && /already registered|already been registered/i.test(message)) {
        toast({
          title: "E-mail já cadastrado",
          description: "Se esse e-mail já existe, confirme o e-mail recebido e use Entrar.",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReactivationRequest = () => {
    if (inactiveUser) {
      window.location.href = buildReactivationMailto(inactiveUser.name, inactiveUser.email, inactiveUser.id);
    }
    setInactiveModal(false);
  };

  const handleInactiveExit = async () => {
    await supabase.auth.signOut();
    setInactiveModal(false);
    setInactiveUser(null);
  };

  // ─────────────────────────────── RENDER ───────────────────────────────
  return (
    <div className="noise-overlay relative flex min-h-screen items-center justify-center px-4">
      <div className="relative z-10 w-full max-w-sm space-y-6">
        <div className="text-center">
          <img src={logo} alt="Prompt Genius SaaS Builder" className="mx-auto mb-4 h-20 w-auto" />
          <h1 className="font-heading text-2xl font-bold">Prompt Genius SaaS Builder Engineer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignUp ? "Crie sua conta" : "Entre na sua conta"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card space-y-4 p-6">
          {isSignUp && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <InfoTooltip content="Seu nome como aparecerá na plataforma." />
                </div>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Maria da Silva"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="celular">WhatsApp (com DDD)</Label>
                  <InfoTooltip content="Será usado para verificar sua conta via código. Ex: 11999998888" />
                </div>
                <Input
                  id="celular"
                  type="text"
                  inputMode="numeric"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  required
                  placeholder="11999998888"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="email">Email</Label>
              <InfoTooltip content="Use o e-mail cadastrado. Formato: nome@dominio.com" />
            </div>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="password">Senha</Label>
              <InfoTooltip content="Mínimo 6 caracteres. Combine letras, números e símbolos para mais segurança." />
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || (isSignUp && signupCooldown > 0)}
          >
            {loading
              ? "Carregando..."
              : isSignUp && signupCooldown > 0
                ? `Aguarde ${signupCooldown}s`
                : isSignUp
                  ? "Criar conta"
                  : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? "Já tem conta?" : "Não tem conta?"}{" "}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-medium text-primary hover:underline"
          >
            {isSignUp ? "Entrar" : "Criar conta"}
          </button>
        </p>
      </div>

      {/* Inactive Account Modal */}
      <Dialog open={inactiveModal} onOpenChange={setInactiveModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>🔒 Sua conta está INATIVA</DialogTitle>
            <DialogDescription className="space-y-3 text-left pt-2">
              <p>Sua conta foi desativada. Para voltar a usar a plataforma, é necessário solicitar reativação à equipe de suporte.</p>
              <p className="text-xs text-muted-foreground">
                Após a solicitação, aguarde aprovação da equipe (24-48h). Você receberá um email de confirmação.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleInactiveExit} className="w-full sm:w-auto">
              Não, sair
            </Button>
            <Button onClick={handleReactivationRequest} className="w-full sm:w-auto">
              Sim, solicitar reativação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Verification Modal */}
      <Dialog open={verifyModal} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>🔐 Verificação de 2 etapas</DialogTitle>
            <DialogDescription className="text-left pt-2">
              Insira o código enviado via WhatsApp para <strong>{celular}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center gap-2 py-4">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { digitRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                autoFocus={idx === 0}
                className="h-12 w-12 rounded-lg border-2 border-input bg-background text-center text-xl font-bold text-foreground transition-all focus:border-primary focus:ring-2 focus:ring-ring focus:outline-none"
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (!val) return;
                  const newDigits = [...digits];
                  newDigits[idx] = val[val.length - 1];
                  setDigits(newDigits);
                  if (idx < 5) digitRefs.current[idx + 1]?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace") {
                    e.preventDefault();
                    const newDigits = [...digits];
                    if (digits[idx]) {
                      newDigits[idx] = "";
                      setDigits(newDigits);
                    } else if (idx > 0) {
                      newDigits[idx - 1] = "";
                      setDigits(newDigits);
                      digitRefs.current[idx - 1]?.focus();
                    }
                  } else if (e.key === "ArrowLeft" && idx > 0) {
                    digitRefs.current[idx - 1]?.focus();
                  } else if (e.key === "ArrowRight" && idx < 5) {
                    digitRefs.current[idx + 1]?.focus();
                  } else if (e.key === "Enter") {
                    handleVerifyCode();
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                  if (!pasted) return;
                  const newDigits = Array(6).fill("");
                  pasted.split("").forEach((c, i) => {
                    newDigits[i] = c;
                  });
                  setDigits(newDigits);
                  const focusIdx = Math.min(pasted.length, 5);
                  setTimeout(() => digitRefs.current[focusIdx]?.focus(), 50);
                }}
              />
            ))}
          </div>

          <DialogFooter className="flex-col gap-3">
            <Button
              className="w-full"
              disabled={verifyLoading || digits.join("").length !== 6}
              onClick={handleVerifyCode}
            >
              {verifyLoading ? "Verificando..." : "Continuar"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Não recebeu?{" "}
              {resendCooldown > 0 ? (
                <span className="text-muted-foreground">Reenviar em {resendCooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="font-medium text-primary hover:underline"
                >
                  Reenviar código
                </button>
              )}
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
