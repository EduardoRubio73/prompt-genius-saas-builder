import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-org-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const successUrl = Deno.env.get("STRIPE_CHECKOUT_SUCCESS_URL")!;
const cancelUrl = Deno.env.get("STRIPE_CHECKOUT_CANCEL_URL")!;

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

type RequestPayload = {
  price_id?: string;
  org_id?: string;
};

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
      return jsonResponse(401, { error: { code: "unauthorized", message: "Missing or invalid authorization header." } });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return jsonResponse(401, { error: { code: "invalid_token", message: "Unable to resolve authenticated user." } });
    }

    const payload = (await req.json()) as RequestPayload;
    const priceId = payload?.price_id?.trim();

    if (!priceId) {
      return jsonResponse(400, { error: { code: "invalid_payload", message: "Field 'price_id' is required." } });
    }

    const orgIdFromHeader = req.headers.get("x-org-id")?.trim();
    const orgIdFromPayload = payload?.org_id?.trim();
    const orgIdFromMetadata =
      (user.app_metadata?.org_id as string | undefined)?.trim() ||
      (user.user_metadata?.org_id as string | undefined)?.trim();

    let orgId: string | undefined = orgIdFromPayload || orgIdFromHeader || orgIdFromMetadata;

    if (!orgId) {
      const { data: profile } = await admin.from("profiles").select("personal_org_id").eq("id", user.id).single();
      if (profile?.personal_org_id) orgId = profile.personal_org_id;
    }

    if (!orgId) {
      return jsonResponse(400, { error: { code: "missing_org_context", message: "Organization context is required." } });
    }

    const { data: membership, error: membershipError } = await admin
      .from("org_members").select("role").eq("org_id", orgId).eq("user_id", user.id).maybeSingle();

    if (membershipError || !membership) {
      return jsonResponse(403, { error: { code: "org_access_denied", message: "User does not have access to the provided organization." } });
    }

    let localPrice: { id: string; stripe_price_id: string | null; is_active: boolean } | null = null;

    const { data: byId } = await admin.from("billing_prices").select("id, stripe_price_id, is_active").eq("id", priceId).maybeSingle();
    if (byId) {
      localPrice = byId;
    } else {
      const { data: byStripe } = await admin.from("billing_prices").select("id, stripe_price_id, is_active").eq("stripe_price_id", priceId).maybeSingle();
      localPrice = byStripe;
    }

    if (!localPrice) {
      return jsonResponse(404, { error: { code: "price_not_found", message: "Billing price not found." } });
    }

    if (!localPrice.is_active || !localPrice.stripe_price_id) {
      return jsonResponse(400, { error: { code: "price_not_checkout_ready", message: "Billing price must be active and synced with Stripe." } });
    }

    const { data: orgRow, error: orgError } = await admin.from("organizations").select("id, name, stripe_customer_id").eq("id", orgId).single();
    if (orgError || !orgRow) {
      return jsonResponse(404, { error: { code: "org_not_found", message: "Organization not found." } });
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

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: localPrice.stripe_price_id, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: { org_id: orgId, requested_by_user_id: user.id, billing_price_id: localPrice.id },
      subscription_data: { metadata: { org_id: orgId, billing_price_id: localPrice.id } },
    });

    return jsonResponse(200, { url: checkoutSession.url });
  } catch (error) {
    console.error("create-checkout-session error:", error);
    return jsonResponse(500, { error: { code: "internal_error", message: "Unexpected error while creating checkout session." } });
  }
});
