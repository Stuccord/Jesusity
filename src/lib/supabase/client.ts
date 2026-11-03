import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Public values: safe to ship to the browser. Row level security in
// supabase/migrations decides what the anon key can read or write.
const SUPABASE_URL = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let browserClient: SupabaseClient | null = null;

/** Browser client used by the admin dashboard (keeps the admin's login session). */
export function getBrowserSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "jesusity-admin-auth" },
    });
  }
  return browserClient;
}

/**
 * Server-only client with the service role key. Bypasses row level security,
 * so call it only inside createServerFn / server route handlers.
 */
export function getServiceSupabase(): SupabaseClient | null {
  const url = process.env["SUPABASE_URL"] || SUPABASE_URL;
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
