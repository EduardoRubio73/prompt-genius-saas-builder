import { useState, useEffect } from "react";
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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inactiveModal, setInactiveModal] = useState(false);
  const [inactiveUser, setInactiveUser] = useState<{ name: string; email: string; id: string } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: "Conta criada!", description: "Verifique seu email para confirmar." });
      } else {
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Check if account is active
        if (authData.user) {
          const isActive = await checkAccountActive(authData.user.id);
          if (!isActive) {
            await supabase.auth.signOut();
            return;
          }

          // Process referral code if present
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

              if (result === "ok_trial") {
                toast({
                  title: "Convite registrado!",
                  description: "O bônus será liberado após ativação de um plano pago.",
                });
              } else if (result === "invalid_code") {
                toast({ title: "Código de convite inválido.", variant: "destructive" });
              } else if (result === "own_code") {
                toast({ title: "Você não pode usar seu próprio código.", variant: "destructive" });
              } else if (result === "already_used") {
                toast({ title: "Este convite já foi utilizado.", variant: "destructive" });
              }
            }
            // Clean URL
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
    </div>
  );
}
