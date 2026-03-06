import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { AccountSidebar } from "@/components/layout/AccountSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Gift, Copy, Share2, Users, Award, Clock, TrendingUp, Target } from "lucide-react";
import { format } from "date-fns";

export default function ReferralPage() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { toast } = useToast();

  const [planTier, setPlanTier] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [bonusTotal, setBonusTotal] = useState(0);
  const [firstBonusPaid, setFirstBonusPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFirstReferralDialog, setShowFirstReferralDialog] = useState(false);
  const [firstReferredName, setFirstReferredName] = useState<string | null>(null);

  const orgId = profile?.personal_org_id;

  const confirmedCount = referrals.filter((r) => r.status === "rewarded").length;
  const progressInBlock = confirmedCount % 10;
  const progressPercent = progressInBlock * 10;
  const remaining = 10 - progressInBlock;

  useEffect(() => {
    if (!orgId || !user) return;

    const load = async () => {
      setLoading(true);

      const { data: org } = await supabase
        .from("organizations")
        .select("plan_tier, bonus_credits_total, bonus_credits_used, referral_first_bonus_paid, referral_rewards_paid")
        .eq("id", orgId)
        .single();

      if (org) {
        setPlanTier(org.plan_tier);
        setBonusTotal(org.bonus_credits_total ?? 0);
        setFirstBonusPaid(org.referral_first_bonus_paid ?? false);

        const { data: code } = await supabase.rpc("generate_referral_code", {
          p_org_id: orgId,
          p_user_id: user.id,
        });
        if (code && code !== "plan_required") {
          setReferralCode(code);
        }

        const { data: refs } = await supabase
          .from("referrals")
          .select("*")
          .eq("referrer_user_id", user.id)
          .order("created_at", { ascending: false });
        setReferrals(refs ?? []);

        // First referral celebration
        const rewardedRefs = (refs ?? []).filter((r) => r.status === "rewarded");
        if (org.referral_first_bonus_paid && rewardedRefs.length > 0) {
          const shownKey = `genius_first_referral_shown_${user.id}`;
          if (!localStorage.getItem(shownKey)) {
            const firstRef = rewardedRefs[rewardedRefs.length - 1];
            if (firstRef?.invitee_user_id) {
              const { data: inviteeProfile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", firstRef.invitee_user_id)
                .single();
              setFirstReferredName(inviteeProfile?.full_name ?? "um novo usuário");
            } else {
              setFirstReferredName("um novo usuário");
            }
            setShowFirstReferralDialog(true);
            localStorage.setItem(shownKey, "true");
          }
        }
      }

      setLoading(false);
    };

    load();
  }, [orgId, user]);

  const referralLink = referralCode
    ? `https://genius-engineer.lovable.app/?ref=${referralCode}`
    : null;

  const copyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    toast({ title: "Link copiado!", description: "Cole e compartilhe com seus contatos." });
  };

  const sharePlatform = async () => {
    const url = "https://genius-engineer.lovable.app";
    if (navigator.share) {
      await navigator.share({ title: "Prompt Genius SaaS Builder", url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copiado!" });
    }
  };

  const statusLabel: Record<string, string> = {
    trial: "Aguardando plano",
    rewarded: "Bônus concedido",
    pending: "Pendente",
    expired: "Expirado",
  };

  if (loading) {
    return (
      <AppShell userName={profile?.full_name} userEmail={profile?.email} avatarUrl={profile?.avatar_url} onSignOut={signOut}>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  const referralContent = planTier === "free" ? (
    <Card className="text-center">
      <CardContent className="py-10 space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Gift className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">
          Convites com bônus são liberados após ativação de um plano.
        </p>
        <Button variant="outline" onClick={sharePlatform} className="gap-2">
          <Share2 className="h-4 w-4" /> Compartilhar plataforma
        </Button>
      </CardContent>
    </Card>
  ) : (
    <div className="space-y-5">
      {/* Program Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Programa de Indicações</CardTitle>
          <CardDescription>
            Convide outras empresas para usar a plataforma Genius.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-3">
            <Gift className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Primeira indicação confirmada:</p>
              <p className="text-muted-foreground">+5 créditos para você &bull; +5 créditos para quem entrou</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-3">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Depois disso:</p>
              <p className="text-muted-foreground">A cada 10 indicações confirmadas, você ganha +10 créditos extras.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Indicações confirmadas</p>
              <p className="text-2xl font-bold">{confirmedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Próximo bônus</p>
              <p className="text-2xl font-bold">{remaining === 10 ? 10 : remaining} <span className="text-sm font-normal text-muted-foreground">restantes</span></p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Créditos ganhos</p>
              <p className="text-2xl font-bold">{bonusTotal}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="py-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{progressInBlock} / 10 indicações</span>
            <span className="text-muted-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {remaining === 10
              ? "Indique 10 usuários para ganhar +10 créditos."
              : `Faltam ${remaining} indicações para ganhar +10 créditos.`}
          </p>
        </CardContent>
      </Card>

      {/* Referral Link Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">
            Seu link de convite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {referralLink && (
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-xs break-all">
                {referralLink}
              </code>
              <Button size="sm" onClick={() => copyLink(referralLink)} className="gap-1.5 shrink-0">
                <Copy className="h-3.5 w-3.5" /> Copiar link
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Quando seu convidado ativar um plano pago, vocês dois recebem <strong>5 créditos bônus</strong>.
          </p>
        </CardContent>
      </Card>

      {/* Referrals List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" /> Suas indicações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma indicação ainda. Compartilhe seu link!
            </p>
          ) : (
            <div className="divide-y divide-border">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {format(new Date(r.created_at), "dd/MM/yyyy")}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      r.status === "rewarded"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : r.status === "trial"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {statusLabel[r.status] ?? r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <AppShell userName={profile?.full_name} userEmail={profile?.email} avatarUrl={profile?.avatar_url} onSignOut={signOut}>
      <section className="mb-6">
        <div className="flex items-center gap-3">
          <Gift className="h-6 w-6 text-primary" />
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Indicações</h1>
        </div>
      </section>

      <div className="flex flex-col gap-6 sm:flex-row">
        <AccountSidebar
          userName={profile?.full_name}
          userEmail={profile?.email}
          indicacoesActive
        />

        <div className="flex-1 min-w-0">
          {referralContent}
        </div>
      </div>

      {/* First Referral Celebration Dialog */}
      <Dialog open={showFirstReferralDialog} onOpenChange={setShowFirstReferralDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">🎉 Parabéns!</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-left pt-2 text-sm text-muted-foreground">
                <p>Você indicou um novo usuário para a plataforma.</p>
                <p>
                  Acabamos de creditar seus bônus pela indicação do usuário{" "}
                  <strong className="text-foreground">{firstReferredName}</strong> que acabou de fazer parte da plataforma.
                </p>
                <p>Ficamos muito felizes com isso.</p>
                <p>
                  Agora cada nova indicação gera pontos e, ao acumular{" "}
                  <strong className="text-foreground">10 convites confirmados</strong>, você recebe{" "}
                  <strong className="text-foreground">novos créditos bônus</strong>.
                </p>
                <p className="pt-1">
                  Obrigado.
                  <br />
                  <span className="font-medium text-foreground">Equipe Genius.</span>
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowFirstReferralDialog(false)} className="w-full mt-2">
            Entendi!
          </Button>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
