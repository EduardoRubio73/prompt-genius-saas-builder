import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // 1. Validate apikey from header against stored Evolution API key
    const incomingKey = req.headers.get("apikey") ?? "";

    const { data: storedKey } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "evolution_api_key")
      .eq("category", "whatsapp")
      .single();

    if (!storedKey || incomingKey !== storedKey.value) {
      console.warn("[evolution-webhook] Invalid apikey");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse body
    const body = await req.json();
    const event = body?.event ?? body?.event_type ?? "";

    console.log(`[evolution-webhook] Event received: ${event}`);

    // 3. Handle connection.update
    if (event === "connection.update" || event === "CONNECTION_UPDATE") {
      const state =
        body?.data?.state ??
        body?.instance?.state ??
        body?.state ??
        "unknown";

      await supabase.from("admin_settings").upsert(
        {
          key: "evolution_connection_status",
          value: state,
          category: "whatsapp",
          description: "Status da conexão da instância Evolution API (via webhook)",
          is_secret: false,
        },
        { onConflict: "key" }
      );

      console.log(`[evolution-webhook] Connection status updated: ${state}`);
    }

    // 4. Handle messages.update (delivery receipts)
    if (event === "messages.update" || event === "MESSAGES_UPDATE") {
      const status = body?.data?.status ?? body?.status ?? "unknown";
      console.log(`[evolution-webhook] Message status: ${status}`);
      // Future: log delivery status to a table if needed
    }

    // 5. Handle messages.upsert (incoming messages)
    if (event === "messages.upsert" || event === "MESSAGES_UPSERT") {
      console.log("[evolution-webhook] Incoming message received (not processed)");
      // Future: handle incoming messages for conversational flows
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[evolution-webhook] Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
