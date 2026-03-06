import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Gift, Copy, Share2, Users, Award, Clock } from "lucide-react";
import { format } from "date-fns";

export default function ReferralPage() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { toast } = useToast();

  const [planTier, setPlanTier] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const orgId = profile?.personal_org_id;

  useEffect(() => {
    if (!orgId || !user) return;

    const load = async () => {
      setLoading(true);

      // Fetch org plan
      const { data: org } = await supabase
        .from("organizations")
        .select("plan_tier, bonus_credits_total, bonus_credits_used")
        .eq("id", orgId)
        .single();

      if (org) {
        setPlanTier(org.plan_tier);
        setBonusBalance(Math.max(0, (org.bonus_credits_total ?? 0) - (org.bonus_credits_used ?? 0)));

        if (org.plan_tier !== "free") {
          // Generate/get referral code
          const { data: code } = await supabase.rpc("generate_referral_code", {
            p_org_id: orgId,
            p_user_id: user.id,
          });
          if (code && code !== "plan_required") {
            setReferralCode(code);
          }

          // Fetch referrals
          const { data: refs } = await supabase
            .from("referrals")
            .select("*")
            .eq("referrer_user_id", user.id)
            .order("created_at", { ascending: false });
          setReferrals(refs ?? []);
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

  const shareplatform = async () => {
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

  return (
    <AppShell userName={profile?.full_name} userEmail={profile?.email} avatarUrl={profile?.avatar_url} onSignOut={signOut}>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <Gift className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Indicações</h1>
        </div>

        {planTier === "free" ? (
          /* ── FREE PLAN ── */
          <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Gift className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              Convites com bônus são liberados após ativação de um plano.
            </p>
            <Button variant="outline" onClick={shareplatform} className="gap-2">
              <Share2 className="h-4 w-4" /> Compartilhar plataforma
            </Button>
          </div>
        ) : (
          /* ── PAID PLAN ── */
          <div className="space-y-4">
            {/* Referral Link Card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Seu link de convite
              </h2>
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
            </div>

            {/* Bonus Balance */}
            <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bônus acumulado</p>
                <p className="text-xl font-bold">{bonusBalance} créditos</p>
              </div>
            </div>

            {/* Referrals List */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Suas indicações
              </h2>
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
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
