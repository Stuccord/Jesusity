import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatGHS } from "../data/products";
import { PageHeader } from "../components/common/PageHeader";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Shopping Bag | Jesusity" },
      {
        name: "description",
        content:
          "Review your Jesusity luxury streetwear items, choose delivery, and proceed to checkout.",
      },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, cartCount, cartSubtotal, updateQuantity, removeFromCart } = useCart();

  return (
    <div className="cart-page-container">
      <PageHeader
        eyebrow="ORDER SUMMARY"
        title="YOUR SHOPPING BAG"
        subcopy={`${cartCount} ${cartCount === 1 ? "item" : "items"} selected for dispatch.`}
      />

      {items.length === 0 ? (
        <div className="cart-page-empty">
          <div className="cart-empty-icon">
            <ShoppingBag size={48} strokeWidth={1.2} />
          </div>
          <h2>YOUR SHOPPING BAG IS EMPTY</h2>
          <p>You haven't selected any garments yet. Explore our current seasonal catalog.</p>
          <Link to="/shop" className="cart-empty-btn">
            EXPLORE CATALOG <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="cart-page-grid">
          {/* Left: Line items */}
          <div className="cart-page-items">
            <div className="cart-page-table-header">
              <span>PRODUCT</span>
              <span>QUANTITY</span>
              <span className="text-right">TOTAL</span>
            </div>

            <ul className="cart-page-items-list">
              {items.map((item) => (
                <li key={`${item.id}-${item.size}`} className="cart-page-row">
                  <div className="cart-page-product-cell">
                    <Link
                      to="/products/$slug"
                      params={{ slug: item.slug }}
                      className="cart-page-thumb"
                    >
                      <img src={item.image} alt={item.name} />
                    </Link>
                    <div className="cart-page-product-details">
                      <Link
                        to="/products/$slug"
                        params={{ slug: item.slug }}
                        className="cart-page-item-title"
                      >
                        {item.name}
                      </Link>
                      {item.colorway && <div className="cart-page-item-color">{item.colorway}</div>}
                      <div className="cart-page-item-size">Size: {item.size}</div>
                      <div className="cart-page-item-single-price">
                        {formatGHS(item.price)} each
                      </div>
                      <button
                        type="button"
                        className="cart-page-remove-btn"
                        onClick={() => removeFromCart(item.id, item.size)}
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  </div>

                  <div className="cart-page-qty-cell">
                    <div className="cart-qty-stepper">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="cart-page-total-cell">
                    {formatGHS(item.price * item.quantity)}
                  </div>
                </li>
              ))}
            </ul>

            <div className="cart-page-actions">
              <Link to="/shop" className="cart-continue-link">
                <ArrowLeft size={15} /> Continue Shopping
              </Link>
            </div>
          </div>

          {/* Right: Order Summary box */}
          <div className="cart-page-summary">
            <h2 className="cart-summary-title">ORDER SUMMARY</h2>

            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span>{formatGHS(cartSubtotal)}</span>
            </div>

            <div className="cart-summary-row">
              <span>Estimated Delivery</span>
              <span>{cartSubtotal >= 500 ? "FREE (Accra)" : "Calculated at checkout"}</span>
            </div>

            {cartSubtotal < 500 && (
              <div className="cart-delivery-incentive">
                Add <strong>{formatGHS(500 - cartSubtotal)}</strong> more to receive free delivery
                within Accra.
              </div>
            )}

            <div className="cart-summary-total-row">
              <span>Total</span>
              <span>{formatGHS(cartSubtotal)}</span>
            </div>

            <Link to="/checkout" className="cart-checkout-cta">
              PROCEED TO CHECKOUT <ArrowRight size={16} />
            </Link>

            <div className="cart-perks-list">
              <div>✓ Instant Mobile Money (MTN / Telecel / AT) & Card</div>
              <div>✓ 100% Genuine Jesusity Official Capsule</div>
              <div>✓ Doorstep delivery across Accra & nationwide Ghana</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
