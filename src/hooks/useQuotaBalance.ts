import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface QuotaBalance {
  plan_total: number;
  plan_used: number;
  plan_remaining: number;
  bonus_total: number;
  bonus_used: number;
  bonus_remaining: number;
  total_remaining: number;
  account_status: string;
  trial_ends_at: string | null;
  reset_at: string | null;
}

export function useQuotaBalance(orgId: string | undefined) {
  return useQuery({
    queryKey: ["quota-balance", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_credit_balance", {
        p_org_id: orgId!,
      });
      if (error) throw error;
      return (data as QuotaBalance[])?.[0] ?? null;
    },
    enabled: !!orgId,
  });
}
