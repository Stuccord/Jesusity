import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, ArrowRight, Check, Heart, Plus, Star } from "lucide-react";
import { products, formatGHS, type Product } from "../data/products";
import { useCart } from "../context/CartContext";

export interface FeaturedProductsSectionProps {
  productsList?: Product[];
  title?: string;
  eyebrow?: string;
  subcopy?: string;
  viewAllLink?: string;
}

export function FeaturedProductsSection({
  productsList = products,
  title = "FEATURED PRODUCTS",
  eyebrow = "THE COLLECTION",
  subcopy = "Heavyweight cotton. Scripture-inspired graphics. Limited drops.",
  viewAllLink = "/shop",
}: FeaturedProductsSectionProps = {}) {
  const { addToCart } = useCart();
  const railRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("supernatural_wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [poppingHeartId, setPoppingHeartId] = useState<string | null>(null);
  const [addedItemKey, setAddedItemKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; name: string } | null>(null);
  const [mobileQuickAddId, setMobileQuickAddId] = useState<string | null>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeCardIndex, setActiveCardIndex] = useState(1);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [inView, setInView] = useState(false);

  // Mouse drag-to-scroll state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const hasDraggedRef = useRef(false);

  // Update scroll metrics
  const updateScrollMetrics = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    const { scrollLeft, scrollWidth, clientWidth } = rail;
    const maxScroll = Math.max(1, scrollWidth - clientWidth);
    const progress = Math.min(1, Math.max(0, scrollLeft / maxScroll));
    setScrollProgress(progress);

    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < maxScroll - 6);

    // Active card index calculation based on first card width
    const firstCard = rail.querySelector(".featured-card") as HTMLElement | null;
    if (firstCard) {
      const cardWidthWithGap = firstCard.offsetWidth + 24;
      const idx = Math.min(
        productsList.length,
        Math.max(1, Math.round(scrollLeft / cardWidthWithGap) + 1),
      );
      setActiveCardIndex(idx);
    }
  }, [productsList.length]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    updateScrollMetrics();
    const handleScroll = () => updateScrollMetrics();
    rail.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      rail.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [updateScrollMetrics]);

  // Entrance observer
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Scroll buttons
  const scrollByCard = (direction: "left" | "right") => {
    const rail = railRef.current;
    if (!rail) return;
    const firstCard = rail.querySelector(".featured-card") as HTMLElement | null;
    const scrollAmount = firstCard ? firstCard.offsetWidth + 24 : 320;
    rail.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Keyboard navigation on rail
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollByCard("left");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollByCard("right");
    }
  };

  // Drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const rail = railRef.current;
    if (!rail) return;
    // Only drag with primary mouse button
    if (e.button !== 0) return;

    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - rail.offsetLeft;
    scrollLeftStartRef.current = rail.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const rail = railRef.current;
    if (!rail) return;

    const x = e.pageX - rail.offsetLeft;
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    rail.scrollLeft = scrollLeftStartRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  // 3D tilt + glare that follows the cursor (fine pointers only; CSS opts out for reduced motion)
  const handleCardPointerMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== "mouse" || isDraggingRef.current) return;
    const stage = e.currentTarget.querySelector<HTMLElement>(".featured-card-image-stage");
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    stage.style.setProperty("--tilt-x", `${(0.5 - y) * 10}deg`);
    stage.style.setProperty("--tilt-y", `${(x - 0.5) * 12}deg`);
    stage.style.setProperty("--glare-x", `${x * 100}%`);
    stage.style.setProperty("--glare-y", `${y * 100}%`);
  };

  const handleCardPointerLeave = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const stage = e.currentTarget.querySelector<HTMLElement>(".featured-card-image-stage");
    stage?.style.setProperty("--tilt-x", "0deg");
    stage?.style.setProperty("--tilt-y", "0deg");
  };

  // Toggle wishlist
  const toggleWishlist = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();

    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      try {
        localStorage.setItem("supernatural_wishlist", JSON.stringify(updated));
      } catch {
        // ignore localStorage errors
      }
      return updated;
    });

    setPoppingHeartId(productId);
    setTimeout(() => {
      setPoppingHeartId(null);
    }, 300);
  };

  // Quick Add handler
  const handleQuickAdd = (e: React.MouseEvent, product: Product, size: string) => {
    e.preventDefault();
    e.stopPropagation();

    const itemKey = `${product.id}-${size}`;
    setAddedItemKey(itemKey);

    addToCart(product, size);

    // Show toast
    setToast({ show: true, name: `${product.name} (${size})` });
    setTimeout(() => {
      setToast(null);
    }, 3200);

    // Reset checkmark after 1.4s
    setTimeout(() => {
      setAddedItemKey((curr) => (curr === itemKey ? null : curr));
    }, 1400);
  };

  return (
    <section
      ref={sectionRef}
      className={`featured-collection-section ${inView ? "in-view" : ""}`}
      id="featured"
      aria-labelledby="featured-heading"
    >
      {/* HEADER ROW */}
      <div className="featured-header-container">
        <div className="featured-header-left">
          <div className="featured-eyebrow-row">
            <span className="featured-eyebrow-line" aria-hidden="true" />
            <span className="featured-eyebrow">{eyebrow}</span>
          </div>
          <h2 id="featured-heading" className="featured-headline">
            {title}
          </h2>
          {subcopy && <p className="featured-subcopy">{subcopy}</p>}
        </div>

        <div className="featured-header-right">
          <a href={viewAllLink} className="featured-view-all-desktop">
            <span>VIEW ALL →</span>
          </a>
          <div className="featured-arrow-group" role="group" aria-label="Carousel navigation">
            <button
              type="button"
              className="featured-arrow-btn"
              onClick={() => scrollByCard("left")}
              disabled={!canScrollLeft}
              aria-label="Previous products"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              type="button"
              className="featured-arrow-btn"
              onClick={() => scrollByCard("right")}
              disabled={!canScrollRight}
              aria-label="Next products"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* HORIZONTAL RAIL */}
      <div className="featured-rail-wrapper">
        <div
          ref={railRef}
          className="featured-rail"
          role="region"
          aria-roledescription="carousel"
          aria-label="Featured products"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
          {productsList.map((product, index) => {
            const isWishlisted = wishlist.includes(product.id);
            const isHeartPopping = poppingHeartId === product.id;
            const isSoldOut = product.badge === "SOLD OUT";
            const isTouchQuickAddOpen = mobileQuickAddId === product.id;

            return (
              <a
                key={product.id}
                href={`/products/${product.slug}`}
                className="featured-card"
                style={{ "--stagger-index": index } as React.CSSProperties}
                onPointerMove={handleCardPointerMove}
                onPointerLeave={handleCardPointerLeave}
                onClick={(e) => {
                  if (hasDraggedRef.current) {
                    e.preventDefault();
                  }
                }}
              >
                {/* IMAGE AREA */}
                <div className={`featured-card-image-stage ${isSoldOut ? "sold-out" : ""}`}>
                  {/* Front and Back Images stacked */}
                  <img
                    src={product.images.front}
                    alt={`${product.name} - ${product.colorway}, front view`}
                    width={400}
                    height={500}
                    loading={index < 4 ? "eager" : "lazy"}
                    decoding="async"
                    className={`featured-card-img img-front ${
                      product.defaultView === "front" ? "default-view" : "alt-view"
                    }`}
                  />
                  {product.images.back && (
                    <img
                      src={product.images.back}
                      alt={`${product.name} - ${product.colorway}, back view`}
                      width={400}
                      height={500}
                      loading={index < 4 ? "eager" : "lazy"}
                      decoding="async"
                      className={`featured-card-img img-back ${
                        product.defaultView === "back" ? "default-view" : "alt-view"
                      }`}
                    />
                  )}

                  {/* Badge top-left */}
                  {product.badge && (
                    <span
                      className={`featured-card-badge badge-${product.badge.toLowerCase().replace(" ", "-")}`}
                    >
                      {product.badge}
                    </span>
                  )}

                  {/* Wishlist Heart top-right */}
                  <button
                    type="button"
                    className={`featured-card-wishlist ${isWishlisted ? "active" : ""} ${
                      isHeartPopping ? "pop" : ""
                    }`}
                    onClick={(e) => toggleWishlist(e, product.id)}
                    aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart
                      size={18}
                      fill={isWishlisted ? "#ffffff" : "none"}
                      stroke={isWishlisted ? "#ffffff" : "rgba(255, 255, 255, 0.85)"}
                    />
                  </button>

                  {/* Mobile Touch Quick Add Toggle (+) */}
                  <button
                    type="button"
                    className="featured-touch-plus-btn"
                    aria-label="Open size selection"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMobileQuickAddId((prev) => (prev === product.id ? null : product.id));
                    }}
                  >
                    <Plus size={20} />
                  </button>

                  {/* Quick Add Bar (slides up on hover, focus-within, or touch toggle) */}
                  <div
                    className={`featured-quick-add-bar ${isTouchQuickAddOpen ? "touch-open" : ""}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="featured-quick-add-label">QUICK ADD</div>
                    <div className="featured-quick-add-chips">
                      {product.sizes.map((size) => {
                        const itemKey = `${product.id}-${size.label}`;
                        const isAdded = addedItemKey === itemKey;

                        return (
                          <button
                            key={size.label}
                            type="button"
                            disabled={!size.inStock}
                            className={`featured-size-chip ${!size.inStock ? "out-of-stock" : ""} ${
                              isAdded ? "is-added" : ""
                            }`}
                            onClick={(e) => handleQuickAdd(e, product, size.label)}
                            title={size.inStock ? `Size ${size.label}` : `${size.label} (Sold out)`}
                          >
                            {isAdded ? <Check size={14} /> : size.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* INFO BLOCK */}
                <div className="featured-card-info">
                  <h3 className="featured-card-name">{product.name}</h3>
                  <div className="featured-card-colorway">{product.colorway}</div>

                  <div className="featured-card-price-row">
                    <div className="featured-card-price-group">
                      <span className="featured-card-price">{formatGHS(product.price)}</span>
                      {product.compareAtPrice && (
                        <span className="featured-card-compare-price">
                          {formatGHS(product.compareAtPrice)}
                        </span>
                      )}
                    </div>

                    {/* Swatches if available */}
                    {product.swatches && product.swatches.length > 0 && (
                      <div className="featured-card-swatches" aria-label="Available colorways">
                        {product.swatches.map((swatch) => (
                          <span
                            key={swatch.color}
                            className={`featured-card-swatch ${swatch.active ? "active" : ""}`}
                            style={{ backgroundColor: swatch.hex }}
                            title={swatch.colorway}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rating row: only rendered if reviewCount > 0 */}
                  {product.reviewCount && product.reviewCount > 0 && (
                    <div className="featured-card-rating-row">
                      <Star
                        size={12}
                        fill="#ffffff"
                        stroke="#ffffff"
                        className="featured-gold-star"
                      />
                      <span className="featured-rating-score">
                        {product.rating?.toFixed(1) ?? "5.0"}
                      </span>
                      <span className="featured-rating-count">({product.reviewCount})</span>
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* RAIL PROGRESS & COUNTER */}
      <div className="featured-progress-container">
        <div className="featured-progress-track">
          <div
            className="featured-progress-fill"
            style={{ width: `${Math.max(12, scrollProgress * 100)}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="featured-progress-counter" aria-live="polite">
          <span className="counter-current">{String(activeCardIndex).padStart(2, "0")}</span>
          <span className="counter-divider"> / </span>
          <span className="counter-total">{String(productsList.length).padStart(2, "0")}</span>
        </div>
      </div>

      {/* MOBILE BOTTOM "VIEW ALL PRODUCTS" BUTTON */}
      <div className="featured-mobile-view-all">
        <a href={viewAllLink} className="featured-mobile-view-all-btn">
          VIEW ALL PRODUCTS
        </a>
      </div>

      {/* ADDED TO CART TOAST */}
      {toast && (
        <div className="featured-cart-toast" role="status" aria-live="assertive">
          <div className="featured-toast-content">
            <Check size={16} className="featured-toast-icon" />
            <span>Added {toast.name} to cart</span>
          </div>
          <a href="#cart" className="featured-toast-link">
            VIEW CART →
          </a>
        </div>
      )}
    </section>
  );
}
