import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronUp, Sparkles, FileCode, Layers, CheckCircle, Clock, Eye, ArrowLeft, Hammer } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { DashboardDock } from "@/components/dashboard/DashboardDock";
import { ShareModal } from "@/components/dashboard/ShareModal";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Session {
  id: string;
  mode: "prompt" | "saas" | "misto" | "build";
  raw_input: string | null;
  completed: boolean;
  tokens_total: number;
  created_at: string;
  updated_at: string;
}

const MODE_META: Record<string, { label: string; icon: React.ElementType; cls: string; route: string }> = {
  prompt: { label: "Prompt", icon: Sparkles, cls: "text-primary", route: "/prompt" },
  saas: { label: "SaaS Spec", icon: FileCode, cls: "text-accent", route: "/saas-spec" },
  misto: { label: "Misto", icon: Layers, cls: "text-secondary", route: "/mixed" },
  build: { label: "Build", icon: Hammer, cls: "text-warning", route: "/build" },
};

function getDuration(created: string, updated: string): string {
  const diff = new Date(updated).getTime() - new Date(created).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins} min`;
  return `${(mins / 60).toFixed(1)}h`;
}

function SessionCard({ session }: { session: Session }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const meta = MODE_META[session.mode] ?? MODE_META.prompt;
  const Icon = meta.icon;
  const longInput = (session.raw_input?.length ?? 0) > 100;

  return (
    <div className="rounded-xl border border-border/60 bg-card/80 p-4 transition-colors hover:border-border">
      <div className="flex items-center gap-3 flex-wrap">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted", meta.cls)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={cn("text-xs font-bold uppercase tracking-wider", meta.cls)}>{meta.label}</span>
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
            session.completed
              ? "border-primary/20 bg-primary/10 text-primary"
              : "border-warning/20 bg-warning/10 text-warning"
          )}>
            {session.completed ? <><CheckCircle className="h-3 w-3" /> Concluída</> : <><Clock className="h-3 w-3" /> Incompleta</>}
          </span>
          {session.raw_input && (
            <p className="text-xs text-muted-foreground truncate flex-1 min-w-0 hidden sm:block">
              {session.raw_input.slice(0, 100)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
          <span className="tabular-nums">{session.tokens_total.toLocaleString("pt-BR")} tok</span>
          <span>{formatDistanceToNow(new Date(session.created_at), { addSuffix: true, locale: ptBR })}</span>
          <span className="text-[10px] opacity-60">{getDuration(session.created_at, session.updated_at)}</span>
          <button
            onClick={() => navigate(`${meta.route}?session=${session.id}`)}
            className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Eye className="h-3 w-3" /> Ver
          </button>
          {longInput && (
            <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground transition-colors">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
      {expanded && session.raw_input && (
        <div className="mt-3 rounded-lg bg-muted/50 p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
          {session.raw_input}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const orgId = profile?.personal_org_id ?? undefined;
  

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState<"all" | "prompt" | "saas" | "misto" | "build">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "incomplete">("all");
  const [shareOpen, setShareOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "incomplete">("all");

  useEffect(() => {
    if (!orgId) return;
    const fetchSessions = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from("sessions")
        .select("id, mode, raw_input, completed, tokens_total, created_at, updated_at")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(50);
      setSessions((data as Session[]) ?? []);
      setIsLoading(false);
    };
    fetchSessions();
  }, [orgId]);

  const filtered = useMemo(() => {
    let result = sessions;
    if (modeFilter !== "all") result = result.filter((s) => s.mode === modeFilter);
    if (statusFilter === "completed") result = result.filter((s) => s.completed);
    if (statusFilter === "incomplete") result = result.filter((s) => !s.completed);
    return result;
  }, [sessions, modeFilter, statusFilter]);

  const completedCount = sessions.filter((s) => s.completed).length;
  const totalTokens = sessions.reduce((sum, s) => sum + s.tokens_total, 0);

  return (
    <AppShell
      userName={profile?.full_name}
      userEmail={profile?.email}
      avatarUrl={profile?.avatar_url}
      onSignOut={signOut}
    >
      {/* Header */}
      <section className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Voltar ao dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Histórico</h1>
              <p className="text-sm text-muted-foreground mt-1">Suas sessões de geração</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded-full bg-muted font-medium">{sessions.length} sessões</span>
            <span className="px-2 py-1 rounded-full bg-muted font-medium">{completedCount} concluídas</span>
            <span className="px-2 py-1 rounded-full bg-muted font-medium">{totalTokens.toLocaleString("pt-BR")} tokens</span>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="mb-6 flex items-center gap-2 flex-wrap">
        {(["all", "prompt", "saas", "misto", "build"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setModeFilter(m)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              modeFilter === m ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            {m === "all" ? "Todas" : MODE_META[m]?.label ?? m}
          </button>
        ))}
        <div className="w-px h-5 bg-border mx-1" />
        {(["all", "completed", "incomplete"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-medium border transition-colors",
              statusFilter === s ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted/50"
            )}
          >
            {s === "all" ? "Todas" : s === "completed" ? "✓ Concluídas" : "⏳ Incompletas"}
          </button>
        ))}
      </section>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Clock className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-sm font-medium text-muted-foreground">Nenhuma sessão encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
