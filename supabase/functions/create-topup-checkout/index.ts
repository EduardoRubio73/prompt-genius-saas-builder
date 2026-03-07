import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const successUrl = Deno.env.get("STRIPE_CHECKOUT_SUCCESS_URL") || "https://prompt-genius-saas-builder.lovable.app/billing/success";
const cancelUrl = Deno.env.get("STRIPE_CHECKOUT_CANCEL_URL") || "https://prompt-genius-saas-builder.lovable.app/profile?tab=billing";

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

function jsonResponse(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse(401, { error: "Missing authorization header." });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return jsonResponse(401, { error: "Invalid token." });
    }

    const { pack_id, org_id: payloadOrgId } = await req.json();
    if (!pack_id) {
      return jsonResponse(400, { error: "Field 'pack_id' is required." });
    }

    let orgId = payloadOrgId?.trim();
    if (!orgId) {
      const { data: profile } = await admin.from("profiles").select("personal_org_id").eq("id", user.id).single();
      orgId = profile?.personal_org_id;
    }
    if (!orgId) {
      return jsonResponse(400, { error: "org_id is required." });
    }

    const { data: membership } = await admin.from("org_members").select("role").eq("org_id", orgId).eq("user_id", user.id).maybeSingle();
    if (!membership) {
      return jsonResponse(403, { error: "User does not belong to this organization." });
    }

    const { data: pack, error: packError } = await admin
      .from("credit_packs")
      .select("id, credits, price_brl, stripe_price_id, display_name, is_active")
      .eq("id", pack_id)
      .single();

    if (packError || !pack) {
      return jsonResponse(404, { error: "Credit pack not found." });
    }

    if (!pack.is_active) {
      return jsonResponse(400, { error: "Credit pack is not active." });
    }

    if (!pack.stripe_price_id) {
      return jsonResponse(400, { error: "Credit pack has no Stripe price configured." });
    }

    const { data: orgRow } = await admin.from("organizations").select("id, name, stripe_customer_id").eq("id", orgId).single();
    if (!orgRow) {
      return jsonResponse(404, { error: "Organization not found." });
    }

    let stripeCustomerId = orgRow.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        name: orgRow.name,
        metadata: { org_id: orgRow.id, created_by_user_id: user.id },
      });
      stripeCustomerId = customer.id;
      await admin.from("organizations").update({ stripe_customer_id: stripeCustomerId }).eq("id", orgRow.id);
    }

    const { data: purchase, error: purchaseError } = await admin
      .from("credit_purchases")
      .insert({
        org_id: orgId,
        user_id: user.id,
        pack_id: pack.id,
        credits_granted: pack.credits,
        amount_paid_brl: pack.price_brl,
        status: "pending",
      })
      .select("id")
      .single();

    if (purchaseError || !purchase) {
      return jsonResponse(500, { error: "Failed to create purchase record." });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: stripeCustomerId,
      line_items: [{ price: pack.stripe_price_id, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: "topup",
        org_id: orgId,
        user_id: user.id,
        pack_id: pack.id,
        purchase_id: purchase.id,
      },
    });

    await admin.from("credit_purchases").update({ stripe_checkout_session: checkoutSession.id }).eq("id", purchase.id);

    return jsonResponse(200, { url: checkoutSession.url });
  } catch (error) {
    console.error("create-topup-checkout error:", error);
    return jsonResponse(500, { error: "Unexpected error." });
  }
});
