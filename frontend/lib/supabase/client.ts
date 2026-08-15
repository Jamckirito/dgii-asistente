import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";

const DEFAULT_SUPABASE_URL = "https://datnzwuujgmyolwfpfkl.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhdG56d3V1amdteW9sd2ZwZmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1ODY0MDUsImV4cCI6MjA5ODE2MjQwNX0.bKNXv3CqBMyLulsfDumr1w8qhIWAXQ6CtfIUHKKxfuA";

export function createBrowserClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_KEY;

  return _createBrowserClient(supabaseUrl, supabaseKey);
}

export const createClient = createBrowserClient;

