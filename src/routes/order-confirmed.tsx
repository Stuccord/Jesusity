import { useEffect } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatGHS } from "../data/products";
import { getOrderAfterPayment } from "../lib/orders";
import { OrderTimeline } from "../components/common/OrderTimeline";

interface ConfirmSearch {
  ref?: string;
}

export const Route = createFileRoute("/order-confirmed")({
  validateSearch: (search: Record<string, unknown>): ConfirmSearch => {
    // Paystack appends ?reference=… (and ?trxref=…) to the callback URL
    const ref = search["ref"] ?? search["reference"] ?? search["trxref"];
    return typeof ref === "string" ? { ref } : {};
  },
  loaderDeps: ({ search }) => ({ ref: search.ref }),
  loader: async ({ deps }) => {
    if (!deps.ref) return null;
    try {
      return await getOrderAfterPayment({ data: { reference: deps.ref } });
    } catch {
      return null;
    }
  },
  head: () => ({
    meta: [{ title: "Your Order | Jesusity" }, { name: "robots", content: "noindex" }],
  }),
  component: OrderConfirmedPage,
});

const PAID = ["paid", "processing", "shipped", "delivered"];

function OrderConfirmedPage() {
  const order = Route.useLoaderData();
  const router = useRouter();
  const { clearCart } = useCart();
  const isPaid = Boolean(order && PAID.includes(order.status));
  const isPending = order?.status === "pending_payment";

  useEffect(() => {
    if (isPaid) clearCart();
  }, [isPaid, clearCart]);

  // Mobile Money can take a few seconds to settle; check again automatically
  useEffect(() => {
    if (!isPending) return;
    const timer = setTimeout(() => router.invalidate(), 5000);
    return () => clearTimeout(timer);
  }, [isPending, router]);

  if (!order) {
    return (
      <div className="order-confirmed-container">
        <div className="order-confirmed-card">
          <div className="order-confirmed-icon-wrap">
            <AlertCircle size={46} className="text-[#111111]" />
          </div>
          <h1 className="order-confirmed-title">ORDER NOT FOUND</h1>
          <p className="order-confirmed-message">
            We couldn't find this order. If you were charged, contact us with your payment receipt
            and we'll sort it out.
          </p>
          <div className="order-confirmed-actions">
            <Link to="/shop" className="order-confirmed-btn-primary">
              CONTINUE SHOPPING <ArrowRight size={16} />
            </Link>
            <Link to="/contact" className="order-confirmed-btn-secondary">
              CONTACT US
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirmed-container">
      <div className="order-confirmed-card">
        <div className="order-confirmed-icon-wrap">
          {isPaid ? (
            <CheckCircle2 size={46} className="text-[#111111]" />
          ) : isPending ? (
            <Clock size={46} className="text-[#111111]" />
          ) : (
            <AlertCircle size={46} className="text-[#111111]" />
          )}
        </div>

        <div className="order-confirmed-eyebrow">
          {isPaid ? "PAYMENT RECEIVED" : isPending ? "CONFIRMING PAYMENT" : "PAYMENT NOT COMPLETED"}
        </div>
        <h1 className="order-confirmed-title">
          {isPaid ? `THANK YOU${order.firstName ? `, ${order.firstName.toUpperCase()}` : ""}` : isPending ? "ALMOST THERE" : "PAYMENT FAILED"}
        </h1>
        <div className="order-confirmed-id">ORDER REFERENCE: #{order.reference}</div>

        <p className="order-confirmed-message">
          {isPaid
            ? "Your order is confirmed. Keep your order reference to track delivery. A receipt from Paystack has been sent to your email."
            : isPending
              ? "We're waiting for confirmation from Paystack. If you paid with Mobile Money, approve the prompt on your phone. This page updates automatically."
              : "Your payment didn't go through and you have not been charged for this order. Your bag is saved, so you can try again."}
        </p>

        <div className="order-confirmed-details-box">
          {order.items.map((item) => (
            <div key={`${item.name}-${item.size}`} className="order-detail-row">
              <span className="order-detail-label">
                {item.name} · {item.size} × {item.quantity}
              </span>
              <span className="order-detail-value">{formatGHS(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
          <div className="order-detail-row">
            <span className="order-detail-label">Delivery</span>
            <span className="order-detail-value">
              {order.deliveryFee === 0 ? "Free" : formatGHS(order.deliveryFee)}
            </span>
          </div>
          <div className="order-detail-row">
            <span className="order-detail-label">Total</span>
            <span className="order-detail-value text-[#111111]">{formatGHS(order.total)}</span>
          </div>
          <div className="order-detail-row">
            <span className="order-detail-label">Delivering to</span>
            <span className="order-detail-value">
              {order.city}, {order.region}
            </span>
          </div>
        </div>

        {isPaid && <OrderTimeline order={order} />}

        <div className="order-confirmed-actions">
          {isPaid || isPending ? (
            <>
              <Link to="/shop" className="order-confirmed-btn-primary">
                CONTINUE SHOPPING <ArrowRight size={16} />
              </Link>
              <Link
                to="/track"
                search={{ ref: order.reference }}
                className="order-confirmed-btn-secondary"
              >
                TRACK ORDER
              </Link>
            </>
          ) : (
            <>
              <Link to="/checkout" className="order-confirmed-btn-primary">
                TRY AGAIN <ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="order-confirmed-btn-secondary">
                CONTACT US
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
