// Server-only Paystack helpers. The secret key never reaches the browser.

const PAYSTACK_API = "https://api.paystack.co";

function secretKey(): string | null {
  return process.env["PAYSTACK_SECRET_KEY"] || null;
}

export function isPaystackConfigured(): boolean {
  return Boolean(secretKey());
}

interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

async function paystack<T>(path: string, init?: RequestInit): Promise<PaystackResponse<T>> {
  const key = secretKey();
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = (await res.json()) as PaystackResponse<T>;
  if (!res.ok || !body.status) {
    throw new Error(`Paystack ${path} failed: ${body.message ?? res.status}`);
  }
  return body;
}

export async function initializeTransaction(opts: {
  email: string;
  amountPesewas: number;
  reference: string;
  callbackUrl: string;
  channels: string[];
  metadata: Record<string, unknown>;
}): Promise<{ authorization_url: string; access_code: string; reference: string }> {
  const { data } = await paystack<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: opts.email,
      amount: opts.amountPesewas,
      currency: "GHS",
      reference: opts.reference,
      callback_url: opts.callbackUrl,
      channels: opts.channels,
      metadata: opts.metadata,
    }),
  });
  return data;
}

export interface PaystackTransaction {
  id: number;
  status: "success" | "failed" | "abandoned" | "ongoing" | "pending" | "processing" | "reversed";
  reference: string;
  amount: number;
  currency: string;
  channel: string;
}

export async function verifyTransaction(reference: string): Promise<PaystackTransaction> {
  const { data } = await paystack<PaystackTransaction>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
  return data;
}

/** Checks the x-paystack-signature header (HMAC-SHA512 of the raw body with the secret key). */
export async function isValidWebhookSignature(rawBody: string, signature: string | null) {
  const key = secretKey();
  if (!key || !signature) return false;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(rawBody));
  const hex = Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}
