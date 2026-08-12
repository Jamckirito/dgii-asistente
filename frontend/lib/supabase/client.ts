import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";

export function createBrowserClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-anon-key";

  return _createBrowserClient(supabaseUrl, supabaseKey);
}

export const createClient = createBrowserClient;
