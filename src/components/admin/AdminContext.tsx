import { createContext, useContext } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { AdminRole } from "../../lib/admin";

interface AdminContextValue {
  supabase: SupabaseClient;
  session: Session;
  role: AdminRole;
}

export const AdminContext = createContext<AdminContextValue | null>(null);

/** The signed-in admin's Supabase client; row level security limits it to admin data. */
export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside the admin layout");
  return ctx;
}
