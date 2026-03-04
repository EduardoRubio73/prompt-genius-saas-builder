import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pcaebfncvuvdguyjmyxm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjYWViZm5jdnV2ZGd1eWpteXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTM5ODAsImV4cCI6MjA4NzY4OTk4MH0.7pDeOmLlWzPoVKJKIRepxGKtMAD0PPJiyXHG8AYhy34";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
