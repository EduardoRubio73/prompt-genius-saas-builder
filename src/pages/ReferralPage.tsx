import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { AccountSidebar } from "@/components/layout/AccountSidebar";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Copy, Users, Award, Target, Clock, Trophy, Check, Share2 } from "lucide-react";
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
  const [copied, setCopied] = useState(false);
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

  const handleCopy = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Link copiado!", description: "Cole e compartilhe com seus contatos." });
    setTimeout(() => setCopied(false), 2000);
  };

  const sharePlatform = async () => {
    const url = referralLink || "https://genius-engineer.lovable.app";
    if (navigator.share) {
      await navigator.share({ title: "Prompt Genius SaaS Builder", url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copiado!", description: "Cole e compartilhe com seus contatos." });
    }
  };

  const statusLabel: Record<string, string> = {
    trial: "Aguardando plano",
    rewarded: "Bônus concedido",
    pending: "Pendente",
    expired: "Expirado",
  };

  const statusClass = (status: string) => {
    if (status === "rewarded") return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    if (status === "trial") return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    return "bg-muted text-muted-foreground border-border";
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

  const freePlanContent = (
    <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-4">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Gift className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-sm">
        Convites com bônus são liberados após ativação de um plano.
      </p>
      <Button variant="outline" onClick={sharePlatform} className="gap-2">
        <Share2 className="h-4 w-4" /> Compartilhar plataforma
      </Button>
    </div>
  );

  const mainContent = (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={<Users className="h-5 w-5 text-primary" />} label="Indicações confirmadas" value={confirmedCount} />
        <StatCard icon={<Target className="h-5 w-5 text-primary" />} label="Próximo bônus" value={remaining === 10 ? 10 : remaining} sub="restantes" />
        <StatCard icon={<Award className="h-5 w-5 text-primary" />} label="Créditos ganhos" value={bonusTotal} />
      </div>

      {/* Progress */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-sm font-semibold text-foreground">
            {progressInBlock}/{10} indicações para o próximo bônus
          </span>
          <span className="text-xs font-semibold text-primary">{progressPercent}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-primary/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-400"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {remaining === 10
            ? "Indique 10 usuários para ganhar +10 créditos."
            : `Faltam ${remaining} indicações para ganhar +10 créditos.`}
        </p>
      </div>

      {/* Como funciona */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-[15px] font-bold text-foreground mb-1">Como funciona</h3>
        <p className="text-xs text-muted-foreground mb-4">Regras do programa de indicações</p>
        <div className="flex flex-col gap-2.5">
          <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${
            firstBonusPaid
              ? "bg-green-50/60 border-green-200 dark:bg-green-900/20 dark:border-green-800"
              : "bg-primary/5 border-primary/20"
          }`}>
            <span className="mt-0.5 shrink-0">
              {firstBonusPaid ? <Check className="h-5 w-5 text-green-600 dark:text-green-400" /> : <Gift className="h-5 w-5 text-primary" />}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-[13px] font-semibold mb-0.5 ${firstBonusPaid ? "text-green-700 dark:text-green-400" : "text-foreground"}`}>
                Na sua primeira indicação, todos ganham
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Você e o convidado recebem +5 créditos cada ao ativar um plano.
              </p>
            </div>
            {firstBonusPaid && (
              <span className="shrink-0 text-[11px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-2.5 py-1 rounded-full">
                Concluído
              </span>
            )}
          </div>
          <div className="flex items-start gap-3 p-3.5 rounded-xl border bg-primary/5 border-primary/20">
            <Trophy className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-foreground mb-0.5">A cada 10 indicações confirmadas</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Você ganha +10 créditos extras automaticamente.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Convide e ganhe */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-[15px] font-bold text-foreground mb-1">Convide e ganhe</h3>
        <p className="text-xs text-muted-foreground mb-4">Compartilhe seu link ou use seus bônus disponíveis</p>

        {referralLink && (
          <div className="flex gap-2.5 items-center mb-4">
            <div className="flex-1 bg-muted border border-border rounded-lg px-3.5 py-2.5 text-xs text-muted-foreground font-mono truncate">
              {referralLink}
            </div>
            <Button size="sm" onClick={handleCopy} className="gap-1.5 shrink-0">
              {copied ? <><Check className="h-3.5 w-3.5" /> Copiado!</> : <><Copy className="h-3.5 w-3.5" /> Copiar link</>}
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Quando seu convidado ativar um plano pago, vocês dois recebem{" "}
          <span className="text-primary font-semibold">5 créditos bônus</span>.
        </p>

        {bonusTotal > 0 && (
          <>
            <hr className="border-border my-4" />
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground mb-0.5 flex items-center gap-1.5">
                  <Gift className="h-4 w-4 text-primary" /> Bônus de indicação disponível
                </p>
                <p className="text-xs text-muted-foreground">
                  Compartilhe um bônus — você e o amigo ganham +5 créditos grátis.
                </p>
              </div>
              <span className="shrink-0 text-xs font-bold bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 px-3 py-1 rounded-full">
                {bonusTotal} disponível
              </span>
              <Button variant="outline" size="sm" onClick={sharePlatform} className="gap-1.5 shrink-0 border-primary/30 text-primary hover:bg-primary/5">
                <Share2 className="h-3.5 w-3.5" /> Compartilhar
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Suas indicações */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-3.5">
          Suas indicações
        </h3>
        {referrals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-5">
            Nenhuma indicação ainda. Compartilhe seu link!
          </p>
        ) : (
          <div className="divide-y divide-border">
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3 text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {format(new Date(r.created_at), "dd/MM/yyyy")}
                </span>
                <span className={`text-[11.5px] font-semibold px-3 py-1 rounded-full border ${statusClass(r.status)}`}>
                  {statusLabel[r.status] ?? r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
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
        <AccountSidebar userName={profile?.full_name} userEmail={profile?.email} indicacoesActive />
        <div className="flex-1 min-w-0">
          {planTier === "free" ? freePlanContent : mainContent}
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
                  Obrigado.<br />
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

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3.5">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
