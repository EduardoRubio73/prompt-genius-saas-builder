import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "not_authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "not_authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt_memory_id, especialidade, tarefa, objetivo, contexto, prompt_gerado } = await req.json();

    if (!prompt_memory_id || !prompt_gerado) {
      return new Response(JSON.stringify({ error: "missing_fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um gerador de Mini Apps HTML. Gere UM ÚNICO arquivo HTML completo, interativo e offline.

REGRAS OBRIGATÓRIAS:
- Máximo 200 linhas de código
- HTML + CSS + JS em um único arquivo
- Deve funcionar 100% offline (sem CDNs, sem imports externos)
- Visual moderno e responsivo com cores vibrantes
- Interativo: botões, animações, inputs quando relevante
- Tema escuro por padrão
- Retorne APENAS o código HTML, sem markdown, sem backticks, sem explicações

CONTEXTO DO AGENTE:
- Especialidade: ${especialidade || "Geral"}
- Tarefa: ${tarefa || "N/A"}
- Objetivo: ${objetivo || "N/A"}
- Contexto: ${contexto || "N/A"}

PROMPT BASE:
${prompt_gerado.slice(0, 2000)}

Crie um mini app útil e interativo baseado nesse contexto. Pode ser: calculadora especializada, checklist interativo, gerador de templates, simulador, quiz, dashboard visual, etc.`;

    // Call LLM via Lovable AI Gateway
    const llmRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Gere o mini app HTML agora." },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!llmRes.ok) {
      const errText = await llmRes.text();
      console.error("LLM error:", errText);
      throw new Error("LLM request failed");
    }

    const llmData = await llmRes.json();
    let html = llmData.choices?.[0]?.message?.content || "";

    // Clean up if wrapped in markdown code blocks
    html = html.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();

    // Save to prompt_memory
    await supabaseAdmin
      .from("prompt_memory")
      .update({
        mini_app_html: html,
        mini_app_generated_at: new Date().toISOString(),
      })
      .eq("id", prompt_memory_id);

    return new Response(JSON.stringify({ html }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-mini-app error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
