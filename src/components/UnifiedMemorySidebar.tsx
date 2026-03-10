import { useState } from "react";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  Crown,
  Clock,
  Heart,
  Search,
  X,
  Star,
  Sparkles,
  FileCode,
  Layers,
  Rocket,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
// Badge removed — not currently used
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUnifiedMemory, type UnifiedMemoryEntry, type MemoryMode } from "@/hooks/useUnifiedMemory";
import { UnifiedMemoryDetailDialog } from "@/components/UnifiedMemoryDetailDialog";
import type { PromptInputs } from "@/lib/prompt-builder";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface UnifiedMemorySidebarProps {
  refreshKey?: number;
  orgId?: string;
  onUseAsBase?: (data: PromptInputs) => void;
  /** Lock the mode tab — pass the current page mode to pre-filter */
  defaultMode?: "all" | MemoryMode;
}

// ── Constants ────────────────────────────────────────────────────────────────

const MODE_TABS: { value: "all" | MemoryMode; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "Todos", icon: Brain },
  { value: "prompt", label: "Prompts", icon: Sparkles },
  { value: "saas", label: "Specs", icon: FileCode },
  { value: "mixed", label: "Misto", icon: Layers },
  { value: "build", label: "Build", icon: Rocket },
];

const FILTER_TABS = [
  { value: "gold" as const, label: "Ouro", icon: Crown },
  { value: "favorites" as const, label: "Favoritos", icon: Heart },
  { value: "all" as const, label: "Todos", icon: Clock },
];

const TYPE_COLORS: Record<MemoryMode, string> = {
  prompt: "text-primary bg-primary/10 border-primary/20",
  saas: "text-accent bg-accent/10 border-accent/20",
  mixed: "text-secondary bg-secondary/10 border-secondary/20",
  build: "text-orange-500 bg-orange-500/10 border-orange-500/20",
};

