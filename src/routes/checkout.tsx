import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatGHS } from "../data/products";
import { PageHeader } from "../components/common/PageHeader";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | Jesusity" },
      {
        name: "description",
        content:
          "Secure checkout for Jesusity. Pay with Mobile Money or Credit/Debit card.",
      },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, cartSubtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "Accra",
    region: "Greater Accra",
    notes: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"momo" | "card">("momo");
  const [momoProvider, setMomoProvider] = useState("MTN Mobile Money");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deliveryFee = cartSubtotal >= 500 ? 0 : 35;
  const grandTotal = cartSubtotal + deliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setIsSubmitting(true);

    setTimeout(() => {
      clearCart();
      setIsSubmitting(false);
      navigate({ to: "/order-confirmed" });
    }, 900);
  };

  return (
    <div className="checkout-page-container">
      <PageHeader
        eyebrow="SECURE DISPATCH"
        title="CHECKOUT"
        subcopy="Complete your details to authorize delivery and payment."
      />

      {items.length === 0 ? (
        <div className="cart-page-empty">
          <h2>YOUR BAG IS EMPTY</h2>
          <p>Please add garments before proceeding to checkout.</p>
          <Link to="/shop" className="cart-empty-btn">
            EXPLORE SHOP
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="checkout-grid">
          {/* Left Column: Form Details */}
          <div className="checkout-form-column">
            {/* Step 1: Contact Details */}
            <div className="checkout-card">
              <div className="checkout-step-header">
                <span className="checkout-step-number">01</span>
                <h3>CONTACT & RECIPIENT</h3>
              </div>
              <div className="checkout-input-row">
                <div className="checkout-input-field">
                  <label htmlFor="fullname">Full Name *</label>
                  <input
                    id="fullname"
                    type="text"
                    required
                    placeholder="e.g. Kwame Mensah"
                    value={contact.name}
                    onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  />
                </div>
                <div className="checkout-input-field">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="checkout-input-field">
                <label htmlFor="phone">Phone / MoMo Number *</label>
                <input
                  id="phone"
                  type="tel"
                  required
                  placeholder="024 123 4567"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Step 2: Delivery Address */}
            <div className="checkout-card">
              <div className="checkout-step-header">
                <span className="checkout-step-number">02</span>
                <h3>DELIVERY DESTINATION</h3>
              </div>
              <div className="checkout-input-field">
                <label htmlFor="address">Street Address / Landmark *</label>
                <input
                  id="address"
                  type="text"
                  required
                  placeholder="e.g. 14 Ring Road Central, near Danquah Circle"
                  value={contact.address}
                  onChange={(e) => setContact({ ...contact, address: e.target.value })}
                />
              </div>

              <div className="checkout-input-row">
                <div className="checkout-input-field">
                  <label htmlFor="city">City / Area *</label>
                  <input
                    id="city"
                    type="text"
                    required
                    placeholder="Accra"
                    value={contact.city}
                    onChange={(e) => setContact({ ...contact, city: e.target.value })}
                  />
                </div>
                <div className="checkout-input-field">
                  <label htmlFor="region">Region *</label>
                  <select
                    id="region"
                    value={contact.region}
                    onChange={(e) => setContact({ ...contact, region: e.target.value })}
                  >
                    <option value="Greater Accra">Greater Accra</option>
                    <option value="Ashanti">Ashanti Region</option>
                    <option value="Western">Western Region</option>
                    <option value="Central">Central Region</option>
                    <option value="Eastern">Eastern Region</option>
                    <option value="International">International Delivery</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Payment Method */}
            <div className="checkout-card">
              <div className="checkout-step-header">
                <span className="checkout-step-number">03</span>
                <h3>PAYMENT METHOD</h3>
              </div>

              <div className="payment-options-grid">
                <label
                  className={`payment-option-card ${paymentMethod === "momo" ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="momo"
                    checked={paymentMethod === "momo"}
                    onChange={() => setPaymentMethod("momo")}
                  />
                  <div>
                    <strong>Mobile Money (MoMo)</strong>
                    <span>Instant prompt on MTN, Telecel, or AT</span>
                  </div>
                </label>

                <label
                  className={`payment-option-card ${paymentMethod === "card" ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                  />
                  <div>
                    <strong>Credit / Debit Card</strong>
                    <span>Visa, Mastercard & 3D Secure</span>
                  </div>
                </label>
              </div>

              {paymentMethod === "momo" && (
                <div className="momo-provider-select">
                  <label htmlFor="momoProvider">Select Network Operator</label>
                  <select
                    id="momoProvider"
                    value={momoProvider}
                    onChange={(e) => setMomoProvider(e.target.value)}
                  >
                    <option value="MTN Mobile Money">MTN Mobile Money (*170#)</option>
                    <option value="Telecel Cash">Telecel Cash (*110#)</option>
                    <option value="AT Money">AT Money (*110#)</option>
                  </select>
                  <p className="momo-instructions">
                    Upon clicking place order, an authorization prompt will appear on your mobile
                    phone to complete payment.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary & Place Order */}
          <div className="checkout-summary-column">
            <div className="checkout-summary-card">
              <h3>YOUR ORDER ({items.length})</h3>

              <div className="checkout-items-preview">
                {items.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="checkout-item-line">
                    <img src={item.image} alt={item.name} />
                    <div className="checkout-item-info">
                      <span className="checkout-item-title">{item.name}</span>
                      <span className="checkout-item-meta">
                        Size: {item.size} • Qty: {item.quantity}
                      </span>
                    </div>
                    <span className="checkout-item-total">
                      {formatGHS(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="checkout-totals-block">
                <div className="checkout-totals-row">
                  <span>Subtotal</span>
                  <span>{formatGHS(cartSubtotal)}</span>
                </div>
                <div className="checkout-totals-row">
                  <span>Delivery</span>
                  <span>{deliveryFee === 0 ? "FREE (Accra)" : formatGHS(deliveryFee)}</span>
                </div>
                <div className="checkout-grand-total">
                  <span>TOTAL DUE</span>
                  <span>{formatGHS(grandTotal)}</span>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="checkout-submit-btn">
                {isSubmitting ? (
                  "AUTHORIZING DISPATCH..."
                ) : (
                  <>
                    <Lock size={16} /> AUTHORIZE & PLACE ORDER ({formatGHS(grandTotal)})
                  </>
                )}
              </button>

              <div className="checkout-guarantee">
                <ShieldCheck size={16} />
                <span>256-Bit Encrypted Payment • Official Jesusity Guarantee</span>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
