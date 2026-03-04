import { supabase } from "@/integrations/supabase/client";

export async function callEdgeFunction(name: string, body?: any) {
  const { data, error } = await supabase.functions.invoke(name, {
    body,
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });

  if (error) {
    console.error("Edge Function Error:", error);
    throw error;
  }

  return data;
}
