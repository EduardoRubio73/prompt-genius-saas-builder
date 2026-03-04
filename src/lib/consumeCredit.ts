import { callEdgeFunction } from "@/lib/edgeFunctions";

export interface ConsumeResult {
  success: boolean;
  error?: "no_credits" | "trial_expired" | "suspended";
}

export async function consumeCredit(
  orgId: string,
  userId: string,
  sessionId: string
): Promise<ConsumeResult> {
  const res = await callEdgeFunction("consume-credit", {
    org_id: orgId,
    user_id: userId,
    session_id: sessionId,
  });
  return res as ConsumeResult;
}
