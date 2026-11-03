import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { getServiceSupabase } from "./supabase/client";
import { initializeTransaction, isPaystackConfigured, verifyTransaction } from "./paystack";
import { PRODUCT_SELECT, type ProductRow } from "./catalog";
import { GHANA_REGIONS, STORE, deliveryFeeFor } from "../config/store";

const NOT_READY = "Online checkout isn't available right now. Please try again shortly.";

const checkoutSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{9,16}$/, "Enter a valid phone number"),
  address: z.string().trim().min(4).max(300),
  city: z.string().trim().min(2).max(100),
  region: z.enum(GHANA_REGIONS),
  notes: z.string().trim().max(500).optional(),
  channel: z.enum(["momo", "card"]),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(100),
        size: z.string().min(1).max(10),
        quantity: z.number().int().min(1).max(STORE.maxQuantityPerItem),
      }),
    )
    .min(1)
    .max(30),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type CheckoutResult =
  | { ok: true; reference: string; authorizationUrl: string }
  | { ok: false; error: string };

function newReference(): string {
  // No 0/O/1/I so references are easy to read out over the phone
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return "JS-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

function siteOrigin(): string {
  const configured = process.env["SITE_URL"];
  if (configured) return configured.replace(/\/$/, "");
  const host = getRequestHeader("x-forwarded-host") ?? getRequestHeader("host") ?? "localhost";
  const proto =
    getRequestHeader("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export const createCheckout = createServerFn({ method: "POST" })
  .validator((input: unknown) => checkoutSchema.parse(input))
  .handler(async ({ data }): Promise<CheckoutResult> => {
    const supabase = getServiceSupabase();
    if (!supabase || !isPaystackConfigured()) return { ok: false, error: NOT_READY };

    // Merge duplicate lines so stock is checked against the total quantity
    const lines = new Map<string, { productId: string; size: string; quantity: number }>();
    for (const item of data.items) {
      const key = `${item.productId}::${item.size}`;
      const existing = lines.get(key);
      if (existing) existing.quantity += item.quantity;
      else lines.set(key, { ...item });
    }

    const productIds = [...new Set(data.items.map((i) => i.productId))];
    const { data: rows, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .in("id", productIds)
      .eq("is_active", true);
    if (error) {
      console.error("checkout product lookup failed", error);
      return { ok: false, error: NOT_READY };
    }
    const byId = new Map((rows as ProductRow[]).map((r) => [r.id, r]));

    // Prices always come from the database, never from the browser
    const orderItems = [];
    for (const line of lines.values()) {
      const product = byId.get(line.productId);
      if (!product) {
        return { ok: false, error: "An item in your bag is no longer available. Please remove it." };
      }
      const size = product.product_sizes?.find((s) => s.label === line.size);
      if (!size || size.stock < line.quantity) {
        const left = size?.stock ?? 0;
        return {
          ok: false,
          error:
            left > 0
              ? `Only ${left} left of ${product.name} in size ${line.size}. Please update your bag.`
              : `${product.name} in size ${line.size} just sold out. Please update your bag.`,
        };
      }
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        colorway: product.colorway,
        size: line.size,
        unit_price: Number(product.price),
        quantity: line.quantity,
        image: product.images?.front ?? null,
      });
    }

    const subtotal = orderItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    const deliveryFee = deliveryFeeFor(subtotal);
    const total = subtotal + deliveryFee;
    const reference = newReference();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        reference,
        customer_name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        address: data.address,
        city: data.city,
        region: data.region,
        notes: data.notes || null,
        subtotal,
        delivery_fee: deliveryFee,
        total,
      })
      .select("id")
      .single();
    if (orderError || !order) {
      console.error("order insert failed", orderError);
      return { ok: false, error: NOT_READY };
    }

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems.map((i) => ({ ...i, order_id: order.id })));
    if (itemsError) {
      console.error("order items insert failed", itemsError);
      await supabase.from("orders").delete().eq("id", order.id);
      return { ok: false, error: NOT_READY };
    }

    await supabase
      .from("order_events")
      .insert({ order_id: order.id, status: "pending_payment", note: "Order placed" });

    try {
      const tx = await initializeTransaction({
        email: data.email,
        amountPesewas: Math.round(total * 100),
        reference,
        callbackUrl: `${siteOrigin()}/order-confirmed?ref=${reference}`,
        channels: data.channel === "momo" ? ["mobile_money", "card"] : ["card", "mobile_money"],
        metadata: {
          order_reference: reference,
          customer_name: data.name,
          phone: data.phone,
        },
      });
      return { ok: true, reference, authorizationUrl: tx.authorization_url };
    } catch (e) {
      console.error(e);
      await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
      await supabase.from("order_events").insert({
        order_id: order.id,
        status: "cancelled",
        note: "Payment could not be started",
      });
      return { ok: false, error: "We couldn't connect to the payment provider. Please try again." };
    }
  });

