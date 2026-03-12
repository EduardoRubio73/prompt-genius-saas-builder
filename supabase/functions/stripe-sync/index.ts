import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-source, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });
const admin = createClient(supabaseUrl, serviceRoleKey);

type SyncPayload = {
  table: "billing_products" | "billing_prices";
  event: "INSERT" | "UPDATE";
  new_record: Record<string, unknown>;
  old_record?: Record<string, unknown> | null;
};

/** Safely convert a Stripe unix timestamp to ISO string, or return null */
function safeTimestamp(val: unknown): string | null {
  if (typeof val !== "number" || !isFinite(val) || val <= 0) return null;
  try {
    return new Date(val * 1000).toISOString();
  } catch {
    return null;
  }
}

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

/**
 * Cancel any existing active subscriptions for the org that differ from the incoming one.
 * This prevents unique constraint violations on uniq_active_subscription_per_org.
 */
async function deactivateOldSubscriptions(orgId: string, newSubId: string): Promise<void> {
  const { data: existingActive } = await admin
    .from("billing_subscriptions")
    .select("id")
    .eq("org_id", orgId)
    .in("status", ["active", "trialing"])
    .neq("id", newSubId);

  if (existingActive && existingActive.length > 0) {
    for (const old of existingActive) {
      console.log("Deactivating old subscription:", old.id, "for org:", orgId);
      await admin
        .from("billing_subscriptions")
        .update({ status: "canceled", canceled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", old.id);
    }
  }
}

async function upsertSubscriptionFromStripe(
  stripeSubscription: Stripe.Subscription,
  orgId: string
): Promise<void> {
  const priceId = stripeSubscription.items.data[0]?.price?.id;
  if (!priceId) {
    console.error("No price found in Stripe subscription");
    return;
  }

  // Find local price by stripe_price_id
  const { data: localPrice } = await admin
    .from("billing_prices")
    .select("id, product_id")
    .eq("stripe_price_id", priceId)
    .maybeSingle();

  if (!localPrice) {
    console.error("Local price not found for stripe_price_id:", priceId);
    return;
  }

  // Use item-level period if available, fallback to subscription-level
  const item = stripeSubscription.items.data[0];
  const periodStart = (item as any)?.current_period_start ?? stripeSubscription.current_period_start;
  const periodEnd = (item as any)?.current_period_end ?? stripeSubscription.current_period_end;

  const periodStartISO = safeTimestamp(periodStart);
  const periodEndISO = safeTimestamp(periodEnd);

  // If we still can't get valid period dates, use sensible defaults
  const now = new Date().toISOString();
  const oneMonthLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Deactivate old subscriptions to avoid unique constraint violation
  if (stripeSubscription.status === "active" || stripeSubscription.status === "trialing") {
    await deactivateOldSubscriptions(orgId, stripeSubscription.id);
  }

  const subData = {
    id: stripeSubscription.id,
    org_id: orgId,
    price_id: localPrice.id,
    status: stripeSubscription.status as any,
    current_period_start: periodStartISO ?? now,
    current_period_end: periodEndISO ?? oneMonthLater,
    trial_start: safeTimestamp(stripeSubscription.trial_start),
    trial_end: safeTimestamp(stripeSubscription.trial_end),
    cancel_at: safeTimestamp(stripeSubscription.cancel_at),
    canceled_at: safeTimestamp(stripeSubscription.canceled_at),
    ended_at: safeTimestamp(stripeSubscription.ended_at),
    metadata: stripeSubscription.metadata ?? null,
    updated_at: now,
  };

  const { error: upsertError } = await admin
    .from("billing_subscriptions")
    .upsert(subData, { onConflict: "id" });

  if (upsertError) {
    console.error("Failed to upsert subscription:", upsertError);
    throw new Error(`Upsert subscription failed: ${upsertError.message}`);
  } else {
    console.log("Subscription upserted:", stripeSubscription.id, "for org:", orgId);

    // Sync plan_credits_reset_at with Stripe's current_period_end
    if (stripeSubscription.status === "active" || stripeSubscription.status === "trialing") {
      await admin
        .from("organizations")
        .update({
          plan_credits_reset_at: subData.current_period_end,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orgId);
      console.log("plan_credits_reset_at synced to:", subData.current_period_end, "for org:", orgId);
    }
  }
}

/** Resolve orgId from a Stripe subscription via metadata or stripe_customer_id lookup */
async function resolveOrgId(stripeSubscription: Stripe.Subscription): Promise<string | null> {
  const orgId = stripeSubscription.metadata?.org_id;
  if (orgId) return orgId;

  const customerId = stripeSubscription.customer as string;
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  return org?.id ?? null;
}

/** Upsert a Stripe invoice into billing_invoices */
async function upsertInvoice(invoice: Stripe.Invoice, orgId: string): Promise<void> {
  const invoiceData = {
    id: invoice.id!,
    org_id: orgId,
    subscription_id: (invoice.subscription as string) ?? null,
    amount_due: invoice.amount_due ?? 0,
    amount_paid: invoice.amount_paid ?? 0,
    currency: invoice.currency ?? "brl",
    status: invoice.status ?? "unknown",
    paid_at: invoice.status === "paid" ? new Date().toISOString() : null,
    period_start: safeTimestamp(invoice.period_start),
    period_end: safeTimestamp(invoice.period_end),
    hosted_invoice_url: invoice.hosted_invoice_url ?? null,
    invoice_pdf: invoice.invoice_pdf ?? null,
  };

  const { error } = await admin
    .from("billing_invoices")
    .upsert(invoiceData, { onConflict: "id" });

  if (error) {
    console.error("Failed to upsert invoice:", error);
  } else {
    console.log("Invoice upserted:", invoice.id, "for org:", orgId);
  }
}

async function handleStripeWebhook(req: Request): Promise<Response> {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!sig || !webhookSecret) {
    return new Response(JSON.stringify({ error: "Missing signature or webhook secret" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Signature verified — now process the event. Errors here should return 500 so Stripe retries.
  try {
    console.log("Stripe webhook event:", event.type);

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.org_id;

      if (session.metadata?.type === "topup") {
        const purchaseId = session.metadata.purchase_id;
        if (purchaseId) {
          const { error } = await admin.rpc("process_credit_purchase", {
            p_purchase_id: purchaseId,
            p_stripe_pi_id: (session.payment_intent as string) ?? "",
          });
          if (error) console.error("Failed to process topup:", error);
          else console.log("Topup processed for purchase:", purchaseId);
        }
      } else if (session.mode === "subscription" && session.subscription && orgId) {
        console.log("Processing subscription checkout for org:", orgId);
        const stripeSubscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        await upsertSubscriptionFromStripe(stripeSubscription, orgId);

        await admin
          .from("organizations")
          .update({ plan_credits_used: 0, updated_at: new Date().toISOString() })
          .eq("id", orgId);
        console.log("Credits reset for org:", orgId);
      }
    }

    // Handle subscription created/updated events
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const stripeSubscription = event.data.object as Stripe.Subscription;
      const orgId = await resolveOrgId(stripeSubscription);

      if (orgId) {
        // Check if period changed (renewal) — reset credits
        if (event.type === "customer.subscription.updated") {
          const previousAttrs = (event.data as any).previous_attributes;
          if (previousAttrs?.current_period_start !== undefined) {
            const renewalPeriodEnd = safeTimestamp(
              (stripeSubscription.items.data[0] as any)?.current_period_end
              ?? stripeSubscription.current_period_end
            );
            console.log("Period renewed for org:", orgId, "— resetting plan_credits_used, new period_end:", renewalPeriodEnd);
            await admin
              .from("organizations")
              .update({
                plan_credits_used: 0,
                plan_credits_reset_at: renewalPeriodEnd ?? new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", orgId);
          }
        }

        await upsertSubscriptionFromStripe(stripeSubscription, orgId);
      } else {
        console.warn("Could not find org for subscription:", stripeSubscription.id);
      }
    }

    // Handle customer.subscription.deleted
    if (event.type === "customer.subscription.deleted") {
      const stripeSubscription = event.data.object as Stripe.Subscription;
      const orgId = await resolveOrgId(stripeSubscription);

      if (orgId) {
        console.log("Subscription deleted for org:", orgId, "sub:", stripeSubscription.id);

        // Update local subscription record
        const now = new Date().toISOString();
        await admin
          .from("billing_subscriptions")
          .update({
            status: "canceled",
            canceled_at: safeTimestamp(stripeSubscription.canceled_at) ?? now,
            ended_at: safeTimestamp(stripeSubscription.ended_at) ?? now,
            updated_at: now,
          })
          .eq("id", stripeSubscription.id);

        // Downgrade org to free
        await admin
          .from("organizations")
          .update({
            plan_tier: "free",
            plan_credits_total: 0,
            account_status: "churned",
            monthly_token_limit: 10000,
            max_members: 1,
            updated_at: now,
          })
          .eq("id", orgId);

        console.log("Org downgraded to free:", orgId);
      } else {
        console.warn("Could not find org for deleted subscription:", stripeSubscription.id);
      }
    }

    // Handle invoice.payment_succeeded
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.subscription as string | null;

      // Upsert invoice record
      if (subId) {
        const { data: sub } = await admin
          .from("billing_subscriptions")
          .select("org_id")
          .eq("id", subId)
          .maybeSingle();

        if (sub?.org_id) {
          // Reset credits
          await admin
            .from("organizations")
            .update({ plan_credits_used: 0, updated_at: new Date().toISOString() })
            .eq("id", sub.org_id);
          console.log("Credits reset via invoice for org:", sub.org_id);

          // Upsert invoice
          await upsertInvoice(invoice, sub.org_id);
        }
      } else {
        // Try to find org via customer_id for non-subscription invoices
        const customerId = invoice.customer as string;
        if (customerId) {
          const { data: org } = await admin
            .from("organizations")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();
          if (org) {
            await upsertInvoice(invoice, org.id);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (processingError) {
    // Processing failed AFTER signature was verified — return 500 so Stripe retries
    console.error("Webhook processing error:", processingError);
    return new Response(JSON.stringify({ error: "Internal processing error", details: String(processingError) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if this is a Stripe webhook (has signature header) — webhooks are authenticated via signature
    const sig = req.headers.get("stripe-signature");
    if (sig) {
      return await handleStripeWebhook(req);
    }

    // For non-webhook calls, require auth + super admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await anonClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: isAdmin } = await admin.rpc("is_super_admin").setHeader("Authorization", authHeader);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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
    console.error("stripe-sync error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
