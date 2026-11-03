import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getServiceSupabase } from "./supabase/client";
import { STORE } from "../config/store";
import { DEFAULT_COUNTRY } from "../config/countries";

/**
 * Phone number in international format (+233241234567), or null if invalid.
 * A number typed with + or 00 keeps its own country code; otherwise `dial`
 * (the selected country's calling code, Ghana by default) is used.
 */
export function normalizePhone(value: string, dial: string = DEFAULT_COUNTRY.dial): string | null {
  const typed = value.trim();
  let digits = typed.replace(/\D/g, "");
  if (typed.startsWith("+") || typed.startsWith("00")) {
    if (typed.startsWith("00")) digits = digits.slice(2);
    if (digits.startsWith(DEFAULT_COUNTRY.dial)) return normalizePhone(digits.slice(DEFAULT_COUNTRY.dial.length));
    return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
  }
  // People often type the country code without the +
  if (digits.startsWith(dial) && digits.length - dial.length >= 8) digits = digits.slice(dial.length);
  // Drop the local trunk 0 (024… → 24…); Italian numbers keep theirs
  if (dial !== "39") digits = digits.replace(/^0/, "");
  if (dial === DEFAULT_COUNTRY.dial) return /^[235]\d{8}$/.test(digits) ? `+233${digits}` : null;
  return digits.length >= 6 && dial.length + digits.length <= 15 ? `+${dial}${digits}` : null;
}

export function vipDiscountFor(subtotal: number): number {
  return Math.round(subtotal * STORE.vipDiscountPercent) / 100;
}

/** The VIP entry for this number if its discount hasn't been used on a paid order */
export async function findUnusedVip(supabase: SupabaseClient, phone: string) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  const { data } = await supabase
    .from("vip_members")
    .select("id")
    .eq("phone", normalized)
    .is("redeemed_at", null)
    .maybeSingle();
  return data as { id: number } | null;
}

type JoinResult = { ok: true; alreadyMember: boolean } | { ok: false; error: string };

export const joinVip = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        phone: z.string().trim().max(30),
        dial: z.string().regex(/^\d{1,4}$/).optional(),
        email: z.string().trim().email().max(200),
        // Honeypot: real visitors never see or fill this field
        website: z.string().max(0).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<JoinResult> => {
    const phone = normalizePhone(data.phone, data.dial);
    if (!phone) return { ok: false, error: "Enter a valid phone number for the country you picked." };
    const supabase = getServiceSupabase();
    if (!supabase) return { ok: false, error: "The VIP list isn't available right now. Please try again shortly." };

    const email = data.email.toLowerCase();
    const { error } = await supabase.from("vip_members").insert({ phone, email });
    if (error?.code === "23505") {
      // Already on the list: keep their discount as is, just add an email if missing
      await supabase.from("vip_members").update({ email }).eq("phone", phone).is("email", null);
      return { ok: true, alreadyMember: true };
    }
    if (error) {
      console.error("vip insert failed", error);
      return { ok: false, error: "The VIP list isn't available right now. Please try again shortly." };
    }
    return { ok: true, alreadyMember: false };
  });

/** Checkout preview: does this number still have its VIP discount? */
export const checkVipDiscount = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ phone: z.string().trim().max(30) }).parse(input))
  .handler(async ({ data }): Promise<{ eligible: boolean }> => {
    const supabase = getServiceSupabase();
    if (!supabase) return { eligible: false };
    return { eligible: Boolean(await findUnusedVip(supabase, data.phone)) };
  });
