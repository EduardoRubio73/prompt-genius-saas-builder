import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronUp, Sparkles, FileCode, Layers, CheckCircle, Clock, Eye, ArrowLeft, Hammer, Zap, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { DashboardDock } from "@/components/dashboard/DashboardDock";
import { ShareModal } from "@/components/dashboard/ShareModal";
import { UnifiedMemoryDetailDialog } from "@/components/UnifiedMemoryDetailDialog";
import type { UnifiedMemoryEntry } from "@/hooks/useUnifiedMemory";
import { useQuotaBalance } from "@/hooks/useQuotaBalance";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Session {
  id: string;
  mode: "prompt" | "saas" | "misto" | "build";
  raw_input: string | null;
  completed: boolean;
  tokens_total: number;
  created_at: string;
  updated_at: string;
  has_output?: boolean;
}

const MODE_META: Record<string, { label: string; icon: React.ElementType; cls: string; route: string }> = {
  prompt: { label: "Prompt", icon: Sparkles, cls: "text-primary", route: "/prompt" },
  saas: { label: "SaaS Spec", icon: FileCode, cls: "text-accent", route: "/saas-spec" },
  misto: { label: "Misto", icon: Layers, cls: "text-secondary", route: "/mixed" },
  build: { label: "Build", icon: Hammer, cls: "text-warning", route: "/build" },
};

const MODE_COSTS: Record<string, number> = { prompt: 1, saas: 2, misto: 2, build: 5 };

