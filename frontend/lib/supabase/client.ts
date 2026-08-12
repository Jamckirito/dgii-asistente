import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";

export function createBrowserClient() {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

  return _createBrowserClient(supabaseUrl, supabaseKey);
}

export const createClient = createBrowserClient;
