import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function callEdgeFunction(name: string, body?: any) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("not_authenticated");
  }

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body ?? {}),
  });

  const text = await res.text();

  if (res.status === 401) {
    // Session likely expired or was invalidated — don't crash the UI
    console.warn(`[callEdgeFunction] ${name}: session expired (401)`);
    throw new Error("not_authenticated");
  }

  if (!res.ok) {
    throw new Error(text);
  }

  return JSON.parse(text);
}
