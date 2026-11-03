import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServiceSupabase } from "./supabase/client";

type Result = { ok: true } | { ok: false; error: string };

const UNAVAILABLE: Result = {
  ok: false,
  error: "This form isn't available right now. Please try again shortly.",
};

export const CONTACT_SUBJECTS = [
  "Order Inquiry",
  "Sizing & Fit",
  "Delivery",
  "Returns & Exchanges",
  "Wholesale & Collaborations",
  "Other",
] as const;

export const sendContactMessage = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(200),
        subject: z.enum(CONTACT_SUBJECTS),
        message: z.string().trim().min(5).max(4000),
        // Honeypot: real visitors never see or fill this field
        website: z.string().max(0).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<Result> => {
    const supabase = getServiceSupabase();
    if (!supabase) return UNAVAILABLE;
    const { error } = await supabase.from("messages").insert({
      name: data.name,
      email: data.email.toLowerCase(),
      subject: data.subject,
      message: data.message,
    });
    if (error) {
      console.error("message insert failed", error);
      return UNAVAILABLE;
    }
    return { ok: true };
  });

export const subscribe = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(200),
        source: z.enum(["newsletter", "restock"]),
        productId: z.string().max(100).optional(),
        size: z.string().max(10).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<Result> => {
    const supabase = getServiceSupabase();
    if (!supabase) return UNAVAILABLE;
    const { error } = await supabase.from("subscribers").insert({
      email: data.email.toLowerCase(),
      source: data.source,
      product_id: data.source === "restock" ? (data.productId ?? null) : null,
      size: data.source === "restock" ? (data.size ?? null) : null,
    });
    // 23505 = already subscribed, which is fine from the visitor's point of view
    if (error && error.code !== "23505") {
      console.error("subscriber insert failed", error);
      return UNAVAILABLE;
    }
    return { ok: true };
  });
