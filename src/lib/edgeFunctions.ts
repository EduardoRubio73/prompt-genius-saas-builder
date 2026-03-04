import { supabase } from "@/integrations/supabase/client";

export async function callEdgeFunction(name: string, body?: any) {

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("User not authenticated");
  }

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify(body ?? {})
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("Edge Function Error:", text);
    throw new Error(text);
  }

  return await res.json();
}
