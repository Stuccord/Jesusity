import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, MapPin, Package, Search, Truck } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track Order | Jesusity" },
      {
        name: "description",
        content:
          "Track your Jesusity shipment status and estimated doorstep delivery in real time.",
      },
    ],
  }),
  component: TrackOrderPage,
});

function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [searchedOrder, setSearchedOrder] = useState<string | null>("JS-77291");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      setSearchedOrder(orderId.trim().toUpperCase().replace(/^#/, ""));
    }
  };

  const handleSampleClick = () => {
    setOrderId("JS-77291");
    setSearchedOrder("JS-77291");
  };

  return (
    <div className="track-page-container">
      <PageHeader
        eyebrow="ATELIER LOGISTICS"
        title="TRACK YOUR DISPATCH"
        subcopy="Monitor parcel courier movement and estimated arrival in real time."
      />

      <div className="track-content-card">
        <form onSubmit={handleSearch} className="track-search-form">
          <div className="track-input-wrap">
            <Search size={18} className="track-search-icon" />
            <input
              type="text"
              required
              placeholder="ENTER ORDER REFERENCE (E.G. JS-77291)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="track-input"
            />
          </div>
          <button type="submit" className="track-submit-btn">
            LOCATE SHIPMENT
          </button>
        </form>

        <div className="track-sample-prompt">
          <span>Testing?</span>
          <button type="button" onClick={handleSampleClick} className="track-sample-btn">
            Click to load sample order #JS-77291
          </button>
        </div>

        {searchedOrder && (
          <div className="track-result-panel">
            <div className="track-result-header">
              <div>
                <span className="track-order-eyebrow">ORDER REFERENCE</span>
                <h2>#{searchedOrder}</h2>
              </div>
              <div className="track-status-pill">
                <Truck size={14} />
                <span>OUT FOR COURIER DELIVERY</span>
              </div>
            </div>

            <div className="track-meta-row">
              <div>
                <span className="label">Destination:</span>
                <strong>Accra (Osu District)</strong>
              </div>
              <div>
                <span className="label">Estimated Arrival:</span>
                <strong>Today by 4:30 PM GMT</strong>
              </div>
              <div>
                <span className="label">Carrier:</span>
                <strong>Jesusity Direct Courier</strong>
              </div>
            </div>

            {/* Timeline */}
            <div className="track-timeline">
              <div className="track-timeline-step completed">
                <div className="track-dot">
                  <CheckCircle2 size={16} />
                </div>
                <div className="track-step-info">
                  <h4>ORDER CONFIRMED & ALLOCATED</h4>
                  <span>Atelier verified payment and reserved garment from vault.</span>
                  <small>Today, 9:15 AM</small>
                </div>
              </div>

              <div className="track-timeline-step completed">
                <div className="track-dot">
                  <CheckCircle2 size={16} />
                </div>
                <div className="track-step-info">
                  <h4>QUALITY INSPECTION & PACKAGING</h4>
                  <span>Double-needle inspection, steaming, and security tag sealed.</span>
                  <small>Today, 11:30 AM</small>
                </div>
              </div>

              <div className="track-timeline-step active">
                <div className="track-dot pulse">
                  <Truck size={16} />
                </div>
                <div className="track-step-info">
                  <h4>DISPATCHED ON COURIER ROUTE</h4>
                  <span>Courier rider departed central Accra hub. En route to Osu.</span>
                  <small>Today, 1:45 PM</small>
                </div>
              </div>

              <div className="track-timeline-step upcoming">
                <div className="track-dot">
                  <MapPin size={16} />
                </div>
                <div className="track-step-info">
                  <h4>DOORSTEP DELIVERY</h4>
                  <span>Recipient signature upon delivery.</span>
                  <small>Estimated today, 4:30 PM</small>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
