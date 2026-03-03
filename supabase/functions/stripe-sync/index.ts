import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-source",
};

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(stripeSecret, {
  apiVersion: "2024-06-20",
});

const admin = createClient(supabaseUrl, serviceRoleKey);

type SyncPayload = {
  table: "billing_products" | "billing_prices";
  event: "INSERT" | "UPDATE";
  new_record: Record<string, unknown>;
  old_record?: Record<string, unknown> | null;
};

async function syncProduct(payload: SyncPayload) {
  const product = payload.new_record;
  const productId = String(product.id);
  const stripeProductId = product.stripe_product_id as string | null;
  const isActive = Boolean(product.is_active);

  await admin
    .from("billing_products")
    .update({ stripe_sync_lock: true, stripe_last_sync_at: new Date().toISOString() })
    .eq("id", productId);

  try {
    let targetStripeProductId = stripeProductId;

    if (!targetStripeProductId) {
      const created = await stripe.products.create({
        name: String(product.name ?? productId),
        description: (product.description as string | null) ?? undefined,
        active: isActive,
      });
      targetStripeProductId = created.id;
    } else {
      await stripe.products.update(targetStripeProductId, {
        name: String(product.name ?? productId),
        description: (product.description as string | null) ?? undefined,
        active: isActive,
      });
    }

    if (!isActive) {
      const { data: localPrices } = await admin
        .from("billing_prices")
        .select("id,stripe_price_id")
        .eq("product_id", productId)
        .eq("is_active", true);

      for (const price of localPrices ?? []) {
        if (price.stripe_price_id) {
          await stripe.prices.update(price.stripe_price_id, { active: false });
        }
      }
    }

    await admin
      .from("billing_products")
      .update({
        stripe_product_id: targetStripeProductId,
        stripe_synced: true,
        stripe_sync_lock: false,
        stripe_last_synced_at: new Date().toISOString(),
      })
      .eq("id", productId);
  } catch (error) {
    await admin
      .from("billing_products")
      .update({ stripe_sync_lock: false })
      .eq("id", productId);
    throw error;
  }
}

async function syncPrice(payload: SyncPayload) {
  const price = payload.new_record;
  const oldPrice = payload.old_record;
  const priceId = String(price.id);
  const stripePriceId = price.stripe_price_id as string | null;
  const isActive = Boolean(price.is_active);
  const unitAmount = Number(price.unit_amount ?? 0);
  const recurringInterval = String(price.recurring_interval ?? "month") as "month" | "year";

  await admin
    .from("billing_prices")
    .update({ stripe_sync_lock: true, stripe_last_sync_at: new Date().toISOString() })
    .eq("id", priceId);

  try {
    const { data: localProduct } = await admin
      .from("billing_products")
      .select("stripe_product_id,name")
      .eq("id", String(price.product_id))
      .single();

    if (!localProduct?.stripe_product_id) {
      throw new Error("Stripe product missing for local billing price sync");
    }

    const oldAmount = Number(oldPrice?.unit_amount ?? unitAmount);
    const amountChanged = payload.event === "UPDATE" && oldAmount !== unitAmount;

    let targetStripePriceId = stripePriceId;

    if (!targetStripePriceId || amountChanged) {
      if (targetStripePriceId && amountChanged) {
        await stripe.prices.update(targetStripePriceId, { active: false });
      }

      const createdPrice = await stripe.prices.create({
        product: localProduct.stripe_product_id,
        unit_amount: unitAmount,
        currency: String(price.currency ?? "brl"),
        active: isActive,
        recurring: recurringInterval ? { interval: recurringInterval } : undefined,
      });
      targetStripePriceId = createdPrice.id;
    } else {
      await stripe.prices.update(targetStripePriceId, { active: isActive });
    }

    await admin
      .from("billing_prices")
      .update({
        stripe_price_id: targetStripePriceId,
        stripe_synced: true,
        stripe_sync_lock: false,
        stripe_last_synced_at: new Date().toISOString(),
      })
      .eq("id", priceId);
  } catch (error) {
    await admin
      .from("billing_prices")
      .update({ stripe_sync_lock: false })
      .eq("id", priceId);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: SyncPayload = await req.json();

    if (!payload?.table || !payload?.new_record) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const record = payload.new_record;
    const updatedAt = new Date(String(record.updated_at)).getTime();
    const lastSyncedAt = record.stripe_last_synced_at
      ? new Date(String(record.stripe_last_synced_at)).getTime()
      : 0;

    if (updatedAt <= lastSyncedAt || Boolean(record.stripe_sync_lock)) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.table === "billing_products") {
      await syncProduct(payload);
    } else if (payload.table === "billing_prices") {
      await syncPrice(payload);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("stripe-sync error", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
