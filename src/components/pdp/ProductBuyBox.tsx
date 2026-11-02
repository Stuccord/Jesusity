import { useState, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Heart, Mail, ShieldCheck, Shirt, Sparkles, Star, Truck } from "lucide-react";
import { type Product, formatGHS } from "../../data/products";
import { useCart } from "../../context/CartContext";

interface ProductBuyBoxProps {
  product: Product;
  selectedSize: string | null;
  onSelectSize: (size: string) => void;
  onOpenSizeGuide: () => void;
  sizeSelectorRef: React.RefObject<HTMLDivElement | null>;
  shakeSize: boolean;
  onTriggerShake: () => void;
}

export function ProductBuyBox({
  product,
  selectedSize,
  onSelectSize,
  onOpenSizeGuide,
  sizeSelectorRef,
  shakeSize,
  onTriggerShake,
}: ProductBuyBoxProps) {
  const navigate = useNavigate();
  const { addToCart, openCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySuccess, setNotifySuccess] = useState(false);

  // Wishlist state
  const [isWishlisted, setIsWishlisted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("supernatural_wishlist");
      if (!saved) return false;
      const list: string[] = JSON.parse(saved);
      return list.includes(product.id);
    } catch {
      return false;
    }
  });
  const [isHeartPopping, setIsHeartPopping] = useState(false);

  // Stock calculations
  const inStockSizes = product.sizes.filter((s) => s.inStock);
  const isSoldOut = inStockSizes.length === 0 || product.badge === "SOLD OUT";
  const isLowStock = inStockSizes.length >= 1 && inStockSizes.length <= 3;

  const toggleWishlist = () => {
    setIsHeartPopping(true);
    setTimeout(() => setIsHeartPopping(false), 450);

    setIsWishlisted((prev) => {
      const next = !prev;
      try {
        const saved = localStorage.getItem("supernatural_wishlist");
        let list: string[] = saved ? JSON.parse(saved) : [];
        if (next) {
          if (!list.includes(product.id)) list.push(product.id);
        } else {
          list = list.filter((id) => id !== product.id);
        }
        localStorage.setItem("supernatural_wishlist", JSON.stringify(list));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleAddToCart = () => {
    if (isSoldOut) return;
    if (!selectedSize) {
      onTriggerShake();
      return;
    }

    addToCart(product, selectedSize, quantity);
    setIsAdded(true);
    openCart();
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleBuyNow = () => {
    if (isSoldOut) return;
    if (!selectedSize) {
      onTriggerShake();
      return;
    }

    addToCart(product, selectedSize, quantity);
    navigate({ to: "/checkout" });
  };

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail) return;
    setNotifySuccess(true);
    setTimeout(() => setNotifySuccess(false), 4000);
    setNotifyEmail("");
  };

  return (
    <div className="pdp-buybox-root">
      {/* 1. BADGE ROW: badge if exists + LOW STOCK if 1-3 sizes remain */}
      <div className="pdp-badge-row">
        {product.badge && (
          <span
            className={`pdp-badge-pill badge-${product.badge.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {product.badge}
          </span>
        )}
        {isLowStock && !isSoldOut && (
          <span className="pdp-badge-pill pdp-badge-low-stock">LOW STOCK</span>
        )}
      </div>

      {/* 2. NAME & COLORWAY */}
      <div className="pdp-name-group">
        <h1 className="pdp-title">{product.name}</h1>
        <div className="pdp-colorway-label">{product.colorway}</div>
      </div>

      {/* 3. SCRIPTURE TAG (only if story.scripture exists) */}
      {product.story?.scripture && (
        <div className="pdp-scripture-tag">
          <span className="pdp-scripture-text">{product.story.scripture}</span>
        </div>
      )}

      {/* 4. PRICE & PAYMENT NOTE */}
      <div className="pdp-price-group">
        <div className="pdp-price-row">
          <span className="pdp-current-price">{formatGHS(product.price)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="pdp-compare-price">{formatGHS(product.compareAtPrice)}</span>
          )}
        </div>
        <span className="pdp-payment-note">Pay with MoMo or card</span>
      </div>

      {/* 5. RATING ROW (render ONLY if reviewCount > 0) */}
      {product.reviewCount !== undefined && product.reviewCount > 0 && (
        <div className="pdp-rating-row" aria-label={`Rating: ${product.rating || 5.0} stars`}>
          <div className="pdp-stars-flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={14} fill="#000000" stroke="#000000" />
            ))}
          </div>
          <span className="pdp-rating-score">
            {product.rating ? product.rating.toFixed(1) : "5.0"}
          </span>
          <span className="pdp-rating-count">
            ({product.reviewCount} {product.reviewsVerified ? "verified reviews" : "reviews"})
          </span>
        </div>
      )}

      {/* 6. SWATCHES (if linked variants exist) */}
      {product.swatches && product.swatches.length > 1 && (
        <div className="pdp-swatches-section">
          <span className="pdp-swatches-label">AVAILABLE COLORWAYS</span>
          <div className="pdp-swatches-list">
            {product.swatches.map((swatch) => {
              const isCurrent = swatch.active || swatch.colorway === product.colorway;
              if (isCurrent) {
                return (
                  <div
                    key={swatch.colorway}
                    className="pdp-swatch-circle active"
                    style={{ backgroundColor: swatch.hex }}
                    title={`${swatch.colorway} (Current)`}
                    aria-label={`${swatch.colorway} (Current)`}
                  />
                );
              }

              if (swatch.slug) {
                return (
                  <Link
                    key={swatch.colorway}
                    to="/products/$slug"
                    params={{ slug: swatch.slug }}
                    className="pdp-swatch-circle"
                    style={{ backgroundColor: swatch.hex }}
                    title={`Switch to ${swatch.colorway}`}
                    aria-label={`Switch to ${swatch.colorway}`}
                  />
                );
              }

              return (
                <div
                  key={swatch.colorway}
                  className="pdp-swatch-circle"
                  style={{ backgroundColor: swatch.hex }}
                  title={swatch.colorway}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 7. SIZE SELECTOR */}
      <div
        ref={sizeSelectorRef}
        className={`pdp-size-selector-wrap ${shakeSize ? "shake-outline" : ""}`}
      >
        <div className="pdp-size-header-row">
          <span className="pdp-size-label">
            SELECT SIZE {selectedSize && <span className="pdp-size-chosen">// {selectedSize}</span>}
          </span>
          <button
            type="button"
            className="pdp-size-guide-trigger"
            onClick={onOpenSizeGuide}
            aria-label="Open size guide modal"
          >
            Size guide
          </button>
        </div>

        <div className="pdp-size-buttons-grid" role="radiogroup" aria-label="Select size">
          {product.sizes.map((s) => {
            const isSelected = selectedSize === s.label;
            const isAvailable = s.inStock;

            return (
              <button
                key={s.label}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={!isAvailable}
                className={`pdp-size-box-btn ${isSelected ? "selected" : ""} ${
                  !isAvailable ? "disabled" : ""
                }`}
                onClick={() => isAvailable && onSelectSize(s.label)}
                aria-label={`Size ${s.label} ${!isAvailable ? "(Out of stock)" : ""}`}
              >
                <span>{s.label}</span>
                {!isAvailable && <span className="pdp-size-strike" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 8. QUANTITY STEPPER */}
      {!isSoldOut && (
        <div className="pdp-qty-stepper-wrap">
          <span className="pdp-qty-label">QUANTITY</span>
          <div className="pdp-qty-stepper">
            <button
              type="button"
              className="pdp-qty-btn"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="pdp-qty-num" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              className="pdp-qty-btn"
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              disabled={quantity >= 10}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* 9. PRIMARY BUTTON & 10. SECONDARY BUTTON */}
      <div className="pdp-actions-stack">
        {isSoldOut ? (
          <div className="pdp-soldout-container">
            <button type="button" disabled className="pdp-btn-soldout">
              SOLD OUT
            </button>
            <form onSubmit={handleNotifySubmit} className="pdp-notify-form">
              <span className="pdp-notify-label">NOTIFY ME WHEN BACK IN STOCK</span>
              <div className="pdp-notify-input-row">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  className="pdp-notify-input"
                />
                <button type="submit" className="pdp-notify-submit-btn">
                  NOTIFY ME
                </button>
              </div>
              {notifySuccess && (
                <div className="pdp-notify-success">
                  <Check size={14} /> You will be notified the moment this piece rests.
                </div>
              )}
            </form>
          </div>
        ) : (
          <>
            <button
              type="button"
              id="pdp-main-add-to-cart-btn"
              className={`pdp-btn-primary ${!selectedSize ? "dimmed" : ""} ${
                isAdded ? "added" : ""
              }`}
              onClick={handleAddToCart}
            >
              {isAdded ? (
                <>
                  <Check size={18} /> ADDED
                </>
              ) : selectedSize ? (
                "ADD TO CART"
              ) : (
                "SELECT A SIZE"
              )}
            </button>

            <button
              type="button"
              className={`pdp-btn-secondary ${!selectedSize ? "dimmed" : ""}`}
              onClick={handleBuyNow}
            >
              BUY NOW
            </button>
          </>
        )}

        {/* 11. WISHLIST BUTTON */}
        <button
          type="button"
          className={`pdp-btn-wishlist ${isWishlisted ? "active" : ""} ${
            isHeartPopping ? "pop" : ""
          }`}
          onClick={toggleWishlist}
          aria-pressed={isWishlisted}
        >
          <Heart
            size={18}
            fill={isWishlisted ? "#111111" : "none"}
            stroke={isWishlisted ? "#111111" : "currentColor"}
          />
          <span>{isWishlisted ? "SAVED IN WISHLIST" : "SAVE TO WISHLIST"}</span>
        </button>
      </div>

      {/* 12. TRUST ROW (Three items with 12px labels and thin icons) */}
      <div className="pdp-trust-row">
        <div className="pdp-trust-item">
          <Shirt size={16} strokeWidth={1.5} />
          <span>Heavyweight cotton</span>
        </div>
        <div className="pdp-trust-item">
          <Sparkles size={16} strokeWidth={1.5} />
          <span>Limited drop</span>
        </div>
        <div className="pdp-trust-item">
          <Truck size={16} strokeWidth={1.5} />
          <span>Delivery across Ghana</span>
        </div>
      </div>

      {/* 13. DELIVERY ESTIMATE LINE */}
      <div className="pdp-delivery-estimate-line">
        {/* TODO: replace with real delivery times */}
        <p>Delivery in Accra: 1-2 business days. Other regions: 2-5 business days.</p>
      </div>
    </div>
  );
}
