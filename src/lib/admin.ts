import { useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getBrowserSupabase } from "./supabase/client";

export type AdminState =
  | { status: "unconfigured" }
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "recovery"; supabase: SupabaseClient }
  | { status: "not-admin"; email: string }
  | { status: "ready"; session: Session; supabase: SupabaseClient };

/** Tracks the Supabase login and whether that user is listed in admin_users. */
export function useAdminAuth(): AdminState {
  const [state, setState] = useState<AdminState>({ status: "loading" });

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setState({ status: "unconfigured" });
      return;
    }

    let cancelled = false;
    let recovering = false;
    // Auth fires several events on load; only re-check admin rights for a new user
    let checkedUserId: string | null = null;
    const resolve = async (session: Session | null) => {
      if (recovering) return;
      if (!session) {
        checkedUserId = null;
        if (!cancelled) setState({ status: "signed-out" });
        return;
      }
      if (session.user.id === checkedUserId) return;
      checkedUserId = session.user.id;
      // RLS only lets admins see admin_users, so a row back means "is admin"
      const { data } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (cancelled || recovering) return;
      setState(
        data
          ? { status: "ready", session, supabase }
          : { status: "not-admin", email: session.user.email ?? "" },
      );
    };

    supabase.auth.getSession().then(({ data }) => resolve(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Arrived from a "reset password" email: ask for a new password first
      if (event === "PASSWORD_RECOVERY") {
        recovering = true;
        setState({ status: "recovery", supabase });
        return;
      }
      resolve(session);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function timeAgo(iso: string) {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join(
    "\n",
  );
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const STATUS_STYLES: Record<string, string> = {
  pending_payment: "bg-amber-50 text-amber-800 border-amber-200",
  payment_failed: "bg-red-50 text-red-700 border-red-200",
  paid: "bg-emerald-50 text-emerald-800 border-emerald-200",
  processing: "bg-blue-50 text-blue-800 border-blue-200",
  shipped: "bg-violet-50 text-violet-800 border-violet-200",
  delivered: "bg-neutral-900 text-white border-neutral-900",
  cancelled: "bg-neutral-100 text-neutral-600 border-neutral-200",
  refunded: "bg-neutral-100 text-neutral-600 border-neutral-200",
};
