import { CheckCircle2, Clock, MapPin, Package, Truck, XCircle } from "lucide-react";
import type { PublicOrder } from "../../lib/orders";

const STEPS = [
  { status: "pending_payment", title: "ORDER PLACED", body: "We've received your order." },
  { status: "paid", title: "PAYMENT RECEIVED", body: "Your payment was confirmed." },
  { status: "processing", title: "BEING PREPARED", body: "Your order is being packed." },
  { status: "shipped", title: "OUT FOR DELIVERY", body: "Your order is on its way." },
  { status: "delivered", title: "DELIVERED", body: "Your order has been delivered." },
] as const;

const RANK: Record<string, number> = {
  pending_payment: 0,
  paid: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
};

const ICONS = [Clock, CheckCircle2, Package, Truck, MapPin];

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function OrderTimeline({ order }: { order: PublicOrder }) {
  const stopped = ["payment_failed", "cancelled", "refunded"].includes(order.status);
  const current = RANK[order.status] ?? 0;
  const timeFor = (status: string) =>
    [...order.events].reverse().find((e) => e.status === status)?.createdAt;
  const latestNote = [...order.events].reverse().find((e) => e.note)?.note;

  if (stopped) {
    const last = order.events[order.events.length - 1];
    return (
      <div className="track-timeline">
        <div className="track-timeline-step active">
          <div className="track-dot">
            <XCircle size={16} />
          </div>
          <div className="track-step-info">
            <h4>
              {order.status === "payment_failed"
                ? "PAYMENT NOT COMPLETED"
                : order.status === "refunded"
                  ? "REFUNDED"
                  : "CANCELLED"}
            </h4>
            <span>{last?.note ?? "This order is not active."}</span>
            {last && <small>{formatWhen(last.createdAt)}</small>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="track-timeline">
      {STEPS.map((step, i) => {
        const Icon = ICONS[i]!;
        const state = i < current ? "completed" : i === current ? "active" : "upcoming";
        const when = i === 0 ? order.createdAt : timeFor(step.status);
        return (
          <div key={step.status} className={`track-timeline-step ${state}`}>
            <div className={`track-dot ${state === "active" ? "pulse" : ""}`}>
              <Icon size={16} />
            </div>
            <div className="track-step-info">
              <h4>{step.title}</h4>
              <span>{state === "active" && i > 0 && latestNote ? latestNote : step.body}</span>
              {when && state !== "upcoming" && <small>{formatWhen(when)}</small>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
