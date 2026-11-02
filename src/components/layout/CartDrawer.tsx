import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { formatGHS } from "../../data/products";

const FREE_DELIVERY_THRESHOLD = 500;

export function CartDrawer() {
  const { items, isCartOpen, closeCart, cartCount, cartSubtotal, updateQuantity, removeFromCart } =
    useCart();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape & trap scroll
  useEffect(() => {
    if (!isCartOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeCart();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isCartOpen, closeCart]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`cart-drawer-backdrop ${isCartOpen ? "open" : ""}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Slide-in drawer */}
      <aside
        ref={drawerRef}
        className={`cart-drawer ${isCartOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
      >
        {/* Drawer Header */}
        <div className="cart-drawer-header">
          <div className="cart-drawer-title">
            <ShoppingBag size={18} />
            <span>SHOPPING BAG ({cartCount})</span>
          </div>
          <button
            type="button"
            className="cart-drawer-close"
            onClick={closeCart}
            aria-label="Close shopping bag"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress */}
        <div className="cart-drawer-perk">
          {cartSubtotal >= FREE_DELIVERY_THRESHOLD ? (
            <span className="cart-perk-qualified">✓ YOU QUALIFY FOR FREE ACCRA DELIVERY</span>
          ) : (
            <span>
              ADD{" "}
              <strong className="text-white">
                {formatGHS(FREE_DELIVERY_THRESHOLD - cartSubtotal)}
              </strong>{" "}
              MORE FOR FREE ACCRA DELIVERY
            </span>
          )}
          <div
            className={`cart-perk-meter ${cartSubtotal >= FREE_DELIVERY_THRESHOLD ? "complete" : ""}`}
            role="progressbar"
            aria-label="Progress to free delivery"
            aria-valuemin={0}
            aria-valuemax={FREE_DELIVERY_THRESHOLD}
            aria-valuenow={Math.min(cartSubtotal, FREE_DELIVERY_THRESHOLD)}
          >
            <div
              className="cart-perk-meter-fill"
              style={{ width: `${Math.min(100, (cartSubtotal / FREE_DELIVERY_THRESHOLD) * 100)}%` }}
            />
          </div>
        </div>

        {/* Items List or Empty State */}
        <div className="cart-drawer-body">
          {items.length === 0 ? (
            <div className="cart-drawer-empty">
              <div className="cart-empty-icon">
                <ShoppingBag size={42} strokeWidth={1.2} />
              </div>
              <h3>YOUR BAG IS EMPTY</h3>
              <p>Explore our latest drops and heavyweight essentials.</p>
              <Link
                to="/shop"
                search={{ sort: "best-selling" }}
                className="cart-empty-btn"
                onClick={closeCart}
              >
                EXPLORE BEST SELLERS <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <ul className="cart-items-list">
              {items.map((item) => (
                <li key={`${item.id}-${item.size}`} className="cart-item">
                  <Link
                    to="/products/$slug"
                    params={{ slug: item.slug }}
                    className="cart-item-image-wrap"
                    onClick={closeCart}
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div className="cart-item-img-placeholder" />
                    )}
                  </Link>

                  <div className="cart-item-details">
                    <div className="cart-item-top">
                      <Link
                        to="/products/$slug"
                        params={{ slug: item.slug }}
                        className="cart-item-name"
                        onClick={closeCart}
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        className="cart-item-remove"
                        onClick={() => removeFromCart(item.id, item.size)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="cart-item-meta">
                      {item.colorway && <span className="cart-item-color">{item.colorway}</span>}
                      <span className="cart-item-size">Size: {item.size}</span>
                    </div>

                    <div className="cart-item-bottom">
                      <div className="cart-qty-stepper" role="group" aria-label="Item quantity">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="cart-item-price">{formatGHS(item.price * item.quantity)}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-drawer-subtotal-row">
              <span className="cart-subtotal-label">SUBTOTAL</span>
              <span className="cart-subtotal-amount">{formatGHS(cartSubtotal)}</span>
            </div>
            <p className="cart-drawer-tax-note">Taxes and shipping calculated at checkout.</p>
            <div className="cart-drawer-ctas">
              <Link to="/checkout" className="cart-checkout-btn" onClick={closeCart}>
                CHECKOUT
              </Link>
              <Link to="/cart" className="cart-view-btn" onClick={closeCart}>
                VIEW CART
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
