import { useQuery } from "@tanstack/react-query";
import { callEdgeFunction } from "@/lib/edgeFunctions";

export interface OrgSubscriptionData {
  status: string;
  plan_name: string | null;
  plan_tier: string;
  plan_value: number;
  currency: string;
  interval: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_start: string | null;
  trial_end: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
}

export function useOrgSubscription(orgId: string | undefined) {
  return useQuery({
    queryKey: ["org-subscription", orgId],
    queryFn: async () => {
      const data = await callEdgeFunction("org-subscription", { org_id: orgId });
      return data as OrgSubscriptionData;
    },
    enabled: !!orgId,
  });
}
