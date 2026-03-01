import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("AI Gateway error:", res.status, err);
    if (res.status === 429) throw new Error("Rate limit exceeded, please try again later.");
    if (res.status === 402) throw new Error("Payment required, please add credits.");
    throw new Error("AI Gateway error");
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

function parseJsonFromLLM(text: string): Record<string, unknown> {
  // Try to extract JSON from markdown code blocks or raw text
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {
      // fallback
    }
  }
  try {
    return JSON.parse(text.trim());
  } catch {
    return { raw: text };
  }
}

// === ACTION: distribute ===
async function handleDistribute(freeText: string, destino: string) {
  const system = `Você é um assistente especializado em engenharia de prompt. 
Dado um texto livre do usuário, extraia e distribua as informações nos seguintes campos JSON:
- especialidade: área de conhecimento do agente (ex: "Full-Stack Developer", "UX Designer")
- persona: papel/personalidade que o agente deve assumir
- tarefa: o que o agente deve fazer concretamente
- objetivo: resultado esperado / entregável
- contexto: informações adicionais, restrições, tecnologias
- destino: plataforma alvo (manter "${destino}" se não mencionado)

Responda APENAS com JSON válido, sem markdown. Exemplo:
{"especialidade":"...","persona":"...","tarefa":"...","objetivo":"...","contexto":"...","destino":"${destino}"}`;

  const result = await callLLM(system, freeText);
  return parseJsonFromLLM(result);
}

// === ACTION: refine ===
async function handleRefine(fields: Record<string, string>, destino: string) {
  const system = `Você é um engenheiro de prompt sênior. Receba campos estruturados e:
1. Melhore cada campo com mais clareza e especificidade
2. Gere um prompt final otimizado para a plataforma "${destino}"

O prompt final deve ser estruturado, claro, e pronto para uso direto na plataforma.

Responda APENAS com JSON válido contendo os campos melhorados + "prompt_gerado":
{"especialidade":"...","persona":"...","tarefa":"...","objetivo":"...","contexto":"...","destino":"...","prompt_gerado":"O prompt completo e otimizado aqui"}`;

  const userMsg = JSON.stringify(fields);
  const result = await callLLM(system, userMsg);
  return parseJsonFromLLM(result);
}

// === ACTION: saas-spec ===
async function handleSaasSpec(
  promptFields: Record<string, string>,
  originalInput: string,
  destino: string
) {
  const system = `Você é um arquiteto de software e product manager sênior. 
Com base nas informações fornecidas, gere uma especificação técnica COMPLETA em Markdown para um projeto SaaS.

A spec deve incluir:
1. ## Visão Geral do Produto
2. ## Problema & Solução  
3. ## Público-Alvo
4. ## Funcionalidades Core (MVP)
5. ## Arquitetura Técnica
   - Stack recomendada (frontend, backend, banco de dados)
   - Diagrama de componentes (em texto)
6. ## Modelo de Dados (principais entidades e relacionamentos)
7. ## Fluxos de Usuário
8. ## Integrações Necessárias
9. ## Modelo de Negócio & Monetização
10. ## Roadmap de Desenvolvimento (fases)
11. ## Considerações de Segurança
12. ## Métricas de Sucesso (KPIs)

Seja detalhado, técnico e prático. Use Markdown com headers, listas e code blocks quando apropriado.
A plataforma alvo é: ${destino}.

Responda APENAS com JSON: {"spec_md": "...o markdown completo aqui..."}`;

  const userMsg = `Input original do usuário: ${originalInput}

Campos estruturados:
${JSON.stringify(promptFields, null, 2)}`;

  const result = await callLLM(system, userMsg);
  const parsed = parseJsonFromLLM(result);

  // If the LLM returned the markdown directly instead of JSON
  if (!parsed.spec_md && parsed.raw) {
    return { spec_md: parsed.raw };
  }

  return parsed;
}

// === ACTION: build ===
async function handleBuild(answers: Record<string, unknown>) {
  const system = `Você é um arquiteto de software sênior e product manager experiente.
Com base nas respostas do wizard de construção de SaaS fornecidas, gere TODOS os documentos técnicos necessários.

Responda APENAS com JSON válido contendo EXATAMENTE estas chaves:
{
  "prd_md": "Product Requirements Document completo em Markdown",
  "erd_md": "Entity Relationship Diagram em Markdown (entidades, campos, relacionamentos)",
  "rbac_md": "Role-Based Access Control em Markdown (papéis, permissões, políticas)",
  "ux_flows_md": "Fluxos de usuário principais em Markdown",
  "test_plan_md": "Plano de testes em Markdown (cenários, critérios de aceite)",
  "roadmap_md": "Roadmap de desenvolvimento em fases em Markdown",
  "admin_doc_md": "Documentação do painel admin em Markdown",
  "sql_schema": "Schema SQL completo com CREATE TABLE, RLS policies, triggers, functions — pronto para executar no Supabase",
  "build_prompt": "Prompt completo e otimizado para construir este projeto no Lovable, pronto para colar",
  "deploy_guide_md": "Guia passo a passo de deploy em Markdown"
}

Seja detalhado, técnico e prático. O SQL deve ser production-ready com RLS.`;

  const result = await callLLM(system, JSON.stringify(answers, null, 2));
  return parseJsonFromLLM(result);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, freeText, fields, destino, promptFields, originalInput, answers } = body;

    let result: Record<string, unknown>;

    switch (action) {
      case "distribute":
        result = await handleDistribute(freeText || "", destino || "lovable");
        break;
      case "refine":
        result = await handleRefine(fields || {}, destino || "lovable");
        break;
      case "saas-spec":
        result = await handleSaasSpec(
          promptFields || {},
          originalInput || "",
          destino || "lovable"
        );
        break;
      case "build":
        result = await handleBuild(answers || {});
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
