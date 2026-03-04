import { useQuery } from "@tanstack/react-query";
import { callEdgeFunction } from "@/lib/edgeFunctions";

export interface OrgDashboardData {
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
  last_consumption: string | null;
}

export function useOrgDashboard(orgId: string | undefined) {
  return useQuery({
    queryKey: ["org-dashboard", orgId],
    queryFn: async () => {
      const data = await callEdgeFunction("org-dashboard", { org_id: orgId });
      return data as OrgDashboardData;
    },
    enabled: !!orgId,
  });
}
