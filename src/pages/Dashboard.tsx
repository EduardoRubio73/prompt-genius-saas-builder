import { Sparkles, FileCode, Layers, Rocket, Crown, Zap, Gift, Calendar, ArrowRight, BarChart3, Clock, Star, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useOrgStats } from "@/hooks/useOrgStats";
import { useQuotaBalance } from "@/hooks/useQuotaBalance";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import ReferralBonusCard from "@/components/referral/ReferralBonusCard";

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
    accent: "text-primary",
    bgAccent: "bg-primary/10",
    borderAccent: "border-primary/20",
    glowColor: "hsla(var(--primary) / 0.15)",
  },
  {
    title: "SaaS Spec",
    description: "7 perguntas → spec técnica completa",
    icon: FileCode,
    cost: 2,
    href: "/saas-spec",
    accent: "text-accent",
    bgAccent: "bg-accent/10",
    borderAccent: "border-accent/20",
    glowColor: "hsla(var(--accent) / 0.15)",
  },
  {
    title: "Modo Misto",
    description: "Prompt + Spec em um único fluxo automatizado",
    icon: Layers,
    cost: 2,
    href: "/mixed",
    accent: "text-secondary",
    bgAccent: "bg-secondary/10",
    borderAccent: "border-secondary/20",
    glowColor: "hsla(var(--secondary) / 0.15)",
  },
  {
    title: "BUILD Engine",
    description: "Ideia → pacote deploy-ready completo",
    icon: Rocket,
    cost: 5,
    href: "/build",
    accent: "text-primary",
    bgAccent: "bg-primary/10",
    borderAccent: "border-primary/20",
    glowColor: "hsla(var(--primary) / 0.15)",
  },
] as const;

// ── Summary Card ──

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  iconClass,
  loading,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconClass?: string;
  loading?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-card p-5 flex items-center gap-3 shadow-md hover:shadow-xl transition-all duration-300",
        onClick && "cursor-pointer hover:border-primary/30"
      )}
    >
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconClass ?? "bg-muted text-muted-foreground")}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        {loading ? (
          <Skeleton className="h-6 w-16 mt-0.5" />
        ) : (
          <>
            <p className="text-lg font-bold text-foreground tracking-tight leading-tight">{value}</p>
            {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
          </>
        )}
      </div>
    </div>
  );
}

// ── Mode Action Card ──

function ModeActionCard({
  title,
  description,
  icon: Icon,
  cost,
  href,
  accent,
  bgAccent,
  borderAccent,
  creditsRemaining,
  disabled,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  cost: number;
  href: string;
  accent: string;
  bgAccent: string;
  borderAccent: string;
  creditsRemaining: number;
  disabled?: boolean;
}) {
  const navigate = useNavigate();
  const maxActions = Math.floor(creditsRemaining / cost);

  return (
    <button
      onClick={() => !disabled && navigate(href)}
      disabled={disabled}
      className={cn(
        "group relative flex flex-col items-center gap-3 p-6 rounded-xl border text-center transition-all duration-300",
        "hover:shadow-xl hover:scale-[1.02]",
        disabled
          ? "opacity-40 cursor-not-allowed grayscale border-border/40 bg-muted/30"
          : cn("border bg-card hover:border-primary/30 shadow-md", borderAccent)
      )}
    >
      <div className={cn(
        "flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
        disabled ? "bg-muted text-muted-foreground" : cn(bgAccent, accent)
      )}>
        <Icon className="h-7 w-7" />
      </div>

      <div className="space-y-1">
        <h3 className="font-heading text-base font-bold tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>

      <div className="flex items-center gap-1.5 mt-1">
        <span className={cn("text-xs font-bold", disabled ? "text-muted-foreground" : accent)}>
          {cost} {cost === 1 ? "cota" : "cotas"}
        </span>
        <InfoTooltip
          content={`Com seu saldo atual você pode gerar até ${maxActions} ${title}${maxActions !== 1 ? "s" : ""}.`}
        />
      </div>

      <p className="text-[10px] text-muted-foreground tabular-nums">
        {disabled ? "Sem cotas" : `até ${maxActions} possíveis`}
      </p>

      <span
        className={cn(
          "mt-auto inline-flex items-center gap-1 text-sm font-semibold transition-colors",
          disabled ? "text-muted-foreground" : accent
        )}
      >
        {disabled ? "Indisponível" : "Iniciar →"}
      </span>
    </button>
  );
}

