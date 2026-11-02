import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Heart, MapPin, Package, Shield, User } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { ComingTogetherBlock } from "../components/common/ComingTogetherBlock";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account | Jesusity" },
      {
        name: "description",
        content:
          "Access your Jesusity profile, track active orders, manage delivery addresses, and view your wishlist.",
      },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "wishlist" | "addresses" | "profile">(
    "orders",
  );

  return (
    <div className="account-page-container">
      <PageHeader
        eyebrow="CLIENT PORTAL"
        title="MY ACCOUNT"
        subcopy="Manage your orders, dispatch addresses, and private wishlist."
      />

      {/* Tabs */}
      <div className="account-tabs-bar">
        <button
          type="button"
          className={`account-tab-btn ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          <Package size={15} />
          <span>ORDER HISTORY</span>
        </button>
        <button
          type="button"
          className={`account-tab-btn ${activeTab === "wishlist" ? "active" : ""}`}
          onClick={() => setActiveTab("wishlist")}
        >
          <Heart size={15} />
          <span>SAVED WISHLIST</span>
        </button>
        <button
          type="button"
          className={`account-tab-btn ${activeTab === "addresses" ? "active" : ""}`}
          onClick={() => setActiveTab("addresses")}
        >
          <MapPin size={15} />
          <span>DELIVERY ADDRESSES</span>
        </button>
        <button
          type="button"
          className={`account-tab-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <User size={15} />
          <span>PROFILE SETTINGS</span>
        </button>
      </div>

      <div className="account-content-area">
        {activeTab === "orders" && (
          <div className="account-section-card">
            <div className="account-orders-header">
              <h3>RECENT ORDERS</h3>
              <Link to="/track" className="account-track-link">
                Track by ID <ArrowRight size={13} />
              </Link>
            </div>

            <div className="account-order-item">
              <div className="account-order-top">
                <div>
                  <strong>ORDER #JS-77291</strong>
                  <span className="account-order-date">Placed October 10, 2026</span>
                </div>
                <span className="account-status-badge status-delivered">DELIVERED</span>
              </div>
              <p className="account-order-summary">
                1x The Most Valuable Fish Tee (Vintage Black - Size L) • GH₵200.00
              </p>
            </div>

            <div className="account-order-item">
              <div className="account-order-top">
                <div>
                  <strong>ORDER #JS-68214</strong>
                  <span className="account-order-date">Placed September 28, 2026</span>
                </div>
                <span className="account-status-badge status-delivered">DELIVERED</span>
              </div>
              <p className="account-order-summary">
                1x Thorny Crown Heavyweight Tee (Noir / White - Size XL) • GH₵200.00
              </p>
            </div>
          </div>
        )}

        {activeTab === "wishlist" && (
          <div className="account-section-card">
            <h3>SAVED PIECES</h3>
            <p className="account-subcopy">
              Items you mark with the heart icon while exploring our catalog will appear here for
              fast reservation.
            </p>
            <div className="mt-6">
              <ComingTogetherBlock
                title="Wishlist Synchronization"
                subtitle="Curate your private selection of upcoming drop capsules and archival restocks."
                primaryActionText="Explore Catalog"
                primaryActionHref="/shop"
              />
            </div>
          </div>
        )}

        {activeTab === "addresses" && (
          <div className="account-section-card">
            <h3>SAVED ADDRESSES</h3>
            <div className="account-address-card">
              <div className="account-address-title">PRIMARY RESIDENCE (ACCRA)</div>
              <p>Kwame Mensah</p>
              <p>14 Ring Road Central, near Danquah Circle</p>
              <p>Osu, Accra, Greater Accra, Ghana</p>
              <p>Phone: +233 (0) 54 892 0192</p>
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="account-section-card">
            <h3>CLIENT PROFILE</h3>
            <p className="account-subcopy">Manage contact preferences and notifications.</p>
            <div className="mt-4">
              <ComingTogetherBlock
                title="VIP Member Access"
                subtitle="Private member keys and priority drop access will be unlocked in Drop 02."
                primaryActionText="Explore Best Sellers"
                primaryActionHref="/shop?sort=best-selling"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
