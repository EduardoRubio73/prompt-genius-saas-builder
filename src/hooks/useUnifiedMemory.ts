import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MemoryMode = "prompt" | "saas" | "mixed" | "build";

export interface UnifiedMemoryEntry {
  id: string;
  type: MemoryMode;
  title: string;
  preview: string;
  fullContent: string;
  rating: number | null;
  is_favorite: boolean;
  tags: string[] | null;
  categoria: string | null;
  created_at: string;
  // Prompt-specific
  especialidade?: string | null;
  persona?: string | null;
  tarefa?: string | null;
  objetivo?: string | null;
  contexto?: string | null;
  formato?: string | null;
  restricoes?: string | null;
  referencias?: string | null;
  destino?: string | null;
  // SaaS-specific
  project_name?: string | null;
  answers?: Record<string, unknown> | null;
  // Mixed: session reference
  session_id?: string | null;
}

interface UseUnifiedMemoryOptions {
  refreshKey?: number;
  filter?: "all" | "gold" | "favorites";
  activeMode?: "all" | MemoryMode;
  searchQuery?: string;
  orgId?: string;
}

export function useUnifiedMemory({
  refreshKey = 0,
  filter = "all",
  activeMode = "all",
  searchQuery = "",
  orgId,
}: UseUnifiedMemoryOptions) {
  const [promptEntries, setPromptEntries] = useState<UnifiedMemoryEntry[]>([]);
  const [saasEntries, setSaasEntries] = useState<UnifiedMemoryEntry[]>([]);
  const [buildEntries, setBuildEntries] = useState<UnifiedMemoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        // ── Prompt Memory ──────────────────────────────────────────────
        let pq = supabase
          .from("prompt_memory")
          .select(
            "id, categoria, especialidade, rating, prompt_gerado, created_at, tags, persona, tarefa, objetivo, contexto, formato, restricoes, referencias, destino, session_id, is_favorite"
          )
          .eq("org_id", orgId)
          .order("created_at", { ascending: false })
          .limit(40);

        if (filter === "gold") pq = pq.eq("rating", 5);
        if (filter === "favorites") pq = pq.eq("is_favorite", true);

        const { data: pData } = await pq;

        // ── SaaS Specs ─────────────────────────────────────────────────
        let sq = supabase
          .from("saas_specs")
          .select(
            "id, project_name, spec_md, rating, created_at, is_favorite, answers, session_id, prompt_memory_id"
          )
          .eq("org_id", orgId)
          .order("created_at", { ascending: false })
          .limit(40);

        if (filter === "gold") sq = sq.eq("rating", 5);
        if (filter === "favorites") sq = sq.eq("is_favorite", true);

        const { data: sData } = await sq;

        // ── Build Projects ──────────────────────────────────────────────
        let bq = supabase
          .from("build_projects")
          .select(
            "id, project_name, answers, outputs, branding, rating, created_at, is_favorite, session_id"
          )
          .eq("org_id", orgId)
          .order("created_at", { ascending: false })
          .limit(40);

        if (filter === "gold") bq = bq.eq("rating", 5);
        if (filter === "favorites") bq = bq.eq("is_favorite", true);

        const { data: bData } = await bq;

        // ── Normalize prompt entries ───────────────────────────────────
        const normalized_prompts: UnifiedMemoryEntry[] = (pData ?? []).map((e) => ({
          id: e.id,
          type: (e.categoria === "misto" ? "mixed" : "prompt") as MemoryMode,
          title: e.especialidade || e.categoria || "Prompt sem título",
          preview: e.prompt_gerado?.slice(0, 120) || "",
          fullContent: e.prompt_gerado || "",
          rating: e.rating,
          is_favorite: e.is_favorite ?? false,
          tags: e.tags,
          categoria: e.categoria,
          created_at: e.created_at ?? new Date().toISOString(),
          especialidade: e.especialidade,
          persona: e.persona,
          tarefa: e.tarefa,
          objetivo: e.objetivo,
          contexto: e.contexto,
          formato: e.formato,
          restricoes: e.restricoes,
          referencias: e.referencias,
          destino: e.destino,
          session_id: e.session_id,
        }));

        // ── Normalize saas entries ─────────────────────────────────────
        const normalized_saas: UnifiedMemoryEntry[] = (sData ?? []).map((e) => ({
          id: e.id,
          type: "saas" as MemoryMode,
          title: e.project_name || "Spec sem título",
          preview: e.spec_md?.slice(0, 120) || "",
          fullContent: e.spec_md || "",
          rating: e.rating,
          is_favorite: e.is_favorite ?? false,
          tags: null,
          categoria: "SaaS Spec",
          created_at: e.created_at ?? new Date().toISOString(),
          project_name: e.project_name,
          answers: e.answers as Record<string, unknown> | null,
          session_id: e.session_id,
        }));

        setPromptEntries(normalized_prompts);
        setSaasEntries(normalized_saas);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [refreshKey, filter, orgId]);

  const allEntries = useMemo(() => {
    let combined = [...promptEntries, ...saasEntries].sort((a, b) => {
      // Sort: favorites first, then by created_at desc, then by title asc (A-Z)
      if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
      const dateCompare = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (dateCompare !== 0) return dateCompare;
      return (a.title ?? "").localeCompare(b.title ?? "", "pt-BR");
    });

    // Filter by active mode tab
    if (activeMode !== "all") {
      combined = combined.filter((e) => e.type === activeMode);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      combined = combined.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.fullContent?.toLowerCase().includes(q) ||
          e.categoria?.toLowerCase().includes(q) ||
          e.tags?.some((t) => t.toLowerCase().includes(q)) ||
          e.project_name?.toLowerCase().includes(q)
      );
    }

    return combined;
  }, [promptEntries, saasEntries, activeMode, searchQuery]);

  const toggleFavorite = async (entry: UnifiedMemoryEntry) => {
    const table = entry.type === "prompt" ? "prompt_memory" : "saas_specs";
    const newVal = !entry.is_favorite;
    await supabase.from(table).update({ is_favorite: newVal }).eq("id", entry.id);

    if (entry.type === "prompt") {
      setPromptEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, is_favorite: newVal } : e))
      );
    } else {
      setSaasEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, is_favorite: newVal } : e))
      );
    }
  };

  const deleteEntry = async (entry: UnifiedMemoryEntry) => {
    const table = entry.type === "prompt" ? "prompt_memory" : "saas_specs";
    await supabase.from(table).delete().eq("id", entry.id);

    if (entry.type === "prompt") {
      setPromptEntries((prev) => prev.filter((e) => e.id !== entry.id));
    } else {
      setSaasEntries((prev) => prev.filter((e) => e.id !== entry.id));
    }
  };

  const counts = useMemo(
    () => ({
      all: promptEntries.length + saasEntries.length,
      prompt: promptEntries.filter((e) => e.type === "prompt").length,
      saas: saasEntries.length,
      mixed: promptEntries.filter((e) => e.type === "mixed").length,
      build: 0,
      favorites: [...promptEntries, ...saasEntries].filter((e) => e.is_favorite).length,
    }),
    [promptEntries, saasEntries]
  );

  return { entries: allEntries, isLoading, toggleFavorite, deleteEntry, counts };
}
