import { createFileRoute } from "@tanstack/react-router";
import { isValidWebhookSignature } from "../../../lib/paystack";
import { confirmPayment } from "../../../lib/orders";

// Paystack calls this after every charge, even if the customer closes the
// browser before returning to the site. Set it in Paystack > Settings >
// API Keys & Webhooks as https://<your-domain>/api/paystack/webhook
export const Route = createFileRoute("/api/paystack/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const valid = await isValidWebhookSignature(
          rawBody,
          request.headers.get("x-paystack-signature"),
        );
        if (!valid) return new Response("invalid signature", { status: 401 });

        try {
          const event = JSON.parse(rawBody) as { event: string; data?: { reference?: string } };
          const reference = event.data?.reference;
          if (event.event === "charge.success" && reference) {
            // Re-verify with Paystack rather than trusting the payload amount
            await confirmPayment(reference);
          }
        } catch (e) {
          console.error("paystack webhook failed", e);
          return new Response("error", { status: 500 });
        }
        return new Response("ok");
      },
    },
  },
});