/** Confirms a payment with Paystack and records it. Safe to call repeatedly. */
export async function confirmPayment(reference: string): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase || !isPaystackConfigured()) return;
  const tx = await verifyTransaction(reference);
  if (tx.status === "success" && tx.currency === "GHS") {
    const { error } = await supabase.rpc("mark_order_paid", {
      p_reference: reference,
      p_payment_reference: String(tx.id),
      p_amount_pesewas: tx.amount,
      p_channel: tx.channel,
    });
    if (error) console.error("mark_order_paid failed", error);
  } else if (tx.status === "failed" || tx.status === "abandoned") {
    const { data: order } = await supabase
      .from("orders")
      .update({ status: "payment_failed" })
      .eq("reference", reference)
      .eq("status", "pending_payment")
      .select("id")
      .maybeSingle();
    if (order) {
      await supabase
        .from("order_events")
        .insert({ order_id: order.id, status: "payment_failed", note: "Payment was not completed" });
    }
  }
}

export interface PublicOrder {
  reference: string;
  status: string;
  createdAt: string;
  firstName: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  city: string;
  region: string;
  items: { name: string; colorway: string | null; size: string; quantity: number; unitPrice: number; image: string | null }[];
  events: { status: string; note: string | null; createdAt: string }[];
}

async function loadPublicOrder(reference: string): Promise<(PublicOrder & { email: string; phone: string }) | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("orders")
    .select(
      "reference, status, created_at, customer_name, email, phone, city, region, subtotal, delivery_fee, total, order_items(product_name, colorway, size, quantity, unit_price, image), order_events(status, note, created_at)",
    )
    .eq("reference", reference)
    .maybeSingle();
  if (!data) return null;
  return {
    reference: data.reference,
    status: data.status,
    createdAt: data.created_at,
    firstName: String(data.customer_name).split(" ")[0] ?? "",
    email: data.email,
    phone: data.phone,
    subtotal: Number(data.subtotal),
    deliveryFee: Number(data.delivery_fee),
    total: Number(data.total),
    city: data.city,
    region: data.region,
    items: (data.order_items ?? []).map((i: Record<string, unknown>) => ({
      name: i["product_name"] as string,
      colorway: (i["colorway"] as string | null) ?? null,
      size: i["size"] as string,
      quantity: i["quantity"] as number,
      unitPrice: Number(i["unit_price"]),
      image: (i["image"] as string | null) ?? null,
    })),
    events: [...(data.order_events ?? [])]
      .sort((a: { created_at: string }, b: { created_at: string }) =>
        a.created_at.localeCompare(b.created_at),
      )
      .map((e: { status: string; note: string | null; created_at: string }) => ({
        status: e.status,
        note: e.note,
        createdAt: e.created_at,
      })),
  };
}

function stripContact(order: PublicOrder & { email: string; phone: string }): PublicOrder {
  const { email: _email, phone: _phone, ...rest } = order;
  return rest;
}

const referenceSchema = z
  .string()
  .trim()
  .toUpperCase()
  .transform((v) => v.replace(/^#/, ""))
  .pipe(z.string().regex(/^JS-[A-Z0-9]{6,10}$/));

/** Called by the order confirmation page after Paystack redirects back. */
export const getOrderAfterPayment = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ reference: referenceSchema }).parse(input))
  .handler(async ({ data }): Promise<PublicOrder | null> => {
    const order = await loadPublicOrder(data.reference);
    if (!order) return null;
    if (order.status === "pending_payment") {
      try {
        await confirmPayment(data.reference);
      } catch (e) {
        console.error("payment verification failed", e);
      }
      const fresh = await loadPublicOrder(data.reference);
      return fresh ? stripContact(fresh) : null;
    }
    return stripContact(order);
  });

const digits = (v: string) => v.replace(/\D/g, "").slice(-9);

/** Order tracking: the reference plus the email or phone used at checkout. */
export const trackOrder = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ reference: referenceSchema, contact: z.string().trim().min(5).max(200) }).parse(input),
  )
  .handler(async ({ data }): Promise<PublicOrder | null> => {
    const order = await loadPublicOrder(data.reference);
    if (!order) return null;
    const contact = data.contact.toLowerCase();
    const matches =
      contact === order.email.toLowerCase() ||
      (digits(contact).length === 9 && digits(contact) === digits(order.phone));
    return matches ? stripContact(order) : null;
  });