function getDuration(created: string, updated: string): string {
  const diff = new Date(updated).getTime() - new Date(created).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins} min`;
  return `${(mins / 60).toFixed(1)}h`;
}

function SessionCard({ session, onView, onDelete }: { session: Session; onView: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const meta = MODE_META[session.mode] ?? MODE_META.prompt;
  const Icon = meta.icon;
  const longInput = (session.raw_input?.length ?? 0) > 100;
  const isFinished = session.completed || session.has_output;

  return (
    <div className="rounded-xl border border-border/60 bg-card/80 p-4 transition-colors hover:border-border">
      <div className="flex items-center gap-3 flex-wrap">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted", meta.cls)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={cn("text-xs font-bold uppercase tracking-wider", meta.cls)}>{meta.label}</span>
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
            isFinished
              ? "border-primary/20 bg-primary/10 text-primary"
              : "border-warning/20 bg-warning/10 text-warning"
          )}>
            {isFinished ? <><CheckCircle className="h-3 w-3" /> Finalizada</> : <><Clock className="h-3 w-3" /> Em andamento</>}
          </span>
          {session.raw_input && (
            <p className="text-xs text-muted-foreground truncate flex-1 min-w-0 hidden sm:block">
              {session.raw_input.slice(0, 100)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
          <span className="tabular-nums">{MODE_COSTS[session.mode] ?? 1} crédito{(MODE_COSTS[session.mode] ?? 1) !== 1 ? "s" : ""}</span>
          <span>{formatDistanceToNow(new Date(session.created_at), { addSuffix: true, locale: ptBR })}</span>
          <span className="text-[10px] opacity-60">{getDuration(session.created_at, session.updated_at)}</span>
          <button
            onClick={onView}
            className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Eye className="h-3 w-3" /> Ver
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1 rounded-lg border border-destructive/30 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Excluir sessão"
          >
            <Trash2 className="h-3 w-3" />
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
  const { data: quota } = useQuotaBalance(orgId);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState<"all" | "prompt" | "saas" | "misto" | "build">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "incomplete">("all");
  const [shareOpen, setShareOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<UnifiedMemoryEntry | null>(null);
  const [entryLoading, setEntryLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

      const rawSessions = (data as Session[]) ?? [];

      const sessionIds = rawSessions.map((s) => s.id);
      
      const [{ data: prompts }, { data: specs }, { data: builds }] = await Promise.all([
        supabase.from("prompt_memory").select("session_id").in("session_id", sessionIds),
        supabase.from("saas_specs").select("session_id").in("session_id", sessionIds),
        supabase.from("build_projects").select("session_id").in("session_id", sessionIds),
      ]);

      const outputSessionIds = new Set([
        ...(prompts ?? []).map((p) => p.session_id),
        ...(specs ?? []).map((s) => s.session_id),
        ...(builds ?? []).map((b) => b.session_id),
      ]);

      const enriched = rawSessions.map((s) => ({
        ...s,
        has_output: outputSessionIds.has(s.id),
      }));

      setSessions(enriched);
      setIsLoading(false);
    };
    fetchSessions();
  }, [orgId]);

  const filtered = useMemo(() => {
    let result = sessions;
    if (modeFilter !== "all") result = result.filter((s) => s.mode === modeFilter);
    if (statusFilter === "completed") result = result.filter((s) => s.completed || s.has_output);
    if (statusFilter === "incomplete") result = result.filter((s) => !s.completed && !s.has_output);
    return result;
  }, [sessions, modeFilter, statusFilter]);

  const completedCount = sessions.filter((s) => s.completed || s.has_output).length;
  const totalTokens = sessions.reduce((sum, s) => sum + s.tokens_total, 0);

  const quotaInfo = useMemo(() => {
    if (modeFilter === "all" || !quota) return null;
    const cost = MODE_COSTS[modeFilter] ?? 1;
    const remaining = quota.total_remaining ?? 0;
    const maxActions = Math.floor(remaining / cost);
    return { maxActions, label: MODE_META[modeFilter]?.label ?? modeFilter, remaining };
  }, [modeFilter, quota]);

  const handleView = async (session: Session) => {
    setEntryLoading(true);
    setDetailOpen(true);
    setSelectedEntry(null);

    try {
      if (session.mode === "prompt" || session.mode === "misto") {
        const { data } = await supabase
          .from("prompt_memory")
          .select("id, categoria, especialidade, rating, prompt_gerado, created_at, tags, persona, tarefa, objetivo, contexto, formato, restricoes, referencias, destino, session_id, is_favorite")
          .eq("session_id", session.id)
          .maybeSingle();

        if (data) {
          setSelectedEntry({
            id: data.id,
            type: data.categoria === "misto" ? "mixed" : "prompt",
            title: data.especialidade || data.categoria || "Prompt sem título",
            preview: data.prompt_gerado?.slice(0, 120) || "",
            fullContent: data.prompt_gerado || "",
            rating: data.rating,
            is_favorite: data.is_favorite ?? false,
            tags: data.tags,
            categoria: data.categoria,
            created_at: data.created_at ?? session.created_at,
            especialidade: data.especialidade,
            persona: data.persona,
            tarefa: data.tarefa,
            objetivo: data.objetivo,
            contexto: data.contexto,
            formato: data.formato,
            restricoes: data.restricoes,
            referencias: data.referencias,
            destino: data.destino,
            session_id: data.session_id,
          });
          return;
        }
      }

      if (session.mode === "saas") {
        const { data } = await supabase
          .from("saas_specs")
          .select("id, project_name, spec_md, rating, created_at, is_favorite, answers, session_id")
          .eq("session_id", session.id)
          .maybeSingle();

        if (data) {
          setSelectedEntry({
            id: data.id,
            type: "saas",
            title: data.project_name || "Spec sem título",
            preview: data.spec_md?.slice(0, 120) || "",
            fullContent: data.spec_md || "",
            rating: data.rating,
            is_favorite: data.is_favorite ?? false,
            tags: null,
            categoria: "SaaS Spec",
            created_at: data.created_at ?? session.created_at,
            project_name: data.project_name,
            answers: data.answers as Record<string, unknown> | null,
            session_id: data.session_id,
          });
          return;
        }
      }

      if (session.mode === "build") {
        const { data } = await supabase
          .from("build_projects")
          .select("id, project_name, answers, outputs, rating, created_at, is_favorite, session_id")
          .eq("session_id", session.id)
          .maybeSingle();

        if (data) {
          const outputs = data.outputs as Record<string, string> | null;
          const fullContent = outputs ? Object.values(outputs).filter(Boolean).join("\n\n---\n\n") : "";
          setSelectedEntry({
            id: data.id,
            type: "build",
            title: data.project_name || "Projeto sem título",
            preview: fullContent.slice(0, 120),
            fullContent,
            rating: data.rating,
            is_favorite: data.is_favorite ?? false,
            tags: null,
            categoria: "Build",
            created_at: data.created_at ?? session.created_at,
            project_name: data.project_name,
            answers: data.answers as Record<string, unknown> | null,
            session_id: data.session_id,
          });
          return;
        }
      }

      // Fallback: no linked output found
      setSelectedEntry({
        id: session.id,
        type: session.mode === "misto" ? "mixed" : (session.mode as any),
        title: MODE_META[session.mode]?.label ?? "Sessão",
        preview: session.raw_input?.slice(0, 120) || "",
        fullContent: session.raw_input || "Nenhum resultado encontrado para esta sessão.",
        rating: null,
        is_favorite: false,
        tags: null,
        categoria: null,
        created_at: session.created_at,
        session_id: session.id,
      });
    } finally {
      setEntryLoading(false);
    }
  };

  const handleToggleFavorite = async (entry: UnifiedMemoryEntry) => {
    const table = entry.type === "build" ? "build_projects"
      : entry.type === "saas" ? "saas_specs"
      : "prompt_memory";
    const newVal = !entry.is_favorite;
    await supabase.from(table).update({ is_favorite: newVal }).eq("id", entry.id);
    setSelectedEntry((prev) => prev ? { ...prev, is_favorite: newVal } : prev);
  };

  const handleDeleteEntry = async (entry: UnifiedMemoryEntry) => {
    const table = entry.type === "build" ? "build_projects"
      : entry.type === "saas" ? "saas_specs"
      : "prompt_memory";
    await supabase.from(table).delete().eq("id", entry.id);
    setDetailOpen(false);
    setSelectedEntry(null);
    toast.success("Entrada removida.");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const { error } = await supabase.from("sessions").delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error("Erro ao excluir sessão. Tente novamente.");
    } else {
      setSessions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast.success("Sessão excluída com sucesso.");
    }
    setIsDeleting(false);
    setDeleteTarget(null);
  };

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
            <span className="px-2 py-1 rounded-full bg-muted font-medium">{completedCount} finalizadas</span>
            <span className="px-2 py-1 rounded-full bg-muted font-medium">{totalTokens.toLocaleString("pt-BR")} tokens</span>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="mb-4 flex items-center gap-2 flex-wrap">
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
            {s === "all" ? "Todas" : s === "completed" ? "✓ Finalizadas" : "⏳ Em andamento"}
          </button>
        ))}
      </section>

      {/* Dynamic Quota Badge */}
      {quotaInfo && (
        <section className="mb-4">
          <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">
              Com seu saldo atual, você pode gerar até{" "}
              <span className="font-bold text-foreground">{quotaInfo.maxActions}</span>{" "}
              {quotaInfo.label}{quotaInfo.maxActions !== 1 ? "s" : ""}
            </span>
            <span className="text-muted-foreground/60">
              ({quotaInfo.remaining} cotas restantes)
            </span>
          </div>
        </section>
      )}

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
            <SessionCard key={session.id} session={session} onView={() => handleView(session)} onDelete={() => setDeleteTarget(session)} />
          ))}
        </div>
      )}

      <DashboardDock sessionCount={sessions.length} onShareOpen={() => setShareOpen(true)} />
      <ShareModal open={shareOpen} onOpenChange={setShareOpen} orgId={orgId} />

      <UnifiedMemoryDetailDialog
        entry={selectedEntry}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeleteEntry}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sessão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta sessão? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
