import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Users ───
export function useAdminUsers(page = 0, search = "") {
  return useQuery({
    queryKey: ["admin-users", page, search],
    queryFn: async () => {
      let query = supabase
        .from("admin_users_overview")
        .select("*")
        .order("registered_at", { ascending: false })
        .range(page * 20, page * 20 + 19);
      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("profiles").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("organizations").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

// ─── Prompts ───
export function useAdminPrompts(page = 0, search = "") {
  return useQuery({
    queryKey: ["admin-prompts", page, search],
    queryFn: async () => {
      let query = supabase
        .from("admin_prompts_overview")
        .select("*")
        .order("created_at", { ascending: false })
        .range(page * 20, page * 20 + 19);
      if (search) {
        query = query.or(`tarefa.ilike.%${search}%,especialidade.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminPromptDetail(id: string | null) {
  return useQuery({
    queryKey: ["admin-prompt-detail", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("prompt_memory")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useDeletePrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prompt_memory").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-prompts"] }),
  });
}

// ─── SaaS Specs ───
export function useAdminSaasSpecs(page = 0) {
  return useQuery({
    queryKey: ["admin-saas-specs", page],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_saas_specs_overview")
        .select("*")
        .order("created_at", { ascending: false })
        .range(page * 20, page * 20 + 19);
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminSpecDetail(id: string | null) {
  return useQuery({
    queryKey: ["admin-spec-detail", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("saas_specs")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useDeleteSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saas_specs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-saas-specs"] }),
  });
}

// ─── Feature Flags ───
export function useAdminFeatureFlags() {
  return useQuery({
    queryKey: ["admin-feature-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_feature_flags")
        .select("*")
        .order("flag");
      if (error) throw error;
      return data;
    },
  });
}

export function useToggleFeatureFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ flag, enabled }: { flag: string; enabled: boolean }) => {
      const { error } = await supabase.rpc("admin_toggle_feature", { p_flag: flag, p_enabled: enabled });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-feature-flags"] }),
  });
}

export function useCreateFeatureFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { flag: string; label: string; description?: string; rollout_pct?: number; enabled?: boolean }) => {
      const { error } = await supabase.from("admin_feature_flags").insert({
        flag: params.flag,
        label: params.label,
        description: params.description || null,
        rollout_pct: params.rollout_pct ?? 100,
        enabled: params.enabled ?? false,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-feature-flags"] }),
  });
}

export function useUpdateFeatureFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("admin_feature_flags").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-feature-flags"] }),
  });
}

export function useDeleteFeatureFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_feature_flags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-feature-flags"] }),
  });
}

// ─── Settings ───
export function useAdminSettings(category?: string) {
  return useQuery({
    queryKey: ["admin-settings", category],
    queryFn: async () => {
      let query = supabase.from("admin_settings").select("*");
      if (category) query = query.eq("category", category);
      const { data, error } = await query.order("key");
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { p_key: string; p_value: string; p_category?: string; p_description?: string; p_is_secret?: boolean }) => {
      const { error } = await supabase.rpc("admin_upsert_setting", params);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-settings"] }),
  });
}

// ─── Model Configs ───
export function useAdminModelConfigs() {
  return useQuery({
    queryKey: ["admin-model-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_model_configs")
        .select("*")
        .order("display_name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateModelConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: Record<string, any>) => {
      const { error } = await supabase.from("admin_model_configs").insert(params as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-model-configs"] }),
  });
}

export function useUpdateModelConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("admin_model_configs").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-model-configs"] }),
  });
}

export function useDeleteModelConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_model_configs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-model-configs"] }),
  });
}

// ─── Products (Billing) ───
export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_products")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("billing_products").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });
}

// ─── Prices (Billing) ───
export function useAdminPrices() {
  return useQuery({
    queryKey: ["admin-prices"],
    queryFn: async () => {
      const { data: prices, error: pricesError } = await supabase
        .from("billing_prices")
        .select("*")
        .order("product_id");
      if (pricesError) throw pricesError;

      const { data: products } = await supabase
        .from("billing_products")
        .select("id, name, display_name, is_active");

      const productMap = new Map((products || []).map((p) => [p.id, p]));
      return (prices || []).map((p) => ({
        ...p,
        product_name: productMap.get(p.product_id)?.display_name || productMap.get(p.product_id)?.name || p.product_id,
        product_is_active: productMap.get(p.product_id)?.is_active ?? false,
      }));
    },
  });
}

export function useUpdatePrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("billing_prices").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-prices"] }),
  });
}

// ─── Audit Logs ───
export function useAdminAuditLogs(page = 0, actionFilter = "") {
  return useQuery({
    queryKey: ["admin-audit-logs", page, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .range(page * 50, page * 50 + 49);
      if (actionFilter) {
        query = query.ilike("action", `%${actionFilter}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// ─── Credit Transactions ───
export function useAdminCreditTransactions(orgId: string | null) {
  return useQuery({
    queryKey: ["admin-credit-transactions", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}
