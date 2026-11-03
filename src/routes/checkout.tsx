import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatGHS } from "../data/products";
import { PageHeader } from "../components/common/PageHeader";
import { GHANA_REGIONS, STORE, deliveryFeeFor } from "../config/store";
import { createCheckout } from "../lib/orders";
import { checkVipDiscount, normalizeGhanaPhone, vipDiscountFor } from "../lib/vip";

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
  const { items, cartSubtotal, isCartReady } = useCart();

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // VIP list members get their discount on the first paid order with their number
  const [vipPhone, setVipPhone] = useState<string | null>(null);
  const normalizedPhone = normalizeGhanaPhone(contact.phone);
  useEffect(() => {
    if (!normalizedPhone) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      checkVipDiscount({ data: { phone: normalizedPhone } })
        .then((r) => {
          if (!cancelled) setVipPhone(r.eligible ? normalizedPhone : null);
        })
        .catch(() => {});
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [normalizedPhone]);

  // Display only: the server recalculates every price and fee before charging
  const deliveryFee = deliveryFeeFor(cartSubtotal);
  const vipDiscount =
    vipPhone !== null && vipPhone === normalizedPhone ? vipDiscountFor(cartSubtotal) : 0;
  const grandTotal = cartSubtotal - vipDiscount + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createCheckout({
        data: {
          ...contact,
          region: contact.region as (typeof GHANA_REGIONS)[number],
          notes: contact.notes || undefined,
          channel: paymentMethod,
          items: items.map((i) => ({ productId: i.id, size: i.size, quantity: i.quantity })),
        },
      });
      if (!result.ok) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }
      // Hand over to Paystack's secure payment page; it returns to /order-confirmed
      window.location.assign(result.authorizationUrl);
    } catch {
      setError("Please check your details (name, email, phone and address) and try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-page-container">
      <PageHeader
        eyebrow="SECURE DISPATCH"
        title="CHECKOUT"
        subcopy="Complete your details to authorize delivery and payment."
      />

      {!isCartReady ? null : items.length === 0 ? (
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
                {vipDiscount > 0 && (
                  <p className="checkout-vip-note">
                    <CheckCircle2 size={14} /> VIP number: {STORE.vipDiscountPercent}% off applied
                  </p>
                )}
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
                    {GHANA_REGIONS.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="checkout-input-field">
                <label htmlFor="notes">Delivery Notes (optional)</label>
                <input
                  id="notes"
                  type="text"
                  maxLength={500}
                  placeholder="Gate colour, best time to call, etc."
                  value={contact.notes}
                  onChange={(e) => setContact({ ...contact, notes: e.target.value })}
                />
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
                    <span>MTN MoMo, Telecel Cash or AirtelTigo Money</span>
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
                    <span>Visa or Mastercard, verified with 3D Secure</span>
                  </div>
                </label>
              </div>

              <p className="momo-instructions">
                You'll be taken to Paystack's secure page to pay. For Mobile Money, approve the
                prompt on your phone (MTN, Telecel or AirtelTigo).
              </p>
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
                {vipDiscount > 0 && (
                  <div className="checkout-totals-row checkout-vip-row">
                    <span>VIP discount ({STORE.vipDiscountPercent}%)</span>
                    <span>−{formatGHS(vipDiscount)}</span>
                  </div>
                )}
                <div className="checkout-totals-row">
                  <span>Delivery</span>
                  <span>{deliveryFee === 0 ? "FREE" : formatGHS(deliveryFee)}</span>
                </div>
                <div className="checkout-grand-total">
                  <span>TOTAL DUE</span>
                  <span>{formatGHS(grandTotal)}</span>
                </div>
              </div>

              {error && (
                <p className="checkout-error" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" disabled={isSubmitting} className="checkout-submit-btn">
                {isSubmitting ? (
                  "CONNECTING TO PAYSTACK..."
                ) : (
                  <>
                    <Lock size={16} /> PAY {formatGHS(grandTotal)}
                  </>
                )}
              </button>

              <div className="checkout-guarantee">
                <ShieldCheck size={16} />
                <span>Payments processed securely by Paystack</span>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
