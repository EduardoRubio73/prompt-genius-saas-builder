import { useQuery } from "@tanstack/react-query";
import { callEdgeFunction } from "@/lib/edgeFunctions";

export interface OrgUsageTransaction {
  id: string;
  org_id: string;
  user_id: string;
  origin: string;
  amount: number;
  is_bonus: boolean;
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  balance_after: number | null;
  created_at: string;
}

export function useOrgUsage(orgId: string | undefined) {
  return useQuery({
    queryKey: ["org-usage", orgId],
    queryFn: async () => {
      const data = await callEdgeFunction("org-usage", { org_id: orgId });
      return (data.transactions ?? []) as OrgUsageTransaction[];
    },
    enabled: !!orgId,
  });
}
