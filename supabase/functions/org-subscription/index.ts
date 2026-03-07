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

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { org_id } = await req.json();
    if (!org_id) {
      return new Response(JSON.stringify({ error: "org_id required" }), { status: 400, headers: corsHeaders });
    }

    const { data: sub, error: subErr } = await supabase
      .from("billing_subscriptions")
      .select("id, status, current_period_start, current_period_end, trial_start, trial_end, cancel_at, canceled_at, billing_prices(unit_amount, currency, recurring_interval, billing_products(name, display_name, plan_tier))")
      .eq("org_id", org_id)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subErr) throw subErr;

    if (!sub) {
      return new Response(JSON.stringify({
        status: "none",
        plan_name: null,
        plan_tier: "free",
        plan_value: 0,
        currency: "brl",
        interval: null,
        current_period_start: null,
        current_period_end: null,
        trial_start: null,
        trial_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const price = sub.billing_prices as any;
    const product = price?.billing_products;

    return new Response(JSON.stringify({
      status: sub.status,
      plan_name: product?.display_name ?? product?.name ?? null,
      plan_tier: product?.plan_tier ?? "free",
      plan_value: price?.unit_amount ?? 0,
      currency: price?.currency ?? "brl",
      interval: price?.recurring_interval ?? null,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      trial_start: sub.trial_start,
      trial_end: sub.trial_end,
      cancel_at: sub.cancel_at,
      canceled_at: sub.canceled_at,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("org-subscription error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
