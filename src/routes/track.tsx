import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Package, Search } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { OrderTimeline } from "../components/common/OrderTimeline";
import { trackOrder, type PublicOrder } from "../lib/orders";
import { ORDER_STATUS_LABELS } from "../config/store";
import { formatGHS } from "../data/products";

interface TrackSearch {
  ref?: string;
}

export const Route = createFileRoute("/track")({
  validateSearch: (search: Record<string, unknown>): TrackSearch =>
    typeof search["ref"] === "string" ? { ref: search["ref"] } : {},
  head: () => ({
    meta: [
      { title: "Track Order | Jesusity" },
      {
        name: "description",
        content: "Check the status of your Jesusity order with your order reference.",
      },
    ],
  }),
  component: TrackOrderPage,
});

function TrackOrderPage() {
  const { ref } = Route.useSearch();
  const [reference, setReference] = useState(ref ?? "");
  const [contact, setContact] = useState("");
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setOrder(null);
    try {
      const result = await trackOrder({ data: { reference, contact } });
      if (result) setOrder(result);
      else
        setError(
          "We couldn't find an order with those details. Check the reference from your confirmation and use the same email or phone number you checked out with.",
        );
    } catch {
      setError("Enter your order reference (e.g. JS-ABCD2345) and the email or phone you used.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="track-page-container">
      <PageHeader
        eyebrow="ORDER STATUS"
        title="TRACK YOUR ORDER"
        subcopy="Enter your order reference and the email or phone number you used at checkout."
      />

      <div className="track-content-card">
        <form onSubmit={handleSearch} className="track-search-form">
          <div className="track-input-wrap">
            <Search size={18} className="track-search-icon" />
            <input
              type="text"
              required
              autoCapitalize="characters"
              placeholder="ORDER REFERENCE (E.G. JS-ABCD2345)"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="track-input"
              aria-label="Order reference"
            />
          </div>
          <div className="track-input-wrap">
            <input
              type="text"
              required
              placeholder="EMAIL OR PHONE USED AT CHECKOUT"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="track-input track-input-plain"
              aria-label="Email or phone number"
            />
          </div>
          <button type="submit" className="track-submit-btn" disabled={isLoading}>
            {isLoading ? "SEARCHING..." : "FIND ORDER"}
          </button>
        </form>

        {error && (
          <p className="checkout-error" role="alert">
            {error}
          </p>
        )}

        {order && (
          <div className="track-result-panel">
            <div className="track-result-header">
              <div>
                <span className="track-order-eyebrow">ORDER REFERENCE</span>
                <h2>#{order.reference}</h2>
              </div>
              <div className="track-status-pill">
                <Package size={14} />
                <span>{(ORDER_STATUS_LABELS[order.status] ?? order.status).toUpperCase()}</span>
              </div>
            </div>

            <div className="track-meta-row">
              <div>
                <span className="label">Destination:</span>
                <strong>
                  {order.city}, {order.region}
                </strong>
              </div>
              <div>
                <span className="label">Items:</span>
                <strong>{order.items.reduce((n, i) => n + i.quantity, 0)}</strong>
              </div>
              <div>
                <span className="label">Total:</span>
                <strong>{formatGHS(order.total)}</strong>
              </div>
            </div>

            <OrderTimeline order={order} />
          </div>
        )}
      </div>
    </div>
  );
}
