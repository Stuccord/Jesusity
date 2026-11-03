import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestHeader } from "@tanstack/react-start/server";
import { getServiceSupabase } from "./supabase/client";

// Server only: called inside the handler, so it never ships to the browser
function siteOrigin(): string {
  const configured = process.env["SITE_URL"];
  if (configured) return configured.replace(/\/$/, "");
  const host = getRequestHeader("x-forwarded-host") ?? getRequestHeader("host") ?? "localhost";
  const proto =
    getRequestHeader("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

type AddAdminResult = { ok: true; invited: boolean } | { ok: false; error: string };

/**
 * Adds someone to the admin team (managers only). If they don't have a login
 * yet, one is created and they get an email to choose their password.
 */
export const addAdmin = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        accessToken: z.string().min(10),
        email: z.string().trim().email().max(200),
        role: z.enum(["manager", "accounts", "staff"]),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<AddAdminResult> => {
    const supabase = getServiceSupabase();
    if (!supabase) return { ok: false, error: "The server isn't connected to Supabase." };

    // Check who is asking: their own login must be a manager
    const { data: caller } = await supabase.auth.getUser(data.accessToken);
    if (!caller.user) return { ok: false, error: "Your session expired. Sign in again." };
    const { data: me } = await supabase
      .from("admin_users")
      .select("role")
      .eq("user_id", caller.user.id)
      .maybeSingle();
    if (me?.role !== "manager") return { ok: false, error: "Only managers can add admins." };

    const email = data.email.toLowerCase();
    const { data: existingId, error: findError } = await supabase.rpc("find_user_by_email", {
      p_email: email,
    });
    if (findError) {
      console.error("find_user_by_email failed", findError);
      return { ok: false, error: "Couldn't look up that email. Please try again." };
    }

    let userId = existingId as string | null;
    const invited = !userId;
    if (!userId) {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (error || !created.user) {
        console.error("createUser failed", error);
        return { ok: false, error: "Couldn't create a login for that email." };
      }
      userId = created.user.id;
    }

    const { error: insertError } = await supabase
      .from("admin_users")
      .insert({ user_id: userId, role: data.role });
    if (insertError?.code === "23505") {
      return { ok: false, error: `${email} is already on the team. Change their role in the list.` };
    }
    if (insertError) {
      console.error("admin insert failed", insertError);
      return { ok: false, error: "Couldn't add that admin. Please try again." };
    }

    await supabase.from("admin_activity").insert({
      actor_id: caller.user.id,
      actor_email: caller.user.email ?? null,
      action: "team.insert",
      target: email,
      details: { role: data.role },
    });

    if (invited) {
      // Uses the password-reset email; the link opens /admin to set a password
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteOrigin()}/admin`,
      });
      if (error) console.error("invite email failed", error);
    }

    return { ok: true, invited };
  });
