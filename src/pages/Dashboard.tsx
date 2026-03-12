import { useState } from "react";
import { Sparkles, FileCode, Layers, Rocket, Crown, Zap, Gift, Star, TrendingUp, ChevronDown, RefreshCw, CreditCard } from "lucide-react";
import { useOrgSubscription } from "@/hooks/useOrgSubscription";
import { isSubscriptionExpired } from "@/components/SubscriptionAlert";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useOrgStats } from "@/hooks/useOrgStats";
import { useQuotaBalance } from "@/hooks/useQuotaBalance";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { DashboardDock } from "@/components/dashboard/DashboardDock";
import { ShareModal } from "@/components/dashboard/ShareModal";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

// ── Helpers ──

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function getPlanBadgeClasses(planName: string | undefined): string {
  const name = (planName ?? "").toLowerCase();
  if (name.includes("enterprise")) return "border-yellow-500/40 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
  if (name.includes("pro")) return "border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400";
  if (name.includes("starter") || name.includes("básico") || name.includes("basico")) return "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400";
  return "border-muted-foreground/30 bg-muted text-muted-foreground";
}

// ── Modes config ──

const MODES = [
  {
    title: "Prompt",
    description: "Texto livre → prompt estruturado para qualquer LLM",
    icon: Sparkles,
    cost: 1,
    href: "/prompt",
    colorScheme: "purple" as const,
  },
  {
    title: "SaaS Spec",
    description: "7 perguntas → spec técnica completa",
    icon: FileCode,
    cost: 2,
    href: "/saas-spec",
    colorScheme: "blue" as const,
  },
  {
    title: "Modo Misto",
    description: "Prompt + Spec em um único fluxo automatizado",
    icon: Layers,
    cost: 2,
    href: "/mixed",
    colorScheme: "green" as const,
  },
  {
    title: "BUILD Engine",
    description: "Ideia → pacote deploy-ready completo",
    icon: Rocket,
    cost: 5,
    href: "/build",
    colorScheme: "amber" as const,
  },
] as const;

const COLOR_MAP = {
  purple: {
    card: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/20 border-purple-200 dark:border-purple-800/40",
    iconWrap: "bg-purple-500/12 dark:bg-purple-400/15",
    text: "text-purple-600 dark:text-purple-400",
    badge: "bg-purple-500/12 text-purple-600 dark:text-purple-400",
  },
  blue: {
    card: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20 border-blue-200 dark:border-blue-800/40",
    iconWrap: "bg-blue-500/12 dark:bg-blue-400/15",
    text: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-500/12 text-blue-600 dark:text-blue-400",
  },
  green: {
    card: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/20 border-green-200 dark:border-green-800/40",
    iconWrap: "bg-green-500/12 dark:bg-green-400/15",
    text: "text-green-600 dark:text-green-400",
    badge: "bg-green-500/12 text-green-600 dark:text-green-400",
  },
  amber: {
    card: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20 border-amber-200 dark:border-amber-800/40",
    iconWrap: "bg-amber-500/20 dark:bg-amber-400/15",
    text: "text-amber-700 dark:text-amber-400",
    badge: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
  },
};

// ── Mode Action Card ──

function ModeActionCard({
  title, description, icon: Icon, cost, href, colorScheme, creditsRemaining, disabled,
}: {
  title: string; description: string; icon: React.ElementType; cost: number; href: string;
  colorScheme: keyof typeof COLOR_MAP; creditsRemaining: number; disabled?: boolean;
}) {
  const navigate = useNavigate();
  const maxActions = Math.floor(creditsRemaining / cost);
  const colors = COLOR_MAP[colorScheme];

  return (
    <button
      onClick={() => !disabled && navigate(href)}
      disabled={disabled}
      className={cn(
        "group relative flex flex-col items-center gap-2 rounded-2xl border-[1.5px] p-5 sm:p-6 text-center transition-all duration-200",
        "hover:-translate-y-[3px] hover:shadow-lg h-full",
        disabled
          ? "opacity-40 cursor-not-allowed grayscale border-border/40 bg-muted/30"
          : colors.card
      )}
    >
      <div className={cn(
        "flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl mb-2",
        disabled ? "bg-muted text-muted-foreground" : cn(colors.iconWrap, colors.text)
      )}>
        <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
      </div>

      <h3 className="font-heading text-lg sm:text-xl font-semibold tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mt-1">{description}</p>

      <span className={cn(
        "rounded-full px-3 py-1 text-xs sm:text-sm font-semibold tabular-nums mt-2",
        disabled ? "bg-muted text-muted-foreground" : colors.badge
      )}>
        {cost} {cost === 1 ? "cota" : "cotas"} · até {maxActions}
      </span>

      <span className={cn(
        "mt-auto inline-flex items-center gap-1 text-sm font-semibold transition-colors pt-3",
        disabled ? "text-muted-foreground" : colors.text
      )}>
        {disabled ? "Indisponível" : "Iniciar →"}
      </span>
    </button>
  );
}

