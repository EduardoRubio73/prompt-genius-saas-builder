import { Sparkles, FileCode, Layers } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ModeCard } from "@/components/dashboard/ModeCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useOrgStats, useTokenBudget } from "@/hooks/useOrgStats";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const modes = [
  {
    title: "Modo Prompt",
    description: "Gerar e refinar prompts com IA. Transforme ideias vagas em instruções precisas para qualquer LLM.",
    icon: Sparkles,
    tags: ["Few-shot", "Chain-of-Thought", "Multi-plataforma"],
    href: "/prompt",
    accentClass: "text-primary",
    glowColor: "hsla(254, 96%, 67%, 0.15)",
  },
  {
    title: "Modo SaaS Spec",
    description: "Especificação técnica completa. Gere documentação pronta para desenvolvimento do seu SaaS.",
    icon: FileCode,
    tags: ["Stack", "Banco de dados", "Arquitetura"],
    href: "/saas-spec",
    accentClass: "text-accent",
    glowColor: "hsla(220, 80%, 56%, 0.15)",
  },
  {
    title: "Modo Misto",
    description: "Prompt → Spec em um fluxo. Combine geração de prompt com especificação técnica automatizada.",
    icon: Layers,
    tags: ["End-to-end", "Automatizado", "Completo"],
    href: "/mixed",
    accentClass: "text-secondary",
    glowColor: "hsla(160, 100%, 45%, 0.15)",
  },
] as const;

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const orgId = profile?.personal_org_id ?? undefined;
  const { data: stats, isLoading: statsLoading } = useOrgStats(orgId);
  const { data: budget } = useTokenBudget(orgId);

  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const isLoading = profileLoading || statsLoading;

  return (
    <AppShell
      userName={profile?.full_name}
      orgName={profile?.full_name}
      tokenConsumed={budget?.consumed ?? 0}
      tokenTotal={budget?.limit_total ?? 10000}
      onSignOut={signOut}
    >
      {/* Greeting */}
      <section className="mb-10">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-48" />
          </div>
        ) : (
          <>
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              {getGreeting()}, {firstName || "criador"} ✨
            </h1>
            <p className="mt-1 text-muted-foreground">O que vamos construir hoje?</p>
          </>
        )}
      </section>

      {/* Mode cards */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {modes.map((mode) => (
          <ModeCard key={mode.title} {...mode} />
        ))}
      </section>

      {/* Stats footer */}
      <section className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
          </>
        ) : (
          <>
            <span>
              <strong className="text-foreground">{stats?.total_prompts ?? 0}</strong> prompts gerados
            </span>
            <span className="text-border">·</span>
            <span>
              <strong className="text-foreground">{stats?.total_saas_specs ?? 0}</strong> specs criadas
            </span>
            <span className="text-border">·</span>
            <span>
              <strong className="text-foreground">{stats?.total_sessions ?? 0}</strong> sessões
            </span>
          </>
        )}
      </section>
    </AppShell>
  );
}