const TYPE_ICONS: Record<MemoryMode, React.ElementType> = {
  prompt: Sparkles,
  saas: FileCode,
  mixed: Layers,
  build: Rocket,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function EntryCard({
  entry,
  onClick,
  onFavorite,
  onDelete,
}: {
  entry: UnifiedMemoryEntry;
  onClick: () => void;
  onFavorite: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const TypeIcon = TYPE_ICONS[entry.type];
  const timeAgo = (date: string | null) => {
    if (!date) return "";
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative p-3 rounded-xl border cursor-pointer transition-all duration-200",
        "bg-card/60 border-border/60",
        "hover:bg-card hover:border-border hover:shadow-md hover:shadow-black/5",
        "dark:hover:shadow-black/20",
        "active:scale-[0.99]"
      )}
    >
      {/* Top row: type badge + rating + time */}
      <div className="flex items-center justify-between mb-2 gap-1">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider",
            TYPE_COLORS[entry.type]
          )}
        >
          <TypeIcon className="w-2.5 h-2.5" />
          {entry.type === "prompt" ? "Prompt" : entry.type === "saas" ? "Spec" : entry.type === "build" ? "Build" : "Misto"}
        </span>

        <div className="flex items-center gap-1.5 ml-auto">
          {entry.rating === 5 && <Crown className="w-3 h-3 text-warning shrink-0" />}
          {entry.rating && (
            <div className="flex gap-px">
              {Array.from({ length: Math.min(entry.rating, 5) }).map((_, i) => (
                <Star key={i} className="w-2 h-2 text-warning fill-warning" />
              ))}
            </div>
          )}
          <span className="text-[9px] text-muted-foreground tabular-nums" title={timeAgo(entry.created_at)}>
            {entry.created_at ? new Date(entry.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " " + new Date(entry.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
          </span>
        </div>
      </div>

      {/* Title */}
      <p className="text-[11px] font-semibold text-foreground/90 truncate mb-1 leading-tight">
        {entry.title}
      </p>

      {/* Preview */}
      <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed font-mono">
        {entry.preview}
      </p>

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {entry.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/8 text-primary/70 border border-primary/15 font-medium"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Hover actions */}
      <div
        className={cn(
          "absolute top-2 right-2 flex items-center gap-1",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onFavorite}
                className={cn(
                  "p-1 rounded-md transition-colors",
                  entry.is_favorite
                    ? "text-rose-500 bg-rose-500/10 hover:bg-rose-500/20"
                    : "text-muted-foreground bg-secondary/80 hover:text-rose-400"
                )}
              >
                <Heart className="w-3 h-3" fill={entry.is_favorite ? "currentColor" : "none"} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              {entry.is_favorite ? "Remover favorito" : "Favoritar"}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onDelete}
                className="p-1 rounded-md text-muted-foreground bg-secondary/80 hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">Excluir</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function UnifiedMemorySidebar({
  refreshKey = 0,
  orgId,
  onUseAsBase,
  defaultMode = "all",
}: UnifiedMemorySidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState<"all" | "gold" | "favorites">("all");
  const [activeMode, setActiveMode] = useState<"all" | MemoryMode>(defaultMode);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<UnifiedMemoryEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { entries, isLoading, toggleFavorite, deleteEntry, counts } = useUnifiedMemory({
    refreshKey,
    filter,
    activeMode,
    searchQuery,
    orgId,
  });

  const handleFavorite = async (entry: UnifiedMemoryEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite(entry);
  };

  const handleDelete = async (entry: UnifiedMemoryEntry, e?: React.MouseEvent) => {
    e?.stopPropagation();
    await deleteEntry(entry);
  };

  return (
    <>
      <aside
        className={cn(
          "flex flex-col shrink-0 border-l border-border bg-card/40 backdrop-blur-sm",
          "transition-all duration-300 ease-in-out overflow-hidden",
          collapsed ? "w-12" : "w-80"
        )}
      >
        {/* ── Header ── */}
        <div className="p-3 border-b border-border flex items-center gap-2 shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Brain className="w-4 h-4 text-primary shrink-0" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider truncate">
                Memória
              </h3>
              {counts.all > 0 && (
                <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary tabular-nums">
                  {counts.all}
                </span>
              )}
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors ml-auto shrink-0"
          >
            {collapsed ? (
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {!collapsed && (
          <>
            {/* ── Mode tabs ── */}
            <div className="px-2 pt-2 pb-1 border-b border-border shrink-0">
              <div className="flex gap-1 p-0.5 rounded-lg bg-secondary/50 overflow-x-auto">
                {MODE_TABS.map(({ value, label, icon: Icon }) => {
                  const count = value === "all" ? counts.all
                    : value === "prompt" ? counts.prompt
                    : value === "saas" ? counts.saas
                    : value === "mixed" ? (counts as any).mixed ?? 0
                    : value === "build" ? (counts as any).build ?? 0
                    : 0;
                  return (
                    <button
                      key={value}
                      onClick={() => setActiveMode(value)}
                      className={cn(
                        "shrink-0 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-[9px] font-semibold whitespace-nowrap transition-all duration-150",
                        activeMode === value
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="w-3 h-3 shrink-0" />
                      <span>{label}</span>
                      {count > 0 && (
                        <span className="text-[8px] opacity-60 tabular-nums">({count})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Filter pills ── */}
            <div className="px-3 py-2 border-b border-border flex gap-1 shrink-0">
              {FILTER_TABS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 text-[10px] rounded-lg font-semibold transition-all duration-150",
                    filter === value && value === "gold"
                      ? "bg-warning/10 text-warning"
                      : filter === value && value === "favorites"
                      ? "bg-rose-500/10 text-rose-500"
                      : filter === value
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                  {value === "favorites" && counts.favorites > 0 && (
                    <span className="text-[8px] opacity-70">({counts.favorites})</span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Search ── */}
            <div className="px-3 py-2 border-b border-border shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  placeholder="Buscar memórias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-[11px] pl-8 pr-8 bg-secondary/40 border-border/60 focus:bg-secondary/80"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* ── Entry list ── */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {isLoading && (
                <div className="space-y-2 p-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-xl bg-secondary/30 animate-pulse" />
                  ))}
                </div>
              )}

              {!isLoading && entries.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Brain className="w-8 h-8 text-muted-foreground/30 mb-3" />
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {searchQuery
                      ? "Nenhum resultado encontrado."
                      : filter === "gold"
                      ? "Nenhum item com 5 estrelas ainda."
                      : filter === "favorites"
                      ? "Nenhum favorito salvo."
                      : "Nenhuma memória salva ainda."}
                  </p>
                  {!searchQuery && (
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      Gere seu primeiro conteúdo para começar.
                    </p>
                  )}
                </div>
              )}

              {!isLoading &&
                entries.map((entry) => (
                  <EntryCard
                    key={`${entry.type}-${entry.id}`}
                    entry={entry}
                    onClick={() => {
                      setSelectedEntry(entry);
                      setDialogOpen(true);
                    }}
                    onFavorite={(e) => handleFavorite(entry, e)}
                    onDelete={(e) => handleDelete(entry, e)}
                  />
                ))}
            </div>

            {/* ── Footer summary ── */}
            {!isLoading && counts.all > 0 && (
              <div className="px-3 py-2 border-t border-border shrink-0">
                <p className="text-[9px] text-muted-foreground text-center tabular-nums">
                  {counts.prompt} prompt{counts.prompt !== 1 ? "s" : ""} ·{" "}
                  {counts.saas} spec{counts.saas !== 1 ? "s" : ""} ·{" "}
                  {counts.build} build{counts.build !== 1 ? "s" : ""} ·{" "}
                  {counts.favorites} favorito{counts.favorites !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </>
        )}

        {/* Collapsed: show icon indicators */}
        {collapsed && (
          <div className="flex flex-col items-center gap-3 p-2 pt-3">
            <TooltipProvider>
              {[
                { icon: Sparkles, count: counts.prompt, label: "Prompts", color: "text-primary" },
                { icon: FileCode, count: counts.saas, label: "Specs", color: "text-accent" },
                { icon: Rocket, count: counts.build, label: "Builds", color: "text-orange-500" },
                { icon: Heart, count: counts.favorites, label: "Favoritos", color: "text-rose-400" },
              ].map(({ icon: Icon, count, label, color }) => (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Icon className={cn("w-4 h-4", color)} />
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-primary text-primary-foreground rounded-full w-3.5 h-3.5 flex items-center justify-center tabular-nums leading-none">
                          {count > 9 ? "9+" : count}
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">
                    {count} {label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        )}
      </aside>

      {/* ── Detail Dialog ── */}
      <UnifiedMemoryDetailDialog
        entry={selectedEntry}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUseAsBase={onUseAsBase}
        onToggleFavorite={async (entry) => {
          await toggleFavorite(entry);
          // update selected entry state
          setSelectedEntry((prev) =>
            prev?.id === entry.id ? { ...prev, is_favorite: !entry.is_favorite } : prev
          );
        }}
        onDelete={async (entry) => {
          await deleteEntry(entry);
          setDialogOpen(false);
        }}
      />
    </>
  );
}
