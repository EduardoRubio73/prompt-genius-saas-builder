import { useQuery } from "@tanstack/react-query";
import { callEdgeFunction } from "@/lib/edgeFunctions";

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
  extra_credits: number;
  total_remaining: number;
  account_status: string;
  trial_ends_at: string | null;
  reset_at: string | null;
}

export function useQuotaBalance(orgId: string | undefined) {
  return useQuery({
    queryKey: ["quota-balance", orgId],
    queryFn: async () => {
      const data = await callEdgeFunction("org-dashboard", { org_id: orgId });

      return {
        plan_name: data.plan_name ?? null,
        plan_price: Number(data.plan_price ?? 0),
        credits_limit: Number(data.credits_limit ?? 0),
        credits_used: Number(data.credits_used ?? 0),
        credits_remaining: Number(data.credits_remaining ?? 0),
        percent_used: Number(data.percent_used ?? 0),
        current_period_end: data.current_period_end ?? null,
        plan_total: Number(data.plan_total ?? 0),
        plan_used: Number(data.plan_used ?? 0),
        plan_remaining: Number(data.plan_remaining ?? 0),
        bonus_total: Number(data.bonus_total ?? 0),
        bonus_used: Number(data.bonus_used ?? 0),
        bonus_remaining: Number(data.bonus_remaining ?? 0),
        total_remaining: Number(data.total_remaining ?? 0),
        account_status: data.account_status ?? "active",
        trial_ends_at: data.trial_ends_at ?? null,
        reset_at: data.reset_at ?? null,
      } as QuotaBalance;
    },
    enabled: !!orgId,
  });
}
