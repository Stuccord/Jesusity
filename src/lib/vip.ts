import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getServiceSupabase } from "./supabase/client";
import { STORE } from "../config/store";

/** Ghana mobile number as 0XXXXXXXXX (accepts +233, 233, spaces and dashes), or null */
export function normalizeGhanaPhone(value: string): string | null {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("233")) digits = digits.slice(3);
  if (digits.length === 9) digits = `0${digits}`;
  return /^0[235]\d{8}$/.test(digits) ? digits : null;
}

export function vipDiscountFor(subtotal: number): number {
  return Math.round(subtotal * STORE.vipDiscountPercent) / 100;
}

/** The VIP entry for this number if its discount hasn't been used on a paid order */
export async function findUnusedVip(supabase: SupabaseClient, phone: string) {
  const normalized = normalizeGhanaPhone(phone);
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
        email: z.string().trim().email().max(200),
        // Honeypot: real visitors never see or fill this field
        website: z.string().max(0).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<JoinResult> => {
    const phone = normalizeGhanaPhone(data.phone);
    if (!phone) return { ok: false, error: "Enter a valid Ghana phone number, e.g. 024 123 4567." };
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
