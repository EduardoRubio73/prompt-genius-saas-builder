import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OrgStats {
  total_sessions: number;
  total_prompts: number;
  total_saas_specs: number;
  avg_prompt_rating: number;
  tokens_this_month: number;
  favorite_prompts: number;
  favorite_specs: number;
}

export function useOrgStats(orgId: string | undefined) {
  return useQuery({
    queryKey: ["org-stats", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_org_stats", {
        p_org_id: orgId!,
      });
      if (error) throw error;
      return (data as OrgStats[])?.[0] ?? null;
    },
    enabled: !!orgId,
  });
}

export function useTokenBudget(orgId: string | undefined) {
  return useQuery({
    queryKey: ["token-budget", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_token_budget", {
        p_org_id: orgId!,
      });
      if (error) throw error;
      return (data as { limit_total: number; consumed: number; remaining: number }[])?.[0] ?? null;
    },
    enabled: !!orgId,
  });
}
