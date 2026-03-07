import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await anonClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Super admin check
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isAdmin } = await admin.rpc("is_super_admin").setHeader("Authorization", authHeader);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY não configurada.");
    }
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const body = await req.json();
    const productId = crypto.randomUUID();
    const priceId = crypto.randomUUID();

    const stripeProduct = await stripe.products.create({
      name: body.display_name || body.name,
      active: body.is_active ?? true,
      metadata: { product_id: productId, plan_tier: body.plan_tier ?? "starter" },
    });

    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Number(body.unit_amount ?? 0),
      currency: "brl",
      recurring: { interval: body.recurring_interval ?? "month" },
      active: body.is_active ?? true,
      metadata: { product_id: productId, price_id: priceId },
    });

    const metadata = {
      trial_days: Number(body.trial_days ?? 0),
      credits_limit: Number(body.credits_limit ?? 0),
      members_limit: Number(body.members_limit ?? 1),
    };

    const { error: productError } = await admin.from("billing_products").insert({
      id: productId,
      name: body.name,
      display_name: body.display_name,
      plan_tier: body.plan_tier,
      sort_order: Number(body.sort_order ?? 0),
      is_featured: Boolean(body.is_featured),
      is_active: body.is_active ?? true,
      stripe_product_id: stripeProduct.id,
      stripe_synced: true,
      stripe_last_synced_at: new Date().toISOString(),
      metadata,
    });
    if (productError) throw productError;

    const { error: priceError } = await admin.from("billing_prices").insert({
      id: priceId,
      product_id: productId,
      unit_amount: Number(body.unit_amount ?? 0),
      currency: "brl",
      recurring_interval: body.recurring_interval ?? "month",
      trial_period_days: Number(body.trial_days ?? 0),
      is_active: body.is_active ?? true,
      stripe_price_id: stripePrice.id,
      stripe_synced: true,
      stripe_last_synced_at: new Date().toISOString(),
      metadata,
    });
    if (priceError) throw priceError;

    return new Response(
      JSON.stringify({ ok: true, product_id: productId, price_id: priceId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("create-billing-plan error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