// ── Dashboard Page ──

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const orgId = profile?.personal_org_id ?? undefined;
  const { data: stats, isLoading: statsLoading } = useOrgStats(orgId);
  const { data: quota, isLoading: quotaLoading, isFetching: quotaFetching } = useQuotaBalance(orgId);
  const { data: subscription } = useOrgSubscription(orgId);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [resumoOpen, setResumoOpen] = useState(false);
  const [modosOpen, setModosOpen] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const isLoading = profileLoading || statsLoading;
  const isQuotaLoading = profileLoading || quotaLoading;

  const creditsUsed = quota?.credits_used ?? 0;
  const creditsLimit = quota?.credits_limit ?? 0;
  const creditsRemaining = quota?.credits_remaining ?? 0;
  const bonusRemaining = quota?.bonus_remaining ?? 0;
  const extraCredits = quota?.extra_credits ?? 0;
  const totalRemaining = creditsRemaining + bonusRemaining + extraCredits;

  // Access rule: user can use if they have balance OR an active subscription
  const subscriptionActive = subscription?.status === "active" || subscription?.status === "trialing";
  const canUse = totalRemaining > 0 || subscriptionActive;
  const noQuota = !isQuotaLoading && quota != null && !canUse;
  const subExpired = isSubscriptionExpired(subscription);

  const percentUsed = quota?.percent_used ?? 0;

  const planUsed = quota?.plan_used ?? 0;
  const planTotal = quota?.plan_total ?? 0;
  const bonusTotal = bonusRemaining + extraCredits;

  const handleRefreshQuota = () => {
    queryClient.invalidateQueries({ queryKey: ["quota-balance", orgId] });
  };

  const renewalRaw = quota?.reset_at || quota?.current_period_end;
  const renewalDate = renewalRaw
    ? new Date(renewalRaw).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    : "—";

  const planBadgeClasses = getPlanBadgeClasses(quota?.plan_name);

  return (
    <AppShell
      userName={profile?.full_name}
      userEmail={profile?.email}
      avatarUrl={profile?.avatar_url}
      onSignOut={signOut}
    >
      <div className="pb-28">
        {/* ── Greeting ── */}
        <section className="mb-8 animate-fade-in" style={{ animationFillMode: "backwards" }}>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-5 w-48" />
            </div>
          ) : (
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
                  {getGreeting()}, {firstName || "criador"} ✨
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">O que vamos construir hoje?</p>
              </div>
              <button
                onClick={() => navigate("/profile?tab=billing")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer hover:scale-105 transition-transform",
                  planBadgeClasses
                )}
                title="Ver planos disponíveis"
              >
                <Crown className="w-3.5 h-3.5" />
                Plano {(quota?.plan_name ?? "Free").replace(/^\w/, c => c.toUpperCase())}
              </button>
            </div>
          )}
        </section>

        {/* ── Resumo da Conta ── */}
        <Collapsible open={resumoOpen} onOpenChange={setResumoOpen}>
          <div className="rounded-[20px] border bg-card p-5 shadow-sm mb-4">
            <div className="flex items-center justify-between gap-3">
              <CollapsibleTrigger className="flex items-center justify-between flex-1 cursor-pointer gap-3">
                <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.1em]">
                  Resumo da Conta
                </p>
                {!resumoOpen && !isQuotaLoading && (
                  <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                    {subExpired && <span className="text-amber-500 mr-1">⚠️</span>}
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 tabular-nums font-medium whitespace-nowrap truncate">
                      Saldo: {totalRemaining} ({creditsRemaining} plano + {bonusRemaining} bônus + {extraCredits} extras) · Renova {renewalDate}
                    </span>
                  </div>
                )}
                <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 shrink-0", resumoOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <button
                onClick={handleRefreshQuota}
                disabled={quotaFetching}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                title="Atualizar saldo"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", quotaFetching && "animate-spin")} />
                Atualizar
              </button>
            </div>

            <CollapsibleContent className="mt-4 space-y-4">
              {/* Stats row — 5 columns */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {[
                  { emoji: "👑", label: "Plano", value: (quota?.plan_name ?? "Free").replace(/^\w/, c => c.toUpperCase()), sub: `${creditsLimit} cotas/mês · Renova ${renewalDate}` },
                  { emoji: "⚡", label: "Cotas do Plano", value: creditsRemaining, sub: `de ${planTotal} do ciclo` },
                  { emoji: "💳", label: "Créditos Extras", value: extraCredits, sub: "compras avulsas" },
                  { emoji: "🎁", label: "Bônus", value: bonusRemaining, sub: "indicações" },
                  { emoji: "📊", label: "Saldo Total", value: totalRemaining, sub: "disponível para uso", highlight: true },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border bg-muted/50 p-2.5">
                    <div className="text-sm mb-1">{item.emoji}</div>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                    {isQuotaLoading ? (
                      <Skeleton className="h-5 w-10 mt-0.5" />
                    ) : (
                      <>
                        <p className={cn("font-heading text-[17px] font-extrabold", item.highlight ? "text-primary" : "text-foreground")}>{item.value}</p>
                        <p className="text-[9px] text-muted-foreground">{item.sub}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Progress bars — thin */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cotas do Plano</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{planUsed} / {planTotal} usadas · {creditsRemaining} restantes</span>
                  </div>
                  <div className="h-[5px] w-full rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-primary transition-all duration-700"
                      style={{ width: planTotal > 0 ? `${Math.min(100, (planUsed / planTotal) * 100)}%` : "0%" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Bônus + Extras</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{bonusTotal} disponíveis</span>
                  </div>
                  <div className="h-[5px] w-full rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
                      style={{ width: bonusTotal > 0 ? "100%" : "0%" }}
                    />
                  </div>
                </div>
              </div>

              {/* Mini stats — 4 columns */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 border-t border-border pt-3.5">
                {[
                  { label: "Prompts Gerados", value: isLoading ? "—" : formatNumber(stats?.total_prompts ?? 0) },
                  { label: "Specs Criadas", value: isLoading ? "—" : formatNumber(stats?.total_saas_specs ?? 0) },
                  { label: "Total de Ações", value: isLoading ? "—" : formatNumber((stats?.total_prompts ?? 0) + (stats?.total_saas_specs ?? 0)) },
                  { label: "Média Rating", value: isLoading ? "—" : (stats?.avg_prompt_rating ? Number(stats.avg_prompt_rating).toFixed(1) : "—") },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="font-heading text-xl font-extrabold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Upgrade banner */}
              {noQuota && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">Suas cotas acabaram!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Faça upgrade ou adquira cotas avulsas para continuar criando.</p>
                  </div>
                  <button
                    onClick={() => navigate("/profile?tab=billing")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
                  >
                    <Crown className="h-3.5 w-3.5" /> Ver planos
                  </button>
                </div>
              )}
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* ── Modos Disponíveis ── */}
        <Collapsible open={modosOpen} onOpenChange={setModosOpen}>
          <div className="rounded-[20px] border bg-card p-5 shadow-sm mb-4">
            <CollapsibleTrigger className="flex items-center justify-between w-full cursor-pointer">
              <p className="text-[11px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-[0.1em]">
                Modos Disponíveis
              </p>
              <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", modosOpen && "rotate-180")} />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 auto-rows-fr">
                {MODES.map((mode, i) => (
                  <div key={mode.title} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}>
                    <ModeActionCard
                      {...mode}
                      creditsRemaining={totalRemaining}
                      disabled={noQuota}
                    />
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      {/* Dock */}
      <DashboardDock sessionCount={stats?.total_sessions} onShareOpen={() => setShareOpen(true)} />
      <ShareModal open={shareOpen} onOpenChange={setShareOpen} orgId={orgId} />
    </AppShell>
  );
}
