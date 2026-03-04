import { Sparkles, FileCode, Layers, TrendingUp, Clock, Star, ArrowRight, BarChart3, Crown, Rocket } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";
import { ModeCard } from "@/components/dashboard/ModeCard";
import { QuotaCard } from "@/components/dashboard/QuotaCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useOrgStats } from "@/hooks/useOrgStats";
import { useQuotaBalance } from "@/hooks/useQuotaBalance";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Modes config ─────────────────────────────────────────────────────────────

const modes = [
  {
    title: "Modo Prompt",
    description: "Transforme ideias vagas em instruções precisas para qualquer LLM com geração guiada por IA.",
    icon: Sparkles,
    tags: ["Few-shot", "Chain-of-Thought", "Multi-plataforma"],
    href: "/prompt",
    accentClass: "text-primary",
    glowColor: "hsla(254, 96%, 67%, 0.15)",
  },
  {
    title: "Modo SaaS Spec",
    description: "Gere documentação técnica completa, pronta para o desenvolvimento do seu produto.",
    icon: FileCode,
    tags: ["Stack", "Banco de dados", "Arquitetura"],
    href: "/saas-spec",
    accentClass: "text-accent",
    glowColor: "hsla(220, 80%, 56%, 0.15)",
  },
  {
    title: "Modo Misto",
    description: "Prompt → Spec em um único fluxo automatizado, do zero ao documento técnico.",
    icon: Layers,
    tags: ["End-to-end", "Automatizado", "Completo"],
    href: "/mixed",
    accentClass: "text-secondary",
    glowColor: "hsla(160, 100%, 45%, 0.15)",
  },
  {
    title: "BUILD Engine",
    description: "Transforme uma ideia em pacote deploy-ready: PRD, SQL, prompts e documentação completa.",
    icon: Rocket,
    tags: ["PRD", "SQL", "Deploy-ready"],
    href: "/build",
    accentClass: "text-primary",
    glowColor: "hsla(254, 96%, 67%, 0.15)",
  },
] as const;

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  accent = false,
  loading = false,
  sub,
  tip,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: boolean;
  loading?: boolean;
  sub?: string;
  tip?: string;
}) {
  const card = (
    <div className={cn(
      "glass-card flex flex-col gap-3 p-5",
      accent && "border-primary/30 bg-primary/5"
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          accent ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <div>
          <p className={cn("text-2xl font-bold tracking-tight", accent ? "text-primary" : "text-foreground")}>
            {value}
          </p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      )}
    </div>
  );

  if (!tip) return card;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{card}</TooltipTrigger>
      <TooltipContent><p className="text-xs">{tip}</p></TooltipContent>
    </Tooltip>
  );
}

// Removed UsageDetailCard - replaced by QuotaCard

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
      className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-border hover:shadow-sm text-left transition-all duration-200 group w-full"
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

// ── Dashboard Page ────────────────────────────────────────────────────────────

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

  const totalActions = (stats?.total_prompts ?? 0) + (stats?.total_saas_specs ?? 0);
  const avgRating = stats?.avg_prompt_rating ? Number(stats.avg_prompt_rating).toFixed(1) : "—";
  const noQuota = !isQuotaLoading && quota != null && (quota.credits_remaining ?? 0) <= 0;

  return (
    <AppShell
      userName={profile?.full_name}
      userEmail={profile?.email}
      avatarUrl={profile?.avatar_url}
      onSignOut={signOut}
    >

      {/* ── Greeting ───────────────────────────────────────────────────────── */}
      <section className="mb-8">
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
            {/* Plan badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/8 text-primary text-xs font-bold uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5" />
              Plano {quota?.plan_name ?? "Free"}
            </div>
          </div>
        )}
      </section>

      {/* ── Stats grid ─────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-3">
        <StatCard
          label="Prompts gerados"
          value={isLoading ? "—" : formatNumber(stats?.total_prompts ?? 0)}
          icon={Sparkles}
          loading={isLoading}
          sub={`${stats?.total_prompts ?? 0} total`}
          tip="Total de prompts gerados em todos os modos (Prompt, Misto, BUILD)"
        />
        <StatCard
          label="Specs criadas"
          value={isLoading ? "—" : formatNumber(stats?.total_saas_specs ?? 0)}
          icon={FileCode}
          loading={isLoading}
          sub={`${stats?.total_saas_specs ?? 0} total`}
          tip="Documentações técnicas SaaS geradas no modo SaaS Spec e Misto"
        />
        <StatCard
          label="Total de ações"
          value={isLoading ? "—" : formatNumber(totalActions)}
          icon={TrendingUp}
          accent
          loading={isLoading}
          sub="prompts + specs"
          tip="Soma de todas as gerações: prompts + specs técnicas"
        />
        <StatCard
          label="Média de rating"
          value={isLoading ? "—" : avgRating}
          icon={Star}
          loading={isLoading}
          sub={`${stats?.total_sessions ?? 0} sessões`}
          tip="Média das avaliações (1-5 estrelas) que você deu para os resultados gerados"
        />
      </section>

      {/* ── Usage + Quick actions ───────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
        <QuotaCard
          creditsUsed={quota?.credits_used ?? 0}
          creditsLimit={quota?.credits_limit ?? 0}
          creditsRemaining={quota?.credits_remaining ?? 0}
          percentUsed={Number(quota?.percent_used ?? 0)}
          loading={isQuotaLoading}
        />

        {/* Quick actions: last session + memory */}
        <div className="col-span-full sm:col-span-2 space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
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
      </section>

      {/* ── Upgrade banner when quotas exhausted ──────────────────────────── */}
      {noQuota && (
        <section className="mb-6">
          <div className="rounded-xl border border-warning/40 bg-warning/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
              <Crown className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Suas cotas acabaram!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Faça upgrade do seu plano ou adquira cotas avulsas para continuar criando.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => navigate("/profile?tab=billing")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Crown className="h-3.5 w-3.5" /> Ver planos
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Mode cards ─────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {noQuota ? "Cotas esgotadas — adquira mais para continuar" : "Escolha um modo para começar"}
          </p>
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
          {modes.map((mode) => (
            <ModeCard key={mode.title} {...mode} disabled={noQuota} />
          ))}
        </div>
      </section>

    </AppShell>
  );
}
