import { supabase } from "@/integrations/supabase/client";

export async function callEdgeFunction(name: string, body?: any) {

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const { data, error } = await supabase.functions.invoke(name, {
    body,
    headers: {
      Authorization: `Bearer ${session?.access_token}`
    }
  });

  if (error) {
    console.error("Edge Function Error:", error);
    throw error;
  }

  return data;
}
