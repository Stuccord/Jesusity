import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight, Package, Truck } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";

export const Route = createFileRoute("/order-confirmed")({
  head: () => ({
    meta: [
      { title: "Order Confirmed | Supernatural Apparel" },
      {
        name: "description",
        content:
          "Thank you for your order with Supernatural. Your official garment is being prepared for dispatch.",
      },
    ],
  }),
  component: OrderConfirmedPage,
});

function OrderConfirmedPage() {
  const orderNumber = "SN-" + Math.floor(100000 + Math.random() * 900000);

  return (
    <div className="order-confirmed-container">
      <div className="order-confirmed-card">
        <div className="order-confirmed-icon-wrap">
          <CheckCircle2 size={46} className="text-[#C9A24B]" />
        </div>

        <div className="order-confirmed-eyebrow">TRANSACTION AUTHORIZED</div>
        <h1 className="order-confirmed-title">ORDER CONFIRMED</h1>
        <div className="order-confirmed-id">ORDER REFERENCE: #{orderNumber}</div>

        <p className="order-confirmed-message">
          Your allocation has been secured in the Supernatural atelier. We are currently inspecting,
          steaming, and packaging your garment with official authenticity tags.
        </p>

        <div className="order-confirmed-details-box">
          <div className="order-detail-row">
            <span className="order-detail-label">Status</span>
            <span className="order-detail-value text-[#C9A24B]">Processing Dispatch</span>
          </div>
          <div className="order-detail-row">
            <span className="order-detail-label">Estimated Delivery</span>
            <span className="order-detail-value">
              Next business day (Accra) / 2–3 days (Nationwide)
            </span>
          </div>
          <div className="order-detail-row">
            <span className="order-detail-label">Payment Method</span>
            <span className="order-detail-value">Mobile Money / Secure Card</span>
          </div>
        </div>

        <div className="order-confirmed-actions">
          <Link to="/shop" className="order-confirmed-btn-primary">
            CONTINUE SHOPPING <ArrowRight size={16} />
          </Link>
          <Link to="/track" className="order-confirmed-btn-secondary">
            TRACK ORDER DISPATCH
          </Link>
        </div>
      </div>
    </div>
  );
}
