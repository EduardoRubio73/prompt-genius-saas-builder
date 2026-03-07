import { callEdgeFunction } from "@/lib/edgeFunctions";

export interface ConsumeResult {
  success: boolean;
  error?: "no_credits" | "trial_expired" | "suspended";
}

export async function consumeCredit(
  orgId: string,
  _userId: string,
  sessionId: string
): Promise<ConsumeResult> {
  const res = await callEdgeFunction("consume-credit", {
    org_id: orgId,
    session_id: sessionId,
  });
  return res as ConsumeResult;
}
