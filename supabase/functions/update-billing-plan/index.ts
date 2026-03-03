import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const productId = String(body.product_id);
    const metadata = {
      trial_days: Number(body.trial_days ?? 0),
      credits_limit: Number(body.credits_limit ?? 0),
      members_limit: Number(body.members_limit ?? 1),
    };

    const { error: productError } = await admin.from("billing_products").update({
      name: body.name,
      display_name: body.display_name,
      plan_tier: body.plan_tier,
      sort_order: Number(body.sort_order ?? 0),
      is_featured: Boolean(body.is_featured),
      is_active: body.is_active ?? true,
      metadata,
    }).eq("id", productId);
    if (productError) throw productError;

    const { data: existing, error: selectError } = await admin
      .from("billing_prices")
      .select("id")
      .eq("product_id", productId)
      .eq("recurring_interval", body.recurring_interval)
      .maybeSingle();
    if (selectError) throw selectError;

    if (!existing) {
      const { error } = await admin.from("billing_prices").insert({
        id: crypto.randomUUID(),
        product_id: productId,
        unit_amount: Number(body.unit_amount ?? 0),
        currency: "brl",
        recurring_interval: body.recurring_interval,
        trial_period_days: Number(body.trial_days ?? 0),
        is_active: body.is_active ?? true,
        metadata,
      });
      if (error) throw error;
    } else {
      const { error } = await admin.from("billing_prices").update({
        unit_amount: Number(body.unit_amount ?? 0),
        trial_period_days: Number(body.trial_days ?? 0),
        is_active: body.is_active ?? true,
        metadata,
      }).eq("id", existing.id);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
