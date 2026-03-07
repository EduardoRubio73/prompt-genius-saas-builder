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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
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
      throw new Error("STRIPE_SECRET_KEY not configured.");
    }
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const { data: products, error: prodErr } = await admin
      .from("billing_products")
      .select("*")
      .order("sort_order");
    if (prodErr) throw prodErr;

    const { data: prices, error: priceErr } = await admin
      .from("billing_prices")
      .select("*");
    if (priceErr) throw priceErr;

    const summary = { products_created: 0, products_updated: 0, prices_created: 0, prices_updated: 0, products_recreated: 0, prices_recreated: 0 };

    async function createStripeProduct(product: any): Promise<string | null> {
      try {
        const stripeProduct = await stripe.products.create({
          name: product.display_name || product.name,
          active: true,
          metadata: { product_id: product.id, plan_tier: product.plan_tier },
        });
        await admin.from("billing_products").update({
          stripe_product_id: stripeProduct.id, stripe_synced: true, stripe_last_synced_at: new Date().toISOString(),
        }).eq("id", product.id);
        product.stripe_product_id = stripeProduct.id;
        return stripeProduct.id;
      } catch (e) {
        console.error(`Error creating product ${product.id}:`, e);
        return null;
      }
    }

    async function createStripePrice(price: any, stripeProductId: string): Promise<boolean> {
      try {
        const priceParams: any = {
          product: stripeProductId,
          unit_amount: price.unit_amount || 0,
          currency: price.currency || "brl",
          active: true,
          metadata: { product_id: price.product_id, price_id: price.id },
        };
        if (price.recurring_interval) {
          priceParams.recurring = { interval: price.recurring_interval };
        }
        const stripePrice = await stripe.prices.create(priceParams);
        await admin.from("billing_prices").update({
          stripe_price_id: stripePrice.id, is_active: true, stripe_synced: true, stripe_last_synced_at: new Date().toISOString(),
        }).eq("id", price.id);
        price.stripe_price_id = stripePrice.id;
        return true;
      } catch (e) {
        console.error(`Error creating price ${price.id}:`, e);
        return false;
      }
    }

    function isResourceMissing(e: any): boolean {
      return e?.code === "resource_missing" || e?.raw?.code === "resource_missing" || e?.statusCode === 404;
    }

    for (const product of products || []) {
      if (product.stripe_product_id) {
        try {
          await stripe.products.update(product.stripe_product_id, {
            name: product.display_name || product.name, active: product.is_active,
            metadata: { product_id: product.id, plan_tier: product.plan_tier },
          });
          summary.products_updated++;
        } catch (e) {
          if (isResourceMissing(e)) {
            const newId = await createStripeProduct(product);
            if (newId) summary.products_recreated++;
          } else {
            console.error(`Error updating product ${product.id}:`, e);
          }
        }
      } else {
        const created = await createStripeProduct(product);
        if (created) summary.products_created++;
      }
    }

    for (const price of prices || []) {
      const product = (products || []).find((p: any) => p.id === price.product_id);
      if (!product?.stripe_product_id) continue;
      if (price.stripe_price_id) {
        try {
          await stripe.prices.retrieve(price.stripe_price_id);
          await admin.from("billing_prices").update({
            stripe_synced: true, stripe_last_synced_at: new Date().toISOString(),
          }).eq("id", price.id);
          summary.prices_updated++;
        } catch (e) {
          if (isResourceMissing(e)) {
            const ok = await createStripePrice(price, product.stripe_product_id);
            if (ok) summary.prices_recreated++;
          } else {
            console.error(`Error verifying price ${price.id}:`, e);
          }
        }
      } else {
        const ok = await createStripePrice(price, product.stripe_product_id);
        if (ok) summary.prices_created++;
      }
    }

    for (const product of products || []) {
      const hasActivePrice = (prices || []).some(
        (p: any) => p.product_id === product.id && p.is_active && p.stripe_price_id
      );
      if (hasActivePrice && !product.is_active) {
        await admin.from("billing_products").update({ is_active: true }).eq("id", product.id);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("stripe-sync-products error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
