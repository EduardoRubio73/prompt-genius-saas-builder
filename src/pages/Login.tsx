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
// CONFIG — variáveis de ambiente
// ────────────────────────────────────────────────────────────────────────────────
const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL;
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = import.meta.env.VITE_EVOLUTION_INSTANCE;

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

/* Envia mensagem via Evolution API */
async function sendWhatsAppCode(phone: string, code: string): Promise<void> {
  const normalized = normalizePhone(phone);
  const response = await fetch(
    `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: normalized,
        text: `🔐 *Seu código de verificação é: ${code}*\n\nEle expira em 10 minutos. Não compartilhe com ninguém.`,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message ?? "Falha ao enviar WhatsApp");
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

    const { error } = await supabase.from("phone_verifications").insert({
      user_id: userId,
      phone: normalizePhone(phone),
      code,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
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
      const { data, error } = await supabase
        .from("phone_verifications")
        .select("id, code, expires_at, attempts")
        .eq("user_id", pendingUserId)
        .is("verified_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        toast({ title: "Código expirado ou inválido.", description: "Solicite um novo código.", variant: "destructive" });
        return;
      }

      if (data.attempts >= 5) {
        toast({ title: "Muitas tentativas.", description: "Solicite um novo código.", variant: "destructive" });
        return;
      }

      if (data.code !== verifyCode.trim()) {
        await supabase
          .from("phone_verifications")
          .update({ attempts: (data.attempts ?? 0) + 1 })
          .eq("id", data.id);

        toast({ title: "Código incorreto.", description: `Tentativa ${(data.attempts ?? 0) + 1}/5`, variant: "destructive" });
        return;
      }

      // Marca como verificado
      await supabase
        .from("phone_verifications")
        .update({ verified_at: new Date().toISOString() })
        .eq("id", data.id);

      // Atualiza celular no profile
      await supabase
        .from("profiles")
        .update({ celular: normalizePhone(celular) })
        .eq("id", pendingUserId);

      setVerifyModal(false);
      toast({ title: "✔ WhatsApp verificado!", description: "Conta criada com sucesso. Confirme seu e-mail para acessar." });
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

        await supabase
          .from("profiles")
          .update({ full_name: fullName, celular: normalizePhone(celular) })
          .eq("id", userId);

        await createAndSendCode(userId, celular);

        setPendingUserId(userId);
        setDigits(Array(6).fill(""));
        setResendCooldown(60);
        setVerifyModal(true);

        toast({ title: "Conta criada!", description: "Verifique seu WhatsApp e confirme o código." });
      } else {
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (authData.user) {
          const isActive = await checkAccountActive(authData.user.id);
          if (!isActive) {
            await supabase.auth.signOut();
            return;
          }

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
        }

        navigate("/dashboard");
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Carregando..." : isSignUp ? "Criar conta" : "Entrar"}
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
