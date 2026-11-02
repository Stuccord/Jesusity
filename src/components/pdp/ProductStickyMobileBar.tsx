import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { type Product, formatGHS } from "../../data/products";
import { useCart } from "../../context/CartContext";

interface ProductStickyMobileBarProps {
  product: Product;
  selectedSize: string | null;
  sizeSelectorRef: React.RefObject<HTMLDivElement | null>;
  onTriggerShake: () => void;
}

export function ProductStickyMobileBar({
  product,
  selectedSize,
  sizeSelectorRef,
  onTriggerShake,
}: ProductStickyMobileBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { addToCart, openCart } = useCart();

  const isSoldOut = product.sizes.every((s) => !s.inStock) || product.badge === "SOLD OUT";

  useEffect(() => {
    const mainBtn = document.getElementById("pdp-main-add-to-cart-btn");
    if (!mainBtn) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when main button is NOT intersecting (scrolled out of view)
        setIsVisible(!entry?.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(mainBtn);
    return () => observer.disconnect();
  }, [product.id]);

  const handleMobileAdd = () => {
    if (isSoldOut) return;

    if (!selectedSize) {
      onTriggerShake();
      // Scroll up to size selector smoothly
      if (sizeSelectorRef.current) {
        sizeSelectorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    addToCart(product, selectedSize, 1);
    setIsAdded(true);
    openCart();
    setTimeout(() => setIsAdded(false), 1500);
  };

  if (!isVisible) return null;

  return (
    <div className="pdp-mobile-sticky-bar" aria-label="Quick Add to Cart">
      <div className="pdp-mobile-bar-inner">
        <div className="pdp-mobile-bar-info">
          <span className="pdp-mobile-bar-price">{formatGHS(product.price)}</span>
          <span className="pdp-mobile-bar-size">
            {selectedSize ? `SIZE: ${selectedSize}` : "NO SIZE SELECTED"}
          </span>
        </div>

        <button
          type="button"
          disabled={isSoldOut}
          className={`pdp-mobile-bar-add-btn ${!selectedSize ? "dimmed" : ""} ${
            isAdded ? "added" : ""
          }`}
          onClick={handleMobileAdd}
        >
          {isSoldOut ? (
            "SOLD OUT"
          ) : isAdded ? (
            <>
              <Check size={16} /> ADDED
            </>
          ) : selectedSize ? (
            "ADD TO CART"
          ) : (
            "SELECT SIZE"
          )}
        </button>
      </div>
    </div>
  );
}
