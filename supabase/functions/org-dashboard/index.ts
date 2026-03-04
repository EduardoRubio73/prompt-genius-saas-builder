import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { org_id } = await req.json();
    if (!org_id) {
      return new Response(JSON.stringify({ error: "org_id required" }), { status: 400, headers: corsHeaders });
    }

    // Fetch org data
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", org_id)
      .single();
    if (orgErr) throw orgErr;

    // Fetch active subscription
    const { data: sub } = await supabase
      .from("billing_subscriptions")
      .select("*, billing_prices(*, billing_products(*))")
      .eq("org_id", org_id)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch last credit transaction
    const { data: lastTx } = await supabase
      .from("credit_transactions")
      .select("created_at, amount, description")
      .eq("org_id", org_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch extra credits from org_credits
    const serviceRole = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: orgCredits } = await serviceRole
      .from("org_credits")
      .select("extra_balance")
      .eq("org_id", org_id)
      .maybeSingle();
    const extraCredits = orgCredits?.extra_balance ?? 0;

    const planName = sub?.billing_prices?.billing_products?.display_name ?? sub?.billing_prices?.billing_products?.name ?? null;
    const planPrice = sub?.billing_prices?.unit_amount ?? 0;
    const creditsLimit = org.plan_credits_total ?? 0;
    const creditsUsed = org.plan_credits_used ?? 0;
    const creditsRemaining = Math.max(0, creditsLimit - creditsUsed);
    const percentUsed = creditsLimit > 0 ? Math.round((creditsUsed / creditsLimit) * 100) : 0;

    const result = {
      plan_name: planName,
      plan_price: planPrice,
      credits_limit: creditsLimit,
      credits_used: creditsUsed,
      credits_remaining: creditsRemaining,
      percent_used: percentUsed,
      current_period_end: sub?.current_period_end ?? null,
      plan_total: creditsLimit,
      plan_used: creditsUsed,
      plan_remaining: creditsRemaining,
      bonus_total: org.bonus_credits_total ?? 0,
      bonus_used: org.bonus_credits_used ?? 0,
      bonus_remaining: Math.max(0, (org.bonus_credits_total ?? 0) - (org.bonus_credits_used ?? 0)),
      extra_credits: extraCredits,
      total_remaining: creditsRemaining + Math.max(0, (org.bonus_credits_total ?? 0) - (org.bonus_credits_used ?? 0)) + extraCredits,
      account_status: org.account_status ?? "active",
      trial_ends_at: org.trial_ends_at ?? null,
      reset_at: org.plan_credits_reset_at ?? sub?.current_period_end ?? null,
      last_consumption: lastTx?.created_at ?? null,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
