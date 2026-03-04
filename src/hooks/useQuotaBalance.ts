import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface QuotaBalance {
  plan_name: string | null;
  plan_price: number;
  credits_limit: number;
  credits_used: number;
  credits_remaining: number;
  percent_used: number;
  current_period_end: string | null;
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
      const { data, error } = await supabase
        .from("v_user_plan_balance")
        .select("*")
        .single();

      if (error) throw error;
      if (!data) return null;

      const creditsLimit = Number(data.credits_limit ?? 0);
      const creditsUsed = Number(data.credits_used ?? 0);
      const creditsRemaining = Number(data.credits_remaining ?? Math.max(creditsLimit - creditsUsed, 0));

      return {
        plan_name: data.plan_name ?? null,
        plan_price: Number(data.plan_price ?? 0),
        credits_limit: creditsLimit,
        credits_used: creditsUsed,
        credits_remaining: creditsRemaining,
        percent_used: Number(data.percent_used ?? 0),
        current_period_end: data.current_period_end ?? null,
        // backward compatibility for current UI consumers
        plan_total: creditsLimit,
        plan_used: creditsUsed,
        plan_remaining: creditsRemaining,
        bonus_total: 0,
        bonus_used: 0,
        bonus_remaining: 0,
        total_remaining: creditsRemaining,
        account_status: "active",
        trial_ends_at: null,
        reset_at: data.current_period_end ?? null,
      } as QuotaBalance;
    },
    enabled: !!orgId,
  });
}
