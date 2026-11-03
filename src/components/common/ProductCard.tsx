import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Plus, ShoppingBag } from "lucide-react";
import { formatGHS, type Product } from "../../data/products";
import { useCart } from "../../context/CartContext";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  const isSoldOut = product.badge === "SOLD OUT" || product.sizes.every((s) => !s.inStock);
  const hasBackImage = Boolean(product.images.back);
  const displayImage =
    hovered && hasBackImage && product.images.back
      ? product.images.back
      : product.defaultView === "back" && product.images.back
        ? product.images.back
        : product.images.front;

  const handleQuickAdd = (e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSize(size);
    addToCart(product, size);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setShowSizePicker(false);
    }, 1200);
  };

  const handleTriggerQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSoldOut) return;
    setShowSizePicker((prev) => !prev);
  };

  return (
    <div
      className="catalog-product-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setShowSizePicker(false);
      }}
    >
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="catalog-card-image-wrap"
        aria-label={`View ${product.name}`}
      >
        <img
          src={displayImage}
          alt={`${product.name} - ${product.colorway}`}
          className="catalog-card-image"
          loading="lazy"
        />

        {product.badge && (
          <span
            className={`catalog-card-badge badge-${product.badge.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {product.badge}
          </span>
        )}

        {/* Quick Add Overlay */}
        {!isSoldOut && (
          <div className={`catalog-quick-add-bar ${showSizePicker ? "active" : ""}`}>
            {showSizePicker ? (
              <div className="catalog-size-picker" onClick={(e) => e.stopPropagation()}>
                <span className="catalog-size-picker-title">CHOOSE SIZE</span>
                <div className="catalog-size-picker-chips">
                  {product.sizes.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      disabled={!s.inStock}
                      className={`catalog-size-chip ${selectedSize === s.label ? "selected" : ""} ${
                        !s.inStock ? "out-of-stock" : ""
                      }`}
                      onClick={(e) => handleQuickAdd(e, s.label)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="catalog-quick-add-trigger"
                onClick={handleTriggerQuickAdd}
                aria-label={`Quick add ${product.name}`}
              >
                {added ? (
                  <>
                    <Check size={14} /> ADDED
                  </>
                ) : (
                  <>
                    <Plus size={14} /> QUICK ADD
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </Link>

      {/* Card Info */}
      <div className="catalog-card-info">
        {product.swatches && product.swatches.length > 1 && (
          <div className="catalog-swatches-row">
            {product.swatches.map((swatch) => (
              <span
                key={swatch.color}
                className={`catalog-swatch-dot ${swatch.active ? "active" : ""}`}
                style={{ backgroundColor: swatch.hex }}
                title={swatch.color}
              />
            ))}
          </div>
        )}

        <Link to="/products/$slug" params={{ slug: product.slug }} className="catalog-card-title">
          {product.name}
        </Link>
        <div className="catalog-card-colorway">{product.colorway}</div>

        <div className="catalog-card-price-row">
          <span className="catalog-card-price">{formatGHS(product.price)}</span>
          {product.compareAtPrice && (
            <span className="catalog-card-compare">{formatGHS(product.compareAtPrice)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
