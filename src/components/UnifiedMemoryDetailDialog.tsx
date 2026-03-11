import { useState } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  Download,
  FileArchive,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
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

const TYPE_META: Record<string, { label: string; icon: typeof Sparkles; color: string; badgeCls: string }> = {
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
  build: {
    label: "Modo Build",
    icon: Briefcase,
    color: "text-orange-500",
    badgeCls: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
};

const CREDIT_COSTS: Record<string, number> = { prompt: 1, saas: 2, mixed: 2, build: 5 };

const BUILD_DOC_LABELS: Record<string, string> = {
  prd_md: "📋 PRD",
  erd_md: "🗂️ ERD",
  rbac_md: "🔐 RBAC",
  ux_flows_md: "🔄 Fluxos UX",
  test_plan_md: "🧪 Testes",
  roadmap_md: "🗺️ Roadmap",
  admin_doc_md: "⚙️ Admin",
  sql_schema: "💾 SQL",
  build_prompt: "🤖 Prompt",
  deploy_guide_md: "🚀 Deploy",
};

const BUILD_DOC_FILES: Record<string, string> = {
  erd_md: "01-ERD.md",
  prd_md: "02-PRD.md",
  rbac_md: "03-RBAC.md",
  roadmap_md: "04-Roadmap.md",
  sql_schema: "05-SQL.md",
  ux_flows_md: "06-FluxosUX.md",
  admin_doc_md: "07-Admin.md",
  build_prompt: "08-Prompts.md",
  test_plan_md: "09-Testes.md",
  deploy_guide_md: "10-Deploy.md",
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

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function UnifiedMemoryDetailDialog({
  entry,
  open,
  onOpenChange,
  onUseAsBase,
  onToggleFavorite,
  onDelete,
}: UnifiedMemoryDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("main");

  if (!entry) return null;

  const meta = TYPE_META[entry.type];
  const ModeIcon = meta.icon;

  // Build tabs
  const buildOutputs = entry.type === "build" && entry.outputs
    ? Object.entries(entry.outputs).filter(([, v]) => v)
    : [];
  const buildDocKeys = buildOutputs.map(([k]) => k);

  // Mixed tabs
  const hasMixedSpec = entry.type === "mixed" && entry.spec_md;

  // Determine which tabs to show
  const tabs: { key: string; label: string }[] = [];
  if (entry.type === "build" && buildDocKeys.length > 0) {
    buildDocKeys.forEach((k) => {
      tabs.push({ key: k, label: BUILD_DOC_LABELS[k] || k });
    });
  } else if (entry.type === "mixed" && hasMixedSpec) {
    tabs.push({ key: "prompt", label: "✨ Prompt Gerado" });
    tabs.push({ key: "spec", label: "🏗️ Spec Técnica" });
  }

  const currentActiveTab = tabs.length > 0
    ? (tabs.find((t) => t.key === activeTab) ? activeTab : tabs[0].key)
    : "main";

  const activeContent = (() => {
    const tab = currentActiveTab;
    if (entry.type === "build" && entry.outputs && tab !== "main") {
      return entry.outputs[tab] || "";
    }
    if (entry.type === "mixed" && tab === "spec") {
      return entry.spec_md || "";
    }
    return entry.fullContent;
  })();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeContent);
    toast.success("Conteúdo copiado!");
  };

  const handleCopyAll = async () => {
    if (!entry.outputs) return;
    const answers = (entry.answers || {}) as Record<string, string>;
    const projectName = answers.productName || answers.appName || entry.title || "Projeto";

    let doc = `# ${projectName} — Documento Mestre de Implementação\n\n`;
    doc += `Você é um Arquiteto Sênior. Leia este documento COMPLETO antes de escrever qualquer linha de código. Implemente tudo do zero, na ordem das fases abaixo, sem pular etapas.\n\n---\n\n`;

    // Stack section
    const stackFields = [
      { key: "stackFrontend", label: "Frontend" },
      { key: "stackBackend", label: "Backend/Auth/DB" },
      { key: "stackDatabase", label: "Database" },
      { key: "stackHosting", label: "Hosting" },
      { key: "stackIcons", label: "Ícones" },
      { key: "stackStyling", label: "Estilização" },
    ];
    const hasStack = stackFields.some(({ key }) => answers[key]);
    if (hasStack) {
      doc += `## STACK OBRIGATÓRIA\n\n`;
      for (const { key, label } of stackFields) {
        if (answers[key]) doc += `- ${label}: ${answers[key]}\n`;
      }
      if (answers.primaryColor) doc += `- Paleta principal: ${answers.primaryColor}\n`;
      doc += `\n---\n\n`;
    }

    // Phases
    const PHASE_ORDER = [
      { key: "sql_schema", phase: "BANCO DE DADOS" },
      { key: "prd_md", phase: "PRD — REQUISITOS DO PRODUTO" },
      { key: "erd_md", phase: "ERD — MODELO DE DADOS" },
      { key: "rbac_md", phase: "RBAC — CONTROLE DE ACESSO" },
      { key: "ux_flows_md", phase: "FLUXOS UX" },
      { key: "roadmap_md", phase: "ROADMAP" },
      { key: "admin_doc_md", phase: "PAINEL ADMINISTRATIVO" },
      { key: "build_prompt", phase: "PROMPTS DE IMPLEMENTAÇÃO" },
      { key: "test_plan_md", phase: "PLANO DE TESTES" },
      { key: "deploy_guide_md", phase: "DEPLOY E INFRAESTRUTURA" },
    ];

    let phaseNum = 1;
    for (const { key, phase } of PHASE_ORDER) {
      const content = entry.outputs[key];
      if (!content) continue;
      doc += `## FASE ${phaseNum} — ${phase}\n\n${content}\n\n---\n\n`;
      phaseNum++;
    }

    // General rules
    doc += `## REGRAS GERAIS DE IMPLEMENTAÇÃO\n\n`;
    const rules: string[] = [
      "Layout responsivo (desktop e tablet)",
      "Todos os formulários com validação e feedback de erro",
      "Toda operação assíncrona com loading state",
      "Não use dados mockados — tudo deve vir do banco em tempo real",
    ];
    if (answers.authMethod) rules.push(`Autenticação: ${answers.authMethod}`);
    if (answers.revenueModel) rules.push(`Modelo de receita: ${answers.revenueModel}`);
    if (answers.integrations) rules.push(`Integrações: ${answers.integrations}`);
    if (answers.primaryColor) rules.push(`Cor primária da marca: ${answers.primaryColor}`);
    if (answers.brandName) rules.push(`Nome da marca: ${answers.brandName}`);
    for (const r of rules) doc += `- ${r}\n`;
    doc += `\n`;

    await navigator.clipboard.writeText(doc);
    toast.success("Documento mestre copiado!");
  };

  const handleDownloadZip = async () => {
    if (!entry.outputs) return;
    const zip = new JSZip();
    const docsFolder = zip.folder("docs");

    Object.entries(entry.outputs)
      .filter(([, v]) => v)
      .forEach(([key, content]) => {
        const filename = BUILD_DOC_FILES[key] || `${key}.md`;
        docsFolder?.file(filename, content);
      });

    zip.file(
      "README.md",
      `# ${entry.title || "Projeto"}\n\nDocumentação gerada automaticamente.\n\n## Arquivos\n\n${
        Object.entries(entry.outputs)
          .filter(([, v]) => v)
          .map(([k]) => `- docs/${BUILD_DOC_FILES[k] || `${k}.md`}`)
          .join("\n")
      }\n`
    );

    const blob = await zip.generateAsync({ type: "blob" });
    triggerDownload(blob, `${(entry.title || "projeto").replace(/\s+/g, "-").toLowerCase()}-docs.zip`);
    toast.success("ZIP baixado com sucesso!");
  };

  const handleDownloadMd = () => {
    const filename = entry.type === "saas"
      ? `${(entry.title || "spec").replace(/\s+/g, "-").toLowerCase()}.md`
      : `${(entry.title || "documento").replace(/\s+/g, "-").toLowerCase()}.md`;
    const blob = new Blob([activeContent], { type: "text/markdown" });
    triggerDownload(blob, filename);
    toast.success("Arquivo .md baixado!");
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

  const saasAnswers =
    (entry.type === "saas" || entry.type === "build") && entry.answers
      ? Object.entries(entry.answers as Record<string, string>).filter(([, v]) => v)
      : [];

  const contentLabel = entry.type === "build"
    ? (BUILD_DOC_LABELS[currentActiveTab] || "Documento")
    : entry.type === "mixed" && currentActiveTab === "spec"
      ? "Spec Técnica"
      : entry.type === "saas"
        ? "Especificação Gerada"
        : "Prompt Gerado";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] gap-0 p-0 flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <DialogHeader className="p-6 pb-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap flex-1">
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
            <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2">
              Criado em {createdDate}
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                {CREDIT_COSTS[entry.type] ?? 1} crédito{(CREDIT_COSTS[entry.type] ?? 1) !== 1 ? "s" : ""} consumido{(CREDIT_COSTS[entry.type] ?? 1) !== 1 ? "s" : ""}
              </span>
            </DialogDescription>
          )}
        </DialogHeader>

        {/* ── Body ── */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
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

          {/* Prompt metadata fields */}
          {(entry.type === "prompt" || entry.type === "mixed") && (
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

          {/* Build/SaaS answers fields */}
          {(entry.type === "saas" || entry.type === "build") && saasAnswers.length > 0 && (
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

          {/* Tabs for Build / Mixed */}
          {tabs.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border font-medium transition-colors ${
                    currentActiveTab === tab.key
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Main content block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {contentLabel}
              </p>
              <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" onClick={handleCopy}>
                <Copy className="w-3 h-3" /> Copiar
              </Button>
            </div>
            <div className="rounded-xl bg-secondary/30 border border-border p-4 max-h-64 overflow-y-auto">
              <pre className="text-xs text-foreground/90 whitespace-pre-wrap font-mono leading-relaxed">
                {activeContent}
              </pre>
            </div>
          </div>
        </div>

        {/* ── Footer Actions ── */}
        <div className="p-4 border-t border-border bg-card/80 flex items-center gap-2 flex-wrap">
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

          {/* Mode-specific actions */}
          {entry.type === "build" && entry.outputs && (
            <>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleCopyAll}>
                <ClipboardList className="w-3.5 h-3.5" /> Copiar Tudo
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadZip}>
                <FileArchive className="w-3.5 h-3.5" /> Baixar .zip
              </Button>
            </>
          )}

          {(entry.type === "saas" || entry.type === "mixed") && (
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadMd}>
              <Download className="w-3.5 h-3.5" /> Baixar .md
            </Button>
          )}

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
