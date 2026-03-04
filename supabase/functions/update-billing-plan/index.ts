import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2023-10-16" }) : null;

    const body = await req.json();
    const productId = String(body.product_id);

    // Buscar dados existentes do banco
    const { data: existingProduct } = await admin
      .from("billing_products")
      .select("*")
      .eq("id", productId)
      .maybeSingle();

    const metadata = {
      trial_days: Number(body.trial_days ?? 0),
      credits_limit: Number(body.credits_limit ?? 0),
      members_limit: Number(body.members_limit ?? 1),
    };

    // === STRIPE: Produto ===
    let stripeProductId = existingProduct?.stripe_product_id || null;

    if (stripe) {
      if (stripeProductId) {
        await stripe.products.update(stripeProductId, {
          name: body.display_name || body.name,
          active: body.is_active ?? true,
          metadata: { product_id: productId, plan_tier: body.plan_tier },
        });
      } else {
        const sp = await stripe.products.create({
          name: body.display_name || body.name,
          active: body.is_active ?? true,
          metadata: { product_id: productId, plan_tier: body.plan_tier },
        });
        stripeProductId = sp.id;
      }
    }

    // === PREÇO PRIMEIRO (antes do produto, para satisfazer o trigger) ===
    const { data: existingPrice, error: selectError } = await admin
      .from("billing_prices")
      .select("*")
      .eq("product_id", productId)
      .eq("recurring_interval", body.recurring_interval)
      .maybeSingle();
    if (selectError) throw selectError;

    const newUnitAmount = Number(body.unit_amount ?? 0);

    if (!existingPrice) {
      // Criar novo preço
      let stripePriceId: string | null = null;

      if (stripe && stripeProductId) {
        const sp = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: newUnitAmount,
          currency: "brl",
          recurring: { interval: body.recurring_interval ?? "month" },
          active: body.is_active ?? true,
          metadata: { product_id: productId },
        });
        stripePriceId = sp.id;
      }

      const { error } = await admin.from("billing_prices").insert({
        id: crypto.randomUUID(),
        product_id: productId,
        unit_amount: newUnitAmount,
        currency: "brl",
        recurring_interval: body.recurring_interval,
        trial_period_days: Number(body.trial_days ?? 0),
        is_active: body.is_active ?? true,
        metadata,
        ...(stripePriceId ? { stripe_price_id: stripePriceId, stripe_synced: true, stripe_last_synced_at: new Date().toISOString() } : {}),
      });
      if (error) throw error;
    } else {
      // Preço já existe — verificar se amount mudou
      const amountChanged = existingPrice.unit_amount !== newUnitAmount;
      let stripePriceId = existingPrice.stripe_price_id;

      if (stripe && stripeProductId && amountChanged && newUnitAmount > 0) {
        const sp = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: newUnitAmount,
          currency: "brl",
          recurring: { interval: body.recurring_interval ?? "month" },
          active: true,
          metadata: { product_id: productId, price_id: existingPrice.id },
        });
        stripePriceId = sp.id;

        if (existingPrice.stripe_price_id) {
          await stripe.prices.update(existingPrice.stripe_price_id, { active: false });
        }
      }

      const { error } = await admin.from("billing_prices").update({
        unit_amount: newUnitAmount,
        trial_period_days: Number(body.trial_days ?? 0),
        is_active: body.is_active ?? true,
        metadata,
        ...(stripePriceId ? { stripe_price_id: stripePriceId, stripe_synced: true, stripe_last_synced_at: new Date().toISOString() } : {}),
      }).eq("id", existingPrice.id);
      if (error) throw error;
    }

    // === PRODUTO POR ÚLTIMO (preço já está ativo, trigger não bloqueia) ===
    const { error: productError } = await admin.from("billing_products").update({
      name: body.name,
      display_name: body.display_name,
      plan_tier: body.plan_tier,
      sort_order: Number(body.sort_order ?? 0),
      is_featured: Boolean(body.is_featured),
      is_active: body.is_active ?? true,
      metadata,
      ...(stripeProductId ? { stripe_product_id: stripeProductId, stripe_synced: true, stripe_last_synced_at: new Date().toISOString() } : {}),
    }).eq("id", productId);
    if (productError) throw productError;

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("update-billing-plan error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