// ── Usage Progress Bar ──

function UsageProgressBar({ used, limit, className }: { used: number; limit: number; className?: string }) {
  const pct = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0;

  const barColor =
    pct >= 90 ? "from-red-500 to-red-600" :
    pct >= 75 ? "from-orange-400 to-orange-500" :
    pct >= 50 ? "from-yellow-400 to-yellow-500" :
    "from-green-400 to-green-600";

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
        <span><span className="text-foreground font-semibold">{used}</span> / {limit} usadas</span>
        <span><span className="text-foreground font-semibold">{Math.max(0, limit - used)}</span> restantes</span>
      </div>
    </div>
  );
}

// ── Quick Action Card ──

function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  accent,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  accent: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(href)}
      className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:shadow-xl shadow-md text-left transition-all duration-300 group w-full"
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted", accent)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
    </button>
  );
}

// ── Dashboard Page ──

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const orgId = profile?.personal_org_id ?? undefined;
  const { data: stats, isLoading: statsLoading } = useOrgStats(orgId);
  const { data: quota, isLoading: quotaLoading } = useQuotaBalance(orgId);
  const navigate = useNavigate();

  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const isLoading = profileLoading || statsLoading;
  const isQuotaLoading = profileLoading || quotaLoading;

  const creditsUsed = quota?.credits_used ?? 0;
  const creditsLimit = quota?.credits_limit ?? 0;
  const creditsRemaining = quota?.credits_remaining ?? 0;
  const bonusRemaining = quota?.bonus_remaining ?? 0;
  const extraCredits = quota?.extra_credits ?? 0;
  const noQuota = !isQuotaLoading && quota != null && (quota.total_remaining ?? 0) <= 0;

  const renewalDate = quota?.current_period_end
    ? new Date(quota.current_period_end).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    : "—";

  const planBadgeClasses = getPlanBadgeClasses(quota?.plan_name);

  return (
    <AppShell
      userName={profile?.full_name}
      userEmail={profile?.email}
      avatarUrl={profile?.avatar_url}
      onSignOut={signOut}
    >
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
              <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                {getGreeting()}, {firstName || "criador"} ✨
              </h1>
              <p className="mt-1 text-muted-foreground">O que vamos construir hoje?</p>
            </div>
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider shadow-sm",
              planBadgeClasses
            )}>
              <Crown className="w-3.5 h-3.5" />
              Plano {quota?.plan_name ?? "Free"}
            </div>
          </div>
        )}
      </section>

      {/* ── Account Summary ── */}
      <section className="mb-6">
        <div className="rounded-xl border bg-card p-5 shadow-md">
          <div className="flex items-center gap-1.5 mb-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Resumo da Conta
            </p>
            <InfoTooltip content="Visão geral do seu plano atual, saldo de cotas, bônus e data de renovação." />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Crown, label: "Plano Atual", value: quota?.plan_name ?? "Free", sub: `${creditsLimit} cotas / mês`, iconClass: "bg-primary/15 text-primary", onClick: () => navigate("/profile?tab=billing") },
              { icon: Zap, label: "Cotas Restantes", value: creditsRemaining + extraCredits, sub: extraCredits > 0 ? `${creditsRemaining} plano + ${extraCredits} extras` : `de ${creditsLimit}`, iconClass: "bg-primary/15 text-primary", onClick: () => navigate("/profile?tab=billing") },
              { icon: Gift, label: "Bônus", value: bonusRemaining, sub: "cotas extras permanentes", iconClass: "bg-accent/15 text-accent", onClick: () => navigate("/profile?tab=billing") },
              { icon: Calendar, label: "Renovação", value: renewalDate, sub: "próximo ciclo", iconClass: "bg-muted text-muted-foreground", onClick: () => navigate("/profile?tab=billing") },
            ].map((card, i) => (
              <div key={card.label} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}>
                <SummaryCard {...card} loading={isQuotaLoading} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Usage Progress ── */}
      <section className="mb-6 animate-fade-in" style={{ animationDelay: "350ms", animationFillMode: "backwards" }}>
        <div className="rounded-xl border bg-card shadow-md p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Uso do período
            </p>
            <InfoTooltip content="Todas as ações utilizam a mesma bolsa de cotas. Você pode combinar diferentes ações até consumir seu limite mensal." />
          </div>
          {isQuotaLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <UsageProgressBar used={creditsUsed} limit={creditsLimit} />
          )}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="mb-6">
        <div className="rounded-xl border bg-card p-5 shadow-md">
          <div className="flex items-center gap-1.5 mb-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Estatísticas
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Sparkles, label: "Prompts gerados", value: isLoading ? "—" : formatNumber(stats?.total_prompts ?? 0), onClick: () => navigate("/memory?mode=prompt") },
              { icon: FileCode, label: "Specs criadas", value: isLoading ? "—" : formatNumber(stats?.total_saas_specs ?? 0), onClick: () => navigate("/memory?mode=saas") },
              { icon: TrendingUp, label: "Total de ações", value: isLoading ? "—" : formatNumber((stats?.total_prompts ?? 0) + (stats?.total_saas_specs ?? 0)), iconClass: "bg-primary/15 text-primary", onClick: () => navigate("/history") },
              { icon: Star, label: "Média rating", value: isLoading ? "—" : (stats?.avg_prompt_rating ? Number(stats.avg_prompt_rating).toFixed(1) : "—"), sub: `${stats?.total_sessions ?? 0} sessões`, onClick: () => navigate("/history") },
            ].map((card, i) => (
              <div key={card.label} className="animate-fade-in" style={{ animationDelay: `${450 + i * 80}ms`, animationFillMode: "backwards" }}>
                <SummaryCard {...card} loading={isLoading} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Upgrade banner when quotas exhausted ── */}
      {noQuota && (
        <section className="mb-6 animate-fade-in" style={{ animationDelay: "600ms", animationFillMode: "backwards" }}>
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
              <Crown className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Suas cotas acabaram!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Faça upgrade ou adquira cotas avulsas para continuar criando.
              </p>
            </div>
            <button
              onClick={() => navigate("/profile?tab=billing")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
            >
              <Crown className="h-3.5 w-3.5" /> Ver planos
            </button>
          </div>
        </section>
      )}

      {/* ── Mode cards ── */}
      <section className="mb-6">
        <div className="rounded-xl border bg-card p-5 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Modos disponíveis
              </p>
              <InfoTooltip content="Cada modo consome uma quantidade diferente de cotas. Escolha o modo adequado para sua necessidade." />
            </div>
            {noQuota && (
              <button
                onClick={() => navigate("/profile?tab=billing")}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Adquirir cotas →
              </button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODES.map((mode, i) => (
              <div key={mode.title} className="animate-fade-in" style={{ animationDelay: `${700 + i * 100}ms`, animationFillMode: "backwards" }}>
                <ModeActionCard
                  {...mode}
                  creditsRemaining={creditsRemaining}
                  disabled={noQuota}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick access + Referral ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: "1100ms", animationFillMode: "backwards" }}>
        <div className="rounded-xl border bg-card p-5 shadow-md space-y-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Acesso rápido
          </p>
          <QuickActionCard
            title="Minha memória"
            description="Veja prompts e specs salvos"
            icon={BarChart3}
            href="/memory"
            accent="text-secondary"
          />
          <QuickActionCard
            title="Histórico de sessões"
            description={`${stats?.total_sessions ?? 0} sessões realizadas`}
            icon={Clock}
            href="/history"
            accent="text-accent"
          />
        </div>

        <ReferralBonusCard bonusCredits={bonusRemaining} orgId={orgId} />
      </section>
    </AppShell>
  );
}
