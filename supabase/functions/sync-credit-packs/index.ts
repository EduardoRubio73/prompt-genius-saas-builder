import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await admin.rpc("is_super_admin").setHeader("Authorization", authHeader);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    const { data: packs, error: packsError } = await admin
      .from("credit_packs")
      .select("*")
      .is("stripe_price_id", null)
      .eq("is_active", true);

    if (packsError) throw packsError;

    if (!packs || packs.length === 0) {
      return new Response(JSON.stringify({ message: "All packs already have Stripe prices.", synced: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{ pack_id: string; display_name: string; stripe_price_id: string }> = [];

    for (const pack of packs) {
      const product = await stripe.products.create({
        name: `Créditos Extra: ${pack.display_name}`,
        description: `Pacote de ${pack.credits} cotas extras`,
        metadata: { credit_pack_id: pack.id, credits: String(pack.credits) },
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(pack.price_brl * 100),
        currency: "brl",
      });

      await admin
        .from("credit_packs")
        .update({ stripe_price_id: price.id })
        .eq("id", pack.id);

      results.push({ pack_id: pack.id, display_name: pack.display_name, stripe_price_id: price.id });
      console.log(`Synced pack "${pack.display_name}" -> price ${price.id}`);
    }

    return new Response(JSON.stringify({ message: "Credit packs synced to Stripe.", synced: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("sync-credit-packs error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
