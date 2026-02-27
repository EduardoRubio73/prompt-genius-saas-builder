import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Crown,
  Copy,
  PlayCircle,
  Heart,
  HeartOff,
  Trash2,
  Sparkles,
  FileCode,
  Layers,
  User,
  Target,
  AlignLeft,
  Globe,
  Ban,
  BookOpen,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import type { UnifiedMemoryEntry } from "@/hooks/useUnifiedMemory";
import type { PromptInputs } from "@/lib/prompt-builder";

interface UnifiedMemoryDetailDialogProps {
  entry: UnifiedMemoryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseAsBase?: (data: PromptInputs) => void;
  onToggleFavorite?: (entry: UnifiedMemoryEntry) => void;
  onDelete?: (entry: UnifiedMemoryEntry) => void;
}

const TYPE_META = {
  prompt: {
    label: "Modo Prompt",
    icon: Sparkles,
    color: "text-primary",
    badgeCls: "bg-primary/10 text-primary border-primary/20",
  },
  saas: {
    label: "SaaS Spec",
    icon: FileCode,
    color: "text-accent",
    badgeCls: "bg-accent/10 text-accent border-accent/20",
  },
  mixed: {
    label: "Modo Misto",
    icon: Layers,
    color: "text-secondary",
    badgeCls: "bg-secondary/10 text-secondary border-secondary/20",
  },
};

const FIELD_META = [
  { key: "persona", label: "Persona", icon: User },
  { key: "tarefa", label: "Tarefa", icon: Briefcase },
  { key: "objetivo", label: "Objetivo", icon: Target },
  { key: "contexto", label: "Contexto", icon: AlignLeft },
  { key: "formato", label: "Formato", icon: Globe },
  { key: "restricoes", label: "Restrições", icon: Ban },
  { key: "referencias", label: "Referências", icon: BookOpen },
] as const;

export function UnifiedMemoryDetailDialog({
  entry,
  open,
  onOpenChange,
  onUseAsBase,
  onToggleFavorite,
  onDelete,
}: UnifiedMemoryDetailDialogProps) {
  if (!entry) return null;

  const meta = TYPE_META[entry.type];
  const ModeIcon = meta.icon;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(entry.fullContent);
    toast.success("Conteúdo copiado!");
  };

  const handleUseAsBase = () => {
    if (!onUseAsBase) return;
    onUseAsBase({
      especialidade: entry.especialidade || "",
      persona: entry.persona || "",
      tarefa: entry.tarefa || "",
      objetivo: entry.objetivo || "",
      contexto: entry.contexto || "",
      formato: entry.formato || "",
      restricoes: entry.restricoes || "",
      referencias: entry.referencias || "",
      destino: entry.destino || "",
    });
    onOpenChange(false);
    toast.success("Campos preenchidos com base na memória!");
  };

  const handleDelete = () => {
    onDelete?.(entry);
    onOpenChange(false);
    toast.success("Entrada removida da memória.");
  };

  const createdDate = entry.created_at
    ? new Date(entry.created_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // For SaaS specs, show answers as structured fields
  const saasAnswers =
    entry.type === "saas" && entry.answers
      ? Object.entries(entry.answers as Record<string, string>).filter(([, v]) => v)
      : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto gap-0 p-0">
        {/* ── Header ── */}
        <DialogHeader className="p-6 pb-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {/* Mode badge */}
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${meta.badgeCls}`}
              >
                <ModeIcon className="w-3 h-3" />
                {meta.label}
              </span>

              {entry.categoria && entry.type !== "saas" && (
                <Badge variant="secondary" className="text-xs">
                  {entry.categoria}
                </Badge>
              )}

              {entry.rating === 5 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20">
                  <Crown className="w-3 h-3" /> Ouro
                </span>
              )}
            </div>

            {/* Rating stars */}
            {entry.rating && (
              <div className="flex gap-px shrink-0">
                {Array.from({ length: entry.rating }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-warning fill-warning" />
                ))}
                {Array.from({ length: 5 - entry.rating }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-muted-foreground/30" />
                ))}
              </div>
            )}
          </div>

          <DialogTitle className="text-lg font-semibold mt-2">{entry.title}</DialogTitle>

          {createdDate && (
            <DialogDescription className="text-xs text-muted-foreground">
              Criado em {createdDate}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* ── Body ── */}
        <div className="p-6 space-y-5">
          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {entry.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] px-2.5 py-1 rounded-full bg-primary/8 text-primary/80 font-medium border border-primary/15"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Prompt metadata fields (Modo Prompt) */}
          {entry.type === "prompt" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FIELD_META.map(({ key, label, icon: Icon }) => {
                const val = entry[key as keyof UnifiedMemoryEntry] as string | null | undefined;
                if (!val) return null;
                return (
                  <div key={key} className="rounded-lg border border-border bg-secondary/20 p-3 space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Icon className="w-3 h-3" />
                      {label}
                    </p>
                    <p className="text-xs text-foreground/80 leading-relaxed">{val}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* SaaS answers fields */}
          {entry.type === "saas" && saasAnswers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {saasAnswers.slice(0, 6).map(([key, val]) => (
                <div key={key} className="rounded-lg border border-border bg-secondary/20 p-3 space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {key.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3">{val}</p>
                </div>
              ))}
            </div>
          )}

          {/* Main content block */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {entry.type === "saas" ? "Especificação Gerada" : "Prompt Gerado"}
            </p>
            <div className="rounded-xl bg-secondary/30 border border-border p-4 max-h-64 overflow-y-auto">
              <pre className="text-xs text-foreground/90 whitespace-pre-wrap font-mono leading-relaxed">
                {entry.fullContent}
              </pre>
            </div>
          </div>
        </div>

        {/* ── Footer Actions ── */}
        <div className="p-4 border-t border-border bg-card/80 flex items-center gap-2 flex-wrap">
          {/* Secondary actions */}
          <div className="flex gap-2 mr-auto">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 text-xs ${entry.is_favorite ? "text-rose-500 hover:text-rose-600" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => onToggleFavorite?.(entry)}
            >
              {entry.is_favorite ? (
                <><HeartOff className="w-3.5 h-3.5" /> Remover favorito</>
              ) : (
                <><Heart className="w-3.5 h-3.5" /> Favoritar</>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="w-3.5 h-3.5" /> Excluir
            </Button>
          </div>

          {/* Primary actions */}
          <Button variant="outline" size="sm" className="gap-2" onClick={handleCopy}>
            <Copy className="w-3.5 h-3.5" /> Copiar
          </Button>

          {entry.type === "prompt" && onUseAsBase && (
            <Button size="sm" className="gap-2" onClick={handleUseAsBase}>
              <PlayCircle className="w-3.5 h-3.5" /> Usar como Base
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
