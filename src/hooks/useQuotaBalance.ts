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
  plan_name?: string | null;
}

export function useQuotaBalance(orgId: string | undefined) {
  return useQuery({
    queryKey: ["quota-balance", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_credit_balance", {
        p_org_id: orgId!,
      });
      if (error) throw error;

      const baseQuota = (data as QuotaBalance[])?.[0] ?? null;
      if (!baseQuota) return null;

      const { data: activeSubscription, error: subError } = await supabase
        .from("billing_subscriptions")
        .select(`
          status,
          billing_prices (
            billing_products (
              display_name,
              credits_limit
            )
          )
        `)
        .eq("org_id", orgId!)
        .in("status", ["active", "trialing", "past_due"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) throw subError;

      const product = (activeSubscription as any)?.billing_prices?.billing_products;
      const subscriptionCreditsLimit = Number(product?.credits_limit ?? 0);
      const planTotal = subscriptionCreditsLimit > 0 ? subscriptionCreditsLimit : Number(baseQuota.plan_total ?? 0);

      return {
        ...baseQuota,
        plan_name: product?.display_name ?? null,
        plan_total: planTotal,
        plan_remaining: Math.max(planTotal - Number(baseQuota.plan_used ?? 0), 0),
      } as QuotaBalance;
    },
    enabled: !!orgId,
  });
}
