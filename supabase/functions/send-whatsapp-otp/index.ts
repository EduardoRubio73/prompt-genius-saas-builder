import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    // 1. Authenticate user via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: { user }, error: userErr } = await anonClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse request body
    const { phone, code, userName } = await req.json();
    if (!phone || !code) {
      return new Response(JSON.stringify({ error: "phone and code are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return new Response(JSON.stringify({ error: "Invalid code format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize phone
    const digits = phone.replace(/\D/g, "");
    const normalized = digits.startsWith("55") && digits.length >= 12 ? digits : "55" + digits;

    // 3. Get Evolution API config server-side
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: configData, error: configErr } = await adminClient
      .from("admin_settings")
      .select("key, value")
      .eq("category", "whatsapp")
      .in("key", ["evolution_api_url", "evolution_api_key", "evolution_instance"]);

    if (configErr || !configData || configData.length === 0) {
      console.error("[send-whatsapp-otp] Config not found:", configErr);
      return new Response(JSON.stringify({ error: "WhatsApp configuration not found" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const configMap: Record<string, string> = {};
    configData.forEach((r) => { configMap[r.key] = r.value; });

    const evoUrl = configMap.evolution_api_url?.replace(/\/$/, "");
    const evoKey = configMap.evolution_api_key;
    const evoInstance = configMap.evolution_instance;

    if (!evoUrl || !evoKey || !evoInstance) {
      return new Response(JSON.stringify({ error: "Incomplete WhatsApp configuration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Check instance connection state
    try {
      const stateRes = await fetch(`${evoUrl}/instance/connectionState/${evoInstance}`, {
        method: "GET",
        headers: { apikey: evoKey },
      });
      if (stateRes.ok) {
        const stateData = await stateRes.json();
        const state = stateData?.instance?.state ?? stateData?.state;
        if (state && state !== "open") {
          return new Response(JSON.stringify({ error: "whatsapp_disconnected", state }), {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    } catch {
      // Don't block if pre-flight fails
    }

    // 5. Send message via Evolution API
    const message = `🔐 *Genius — Verificação de Segurança*\n\nOlá${userName ? `, ${userName}` : ""}! Seu código de verificação é:\n\n*${code}*\n\nEle expira em 10 minutos.\nNão compartilhe este código com ninguém.\n\n— Equipe Genius`;

    const sendRes = await fetch(`${evoUrl}/message/sendText/${evoInstance}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: evoKey,
      },
      body: JSON.stringify({ number: normalized, text: message }),
    });

    if (!sendRes.ok) {
      const body = await sendRes.json().catch(() => ({}));
      const detail = body?.response?.message?.[0] ?? body?.message ?? body?.error;
      console.error("[send-whatsapp-otp] Send failed:", sendRes.status, detail);

      if (sendRes.status === 401) {
        return new Response(JSON.stringify({ error: "Evolution API token invalid" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: detail ?? "Failed to send WhatsApp message" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-whatsapp-otp] Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
