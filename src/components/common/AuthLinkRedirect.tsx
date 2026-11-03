import { useEffect } from "react";

/**
 * Admin emails (invite, password reset) sign people in with details after the
 * # in the link. If Supabase lands them on the store instead of /admin (a link
 * sent from the Supabase dashboard, or /admin missing from its Redirect URLs),
 * send them on to /admin with those details so they can finish there.
 */
export function AuthLinkRedirect() {
  useEffect(() => {
    const { hash, pathname } = window.location;
    if (pathname.startsWith("/admin")) return;
    const params = new URLSearchParams(hash.slice(1));
    if (params.has("access_token") || params.has("error_description")) {
      window.location.replace(`/admin${hash}`);
    }
  }, []);
  return null;
}
