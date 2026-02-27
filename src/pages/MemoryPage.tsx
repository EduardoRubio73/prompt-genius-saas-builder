import { useState } from "react";
import { Search, Brain, Star, Heart, Filter, Sparkles, FileCode, Layers, Crown, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTokenBudget } from "@/hooks/useOrgStats";
import { useUnifiedMemory, type UnifiedMemoryEntry } from "@/hooks/useUnifiedMemory";
import { UnifiedMemoryDetailDialog } from "@/components/UnifiedMemoryDetailDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const MODE_META: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  prompt: { label: "Prompt", icon: Sparkles, cls: "bg-primary/10 text-primary border-primary/20" },
  saas: { label: "Spec", icon: FileCode, cls: "bg-accent/10 text-accent border-accent/20" },
  mixed: { label: "Misto", icon: Layers, cls: "bg-secondary/10 text-secondary border-secondary/20" },
};

function MemoryCard({
  entry,
  onToggleFavorite,
  onDelete,
  onClick,
}: {
  entry: UnifiedMemoryEntry;
  onToggleFavorite: (e: UnifiedMemoryEntry) => void;
  onDelete: (e: UnifiedMemoryEntry) => void;
  onClick: () => void;
}) {
  const meta = MODE_META[entry.type] ?? MODE_META.prompt;
  const Icon = meta.icon;
  const timeAgo = entry.created_at
    ? formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: ptBR })
    : "";

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col gap-2 rounded-xl border border-border/60 bg-card/80 p-4 text-left transition-all hover:border-border hover:bg-card hover:shadow-md"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", meta.cls)}>
          <Icon className="h-3 w-3" /> {meta.label}
        </span>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          {entry.rating === 5 && <Crown className="h-3 w-3 text-warning" />}
          {entry.rating != null && (
            <span className="flex items-center gap-0.5">
              {"★".repeat(entry.rating)}{"☆".repeat(5 - entry.rating)}
            </span>
          )}
          <span className="ml-1">{timeAgo}</span>
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-foreground line-clamp-1">{entry.title}</p>

      {/* Preview */}
      <p className="text-xs text-muted-foreground font-mono line-clamp-2">{entry.preview}</p>

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {entry.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{tag}</span>
          ))}
        </div>
      )}

      {/* Hover actions */}
      <div className="absolute top-3 right-3 hidden gap-1 group-hover:flex">
        <span
          role="button"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(entry); }}
          className={cn("flex h-7 w-7 items-center justify-center rounded-lg border bg-background text-xs transition-colors hover:bg-muted",
            entry.is_favorite ? "text-destructive border-destructive/30" : "text-muted-foreground border-border")}
        >
          <Heart className={cn("h-3.5 w-3.5", entry.is_favorite && "fill-current")} />
        </span>
        <span
          role="button"
          onClick={(e) => { e.stopPropagation(); onDelete(entry); }}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground text-xs transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}

export default function MemoryPage() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const orgId = profile?.personal_org_id ?? undefined;
  const { data: budget } = useTokenBudget(orgId);

  const [activeMode, setActiveMode] = useState<"all" | "prompt" | "saas" | "mixed">("all");
  const [filter, setFilter] = useState<"all" | "gold" | "favorites">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<UnifiedMemoryEntry | null>(null);

  const { entries, isLoading, counts, toggleFavorite, deleteEntry } = useUnifiedMemory({
    refreshKey,
    filter,
    activeMode,
    searchQuery,
    orgId,
  });

  const handleToggleFav = async (entry: UnifiedMemoryEntry) => {
    await toggleFavorite(entry);
    toast.success(entry.is_favorite ? "Removido dos favoritos" : "Adicionado aos favoritos");
  };

  const handleDelete = async (entry: UnifiedMemoryEntry) => {
    await deleteEntry(entry);
    toast.success("Item excluído");
    setRefreshKey((k) => k + 1);
  };

  const modeTabs: { key: typeof activeMode; label: string; icon: string; count: number }[] = [
    { key: "all", label: "Todos", icon: "🧠", count: counts.all },
    { key: "prompt", label: "Prompts", icon: "✨", count: counts.prompt },
    { key: "saas", label: "Specs", icon: "📄", count: counts.saas },
  ];

  const filterPills: { key: typeof filter; label: string; icon?: React.ElementType }[] = [
    { key: "all", label: "Todos" },
    { key: "gold", label: "⭐ 5 estrelas" },
    { key: "favorites", label: "❤️ Favoritos" },
  ];

  return (
    <AppShell
      userName={profile?.full_name}
      userEmail={profile?.email}
      avatarUrl={profile?.avatar_url}
      tokenConsumed={budget?.consumed ?? 0}
      tokenTotal={budget?.limit_total ?? 10000}
      onSignOut={signOut}
    >
      {/* Header */}
      <section className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Memória</h1>
            <p className="text-sm text-muted-foreground mt-1">Todos os seus prompts e specs salvos</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded-full bg-muted font-medium">{counts.all} itens</span>
            <span className="px-2 py-1 rounded-full bg-muted font-medium">{counts.favorites} ❤️</span>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="mb-6 space-y-3">
        {/* Mode tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          {modeTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveMode(tab.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                activeMode === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {tab.icon} {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Filters + search */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {filterPills.map((fp) => (
            <button
              key={fp.key}
              onClick={() => setFilter(fp.key)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-medium border transition-colors",
                filter === fp.key
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-muted/50"
              )}
            >
              {fp.label}
            </button>
          ))}
          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="h-8 w-48 rounded-lg border border-border/60 bg-muted/30 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </section>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Brain className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            {filter === "favorites" ? "Nenhum favorito ainda" : filter === "gold" ? "Nenhum item 5 estrelas" : "Nenhum item na memória"}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">Gere prompts ou specs para vê-los aqui</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <MemoryCard
              key={entry.id}
              entry={entry}
              onToggleFavorite={handleToggleFav}
              onDelete={handleDelete}
              onClick={() => setSelectedEntry(entry)}
            />
          ))}
        </div>
      )}

      <UnifiedMemoryDetailDialog
        entry={selectedEntry}
        open={!!selectedEntry}
        onOpenChange={(open) => !open && setSelectedEntry(null)}
        onToggleFavorite={handleToggleFav}
        onDelete={(e) => { handleDelete(e); setSelectedEntry(null); }}
      />
    </AppShell>
  );
}
