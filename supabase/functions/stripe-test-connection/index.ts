import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
    const account = await stripe.accounts.retrieve();
    return new Response(JSON.stringify({ ok: true, message: `Stripe conectado: ${account.id}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, message: "Erro de autenticação", details: String(error) }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
