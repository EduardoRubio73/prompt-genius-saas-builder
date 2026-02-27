import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ flag, enabled }: { flag: string; enabled: boolean }) => {
      const { error } = await supabase.rpc("admin_toggle_feature", {
        p_flag: flag,
        p_enabled: enabled,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] });
    },
    onError: (error: Error) => {
      console.error("Toggle feature flag failed:", error);
    },
  });
}

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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { p_key: string; p_value: string; p_category?: string; p_description?: string; p_is_secret?: boolean }) => {
      const { error } = await supabase.rpc("admin_upsert_setting", params);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (error: Error) => {
      console.error("Upsert setting failed:", error);
    },
  });
}

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
