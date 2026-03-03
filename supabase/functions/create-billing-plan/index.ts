import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY")!;
const admin = createClient(supabaseUrl, serviceRole);
const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const productId = crypto.randomUUID();
    const priceId = crypto.randomUUID();

    const stripeProduct = await stripe.products.create({
      name: body.name,
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
      metadata,
    });
    if (priceError) throw priceError;

    return new Response(JSON.stringify({ ok: true, product_id: productId, price_id: priceId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
