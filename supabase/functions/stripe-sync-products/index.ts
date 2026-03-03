import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const products = await stripe.products.list({ limit: 100, active: true });
    const prices = await stripe.prices.list({ limit: 100, active: true });

    const { data: dbProducts } = await admin.from("billing_products").select("id,stripe_product_id,is_active");
    const { data: dbPrices } = await admin.from("billing_prices").select("id,stripe_price_id,unit_amount,product_id");

    const productByStripe = new Map((dbProducts || []).map((p) => [p.stripe_product_id, p]));
    const priceByStripe = new Map((dbPrices || []).map((p) => [p.stripe_price_id, p]));

    for (const sp of products.data) {
      const existing = productByStripe.get(sp.id);
      if (!existing) {
        await admin.from("billing_products").insert({
          id: crypto.randomUUID(),
          name: sp.name,
          display_name: sp.name,
          plan_tier: (sp.metadata?.plan_tier as any) || "starter",
          stripe_product_id: sp.id,
          is_active: sp.active,
        });
      } else {
        await admin.from("billing_products").update({ name: sp.name, display_name: sp.name, is_active: sp.active }).eq("id", existing.id);
      }
    }

    for (const pr of prices.data) {
      const product = productByStripe.get(typeof pr.product === "string" ? pr.product : pr.product.id);
      if (!product) continue;
      const existing = priceByStripe.get(pr.id);
      const recurring = pr.recurring?.interval ?? null;
      if (!existing) {
        await admin.from("billing_prices").insert({
          id: crypto.randomUUID(),
          product_id: product.id,
          unit_amount: pr.unit_amount,
          currency: pr.currency,
          recurring_interval: recurring,
          is_active: pr.active,
          stripe_price_id: pr.id,
        });
      } else if (existing.unit_amount !== pr.unit_amount) {
        await admin.from("billing_prices").update({ unit_amount: pr.unit_amount, recurring_interval: recurring, is_active: pr.active }).eq("id", existing.id);
      }
    }

    const activeStripeProducts = new Set(products.data.map((p) => p.id));
    for (const dp of dbProducts || []) {
      if (dp.stripe_product_id && !activeStripeProducts.has(dp.stripe_product_id)) {
        await admin.from("billing_products").update({ is_active: false }).eq("id", dp.id);
      }
    }

    return new Response(JSON.stringify({ ok: true, products: products.data.length, prices: prices.data.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
