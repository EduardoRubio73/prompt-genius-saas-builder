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
      // Fetch plan balance from view
      const { data, error } = await supabase
        .from("v_user_plan_balance")
        .select("*")
        .single();

      if (error) throw error;
      if (!data) return null;

      const creditsLimit = Number(data.credits_limit ?? 0);
      let creditsUsed = Number(data.credits_used ?? 0);
      let creditsRemaining = Number(data.credits_remaining ?? Math.max(creditsLimit - creditsUsed, 0));
      let percentUsed = Number(data.percent_used ?? 0);

      // Detect new billing cycle where credits haven't been reset yet
      const isNewCycleNotReset =
        data.subscription_status === 'active' &&
        creditsUsed >= creditsLimit &&
        creditsLimit > 0;

      if (isNewCycleNotReset) {
        creditsUsed = 0;
        creditsRemaining = creditsLimit;
        percentUsed = 0;
      }

      // Fetch real bonus data from get_credit_balance RPC
      let bonusTotal = 0;
      let bonusUsed = 0;
      let bonusRemaining = 0;
      let accountStatus = data.subscription_status ?? "active";
      let trialEndsAt: string | null = null;
      let resetAt = data.current_period_end ?? null;

      if (orgId) {
        const { data: creditData } = await supabase
          .rpc("get_credit_balance", { p_org_id: orgId });

        if (creditData && creditData.length > 0) {
          const cb = creditData[0];
          bonusTotal = cb.bonus_total ?? 0;
          bonusUsed = cb.bonus_used ?? 0;
          bonusRemaining = cb.bonus_remaining ?? 0;
          accountStatus = cb.account_status ?? accountStatus;
          trialEndsAt = cb.trial_ends_at ? String(cb.trial_ends_at) : null;
          resetAt = cb.reset_at ? String(cb.reset_at) : resetAt;
        }
      }

      return {
        plan_name: data.plan_name ?? null,
        plan_price: Number(data.plan_price ?? 0),
        credits_limit: creditsLimit,
        credits_used: creditsUsed,
        credits_remaining: creditsRemaining,
        percent_used: percentUsed,
        current_period_end: data.current_period_end ?? null,
        plan_total: creditsLimit,
        plan_used: creditsUsed,
        plan_remaining: creditsRemaining,
        bonus_total: bonusTotal,
        bonus_used: bonusUsed,
        bonus_remaining: bonusRemaining,
        total_remaining: creditsRemaining + bonusRemaining,
        account_status: accountStatus,
        trial_ends_at: trialEndsAt,
        reset_at: resetAt,
      } as QuotaBalance;
    },
    enabled: !!orgId,
  });
}
