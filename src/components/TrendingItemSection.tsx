import { useState, useRef, useEffect, useCallback } from "react";
import { Check, Search, Shirt, Sparkles, Truck, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { formatGHS } from "../data/products";
import { useProducts } from "../context/CatalogContext";
import { useCart } from "../context/CartContext";

type Size = string;

export function TrendingItemSection() {
  const products = useProducts();
  const { addToCart, openCart } = useCart();
  // The admin picks the spotlight product by giving it the TRENDING badge
  const product = products.find((p) => p.badge === "TRENDING") ?? products[0];
  const teeFront = product?.images.gallery?.[0] ?? product?.images.front ?? "";
  const teeBack = product?.images.gallery?.[1] ?? product?.images.back ?? teeFront;
  const sizes = product?.sizes ?? [];

  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [displayedSide, setDisplayedSide] = useState<"front" | "back">("front");
  const [turnPhase, setTurnPhase] = useState<"idle" | "out" | "in">("idle");
  const [isPillPressed, setIsPillPressed] = useState(false);
  const [panelEntered, setPanelEntered] = useState(false);
  const [floatingActive, setFloatingActive] = useState(false);

  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [shakeSizeRow, setShakeSizeRow] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [inView, setInView] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const isTurningRef = useRef(false);
  const touchStartX = useRef<number | null>(null);

  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedSize) {
      setShakeSizeRow(true);
      setTimeout(() => setShakeSizeRow(false), 500);
      return;
    }
    addToCart(product, selectedSize, 1);
    openCart();
    setIsAddedToCart(true);
    setTimeout(() => setIsAddedToCart(false), 2200);
  };

  // 3D Turn Transition
  const triggerTurn = useCallback(
    (targetSide: "front" | "back") => {
      if (targetSide === activeSide || isTurningRef.current) return;
      isTurningRef.current = true;
      setActiveSide(targetSide);

      const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (isReducedMotion) {
        setDisplayedSide(targetSide);
        setTimeout(() => {
          isTurningRef.current = false;
        }, 250);
        return;
      }

      // Phase 1: rotateY from 0 to 90deg over 280ms
      setTurnPhase("out");
      setTimeout(() => {
        // Midpoint: shirt is edge-on, swap image source
        setDisplayedSide(targetSide);
        // Phase 2: rotate from -90deg to 0 over 380ms
        setTurnPhase("in");
        setTimeout(() => {
          setTurnPhase("idle");
          isTurningRef.current = false;
        }, 380);
      }, 280);
    },
    [activeSide],
  );

  // ArrowLeft / ArrowRight navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen || isSizeGuideOpen) return;
      if (e.key === "ArrowLeft") {
        triggerTurn("front");
      } else if (e.key === "ArrowRight") {
        triggerTurn("back");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSide, isLightboxOpen, isSizeGuideOpen, triggerTurn]);

  // Touch swipe support on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !e.changedTouches[0]) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0 && activeSide === "front") {
        triggerTurn("back");
      } else if (deltaX > 0 && activeSide === "back") {
        triggerTurn("front");
      }
    }
  };

  // Preload both images so 3D turn is seamless
  useEffect(() => {
    const preload = (src: string) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = src;
      document.head.appendChild(link);
      return link;
    };
    const l1 = preload(teeFront);
    const l2 = preload(teeBack);
    return () => {
      l1.remove();
      l2.remove();
    };
  }, [teeFront, teeBack]);

  // Section entrance observer (threshold 0.15 for general section)
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
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Panel entrance observer (threshold 0.3, once)
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setPanelEntered(true);
          observer.unobserve(panel);
          setTimeout(() => {
            setFloatingActive(true);
          }, 900);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  // Mouse spotlight (lerp 0.12) & 3D tilt toward cursor (max 5deg)
  useEffect(() => {
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isFinePointer || isReducedMotion) return;

    const panel = panelRef.current;
    const tilt = tiltRef.current;
    if (!panel || !tilt) return;

    let targetX = 0;
    let targetY = 0;
    let targetOpacity = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;

    let currX = 0;
    let currY = 0;
    let currOpacity = 0;
    let currTiltX = 0;
    let currTiltY = 0;

    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      const rect = panel.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
      targetOpacity = 1;

      if (!isTurningRef.current) {
        const nx = (targetX / rect.width) * 2 - 1;
        const ny = (targetY / rect.height) * 2 - 1;
        // Tilt toward cursor (max 5deg)
        targetTiltX = Math.max(-5, Math.min(5, -ny * 5));
        targetTiltY = Math.max(-5, Math.min(5, nx * 5));
      } else {
        targetTiltX = 0;
        targetTiltY = 0;
      }
    };

    const onMouseEnter = () => {
      targetOpacity = 1;
    };

    const onMouseLeave = () => {
      targetOpacity = 0;
      targetTiltX = 0;
      targetTiltY = 0;
    };

    panel.addEventListener("mousemove", onMouseMove);
    panel.addEventListener("mouseenter", onMouseEnter);
    panel.addEventListener("mouseleave", onMouseLeave);

    const loop = () => {
      // Lerp 0.12
      currX += (targetX - currX) * 0.12;
      currY += (targetY - currY) * 0.12;
      currOpacity += (targetOpacity - currOpacity) * 0.12;

      if (isTurningRef.current) {
        currTiltX += (0 - currTiltX) * 0.12;
        currTiltY += (0 - currTiltY) * 0.12;
      } else {
        currTiltX += (targetTiltX - currTiltX) * 0.12;
        currTiltY += (targetTiltY - currTiltY) * 0.12;
      }

      panel.style.setProperty("--spot-x", `${currX.toFixed(1)}px`);
      panel.style.setProperty("--spot-y", `${currY.toFixed(1)}px`);
      panel.style.setProperty("--spot-opacity", `${currOpacity.toFixed(3)}`);

      if (tilt) {
        tilt.style.transform = `rotateX(${currTiltX.toFixed(2)}deg) rotateY(${currTiltY.toFixed(2)}deg)`;
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      panel.removeEventListener("mousemove", onMouseMove);
      panel.removeEventListener("mouseenter", onMouseEnter);
      panel.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
        setIsSizeGuideOpen(false);
      }
    };
    if (isLightboxOpen || isSizeGuideOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isLightboxOpen, isSizeGuideOpen]);

  if (!product) return null;
  const productName = product.name.toUpperCase();
  const scripture = product.story?.scripture;

  return (
    <section
      ref={sectionRef}
      className={`trending-section ${inView ? "in-view" : ""}`}
      id="trending"
      aria-labelledby="trending-heading"
    >
      <div className="trending-container">
        {/* LEFT COLUMN: 55% Image Panel */}
        <div
          className="trending-left-col trending-fade-item"
          style={{ "--fade-index": 0 } as React.CSSProperties}
        >
          <div
            ref={panelRef}
            className="trending-image-panel"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Soft Radial Spotlight (follows cursor with lerp 0.12) */}
            <div className="trending-spotlight" aria-hidden="true" />

            {/* Detail View Button */}
            <button
              type="button"
              className="trending-detail-btn"
              onClick={() => setIsLightboxOpen(true)}
              aria-label="Detail view: zoom into graphic artwork"
              title="Detail View"
            >
              <Search size={18} />
            </button>

            {/* Product Image Stage */}
            <div className="trending-image-stage" id="panel-image">
              {/* Floor Shadow: lives outside rotating element so it stays on floor */}
              <div
                className={`trending-floor-shadow ${panelEntered ? "entered" : ""} ${
                  turnPhase === "out"
                    ? "shadow-turn-out"
                    : turnPhase === "in"
                      ? "shadow-turn-in"
                      : floatingActive
                        ? "breathing"
                        : ""
                }`}
                aria-hidden="true"
              />

              {/* Entrance wrapper */}
              <div className={`trending-shirt-entrance ${panelEntered ? "entered" : ""}`}>
                {/* 6s gentle floating wrapper */}
                <div
                  className={`trending-shirt-float ${
                    floatingActive && turnPhase === "idle" ? "floating" : ""
                  }`}
                >
                  {/* Cursor tilt wrapper (max 5deg) */}
                  <div ref={tiltRef} className="trending-shirt-tilt">
                    {/* 3D turn wrapper (transform-style: preserve-3d) */}
                    <div
                      className={`trending-shirt-turn ${
                        turnPhase === "out" ? "turn-out" : turnPhase === "in" ? "turn-in" : ""
                      }`}
                    >
                      <img
                        src={displayedSide === "front" ? teeFront : teeBack}
                        alt={
                          displayedSide === "front"
                            ? `${product.name}, front view`
                            : `${product.name}, back view`
                        }
                        className="trending-product-img"
                        data-pin-nopin="true"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Front / Back Toggle Pill with Sliding White Indicator */}
            <div
              className={`trending-toggle-pill ${panelEntered ? "entered" : ""} ${
                isPillPressed ? "pressed" : ""
              }`}
              role="group"
              aria-label="Select front or back product angle"
            >
              <span
                className={`trending-pill-indicator ${activeSide === "back" ? "back" : "front"}`}
                aria-hidden="true"
              />
              <button
                type="button"
                aria-pressed={activeSide === "front"}
                className={`trending-pill-btn ${activeSide === "front" ? "active" : ""}`}
                onClick={() => triggerTurn("front")}
                onMouseDown={() => setIsPillPressed(true)}
                onMouseUp={() => setIsPillPressed(false)}
                onMouseLeave={() => setIsPillPressed(false)}
              >
                FRONT
              </button>
              <button
                type="button"
                aria-pressed={activeSide === "back"}
                className={`trending-pill-btn ${activeSide === "back" ? "active" : ""}`}
                onClick={() => triggerTurn("back")}
                onMouseDown={() => setIsPillPressed(true)}
                onMouseUp={() => setIsPillPressed(false)}
                onMouseLeave={() => setIsPillPressed(false)}
              >
                BACK
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 45% Content (24px stacked rhythm) */}
        <div className="trending-right-col">
          {/* 1. Eyebrow */}
          <div
            className="trending-eyebrow trending-fade-item"
            style={{ "--fade-index": 1 } as React.CSSProperties}
          >
            <span className="trending-eyebrow-line" aria-hidden="true" />
            <span>TRENDING ITEM</span>
          </div>

          {/* 2. Headline */}
          <h2
            id="trending-heading"
            className="trending-headline trending-fade-item"
            style={{ "--fade-index": 2 } as React.CSSProperties}
          >
            {productName}
          </h2>

          {/* 3. Scripture Tag */}
          {scripture && (
            <div
              className="trending-scripture-wrapper trending-fade-item"
              style={{ "--fade-index": 3 } as React.CSSProperties}
            >
              <span className="trending-scripture">{scripture.toUpperCase()}</span>
            </div>
          )}

          {/* 4. Description */}
          <p
            className="trending-description trending-fade-item"
            style={{ "--fade-index": 4 } as React.CSSProperties}
          >
            {product.description}
          </p>

          {/* 5. Price & Payment Note */}
          <div
            className="trending-price-group trending-fade-item"
            style={{ "--fade-index": 5 } as React.CSSProperties}
          >
            <div className="trending-price">{formatGHS(product.price)}</div>
            <div className="trending-payment-subtext">Pay with MoMo or card</div>
          </div>

          {/* 6. Size Selector */}
          <div
            className="trending-size-group trending-fade-item"
            style={{ "--fade-index": 6 } as React.CSSProperties}
          >
            <div className="trending-size-header">
              <span className="trending-size-title">SELECT SIZE</span>
              <button
                type="button"
                className="trending-size-guide-btn"
                onClick={() => setIsSizeGuideOpen(true)}
              >
                Size guide
              </button>
            </div>
            <div
              className={`trending-size-row ${shakeSizeRow ? "shake-highlight" : ""}`}
              role="radiogroup"
              aria-label="Available sizes"
            >
              {sizes.map(({ label, inStock }) => {
                const isSelected = selectedSize === label;
                return (
                  <button
                    key={label}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={!inStock}
                    aria-label={inStock ? label : `${label}, sold out`}
                    className={`trending-size-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedSize(label)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Primary CTA & Secondary Link */}
          <div
            className="trending-cta-group trending-fade-item"
            style={{ "--fade-index": 7 } as React.CSSProperties}
          >
            <button
              type="button"
              className={`trending-add-cart-btn ${!selectedSize ? "prompt-size" : ""} ${isAddedToCart ? "added" : ""}`}
              onClick={handleAddToCart}
            >
              {isAddedToCart ? (
                <>
                  <Check size={16} /> ADDED TO CART
                </>
              ) : !selectedSize ? (
                "SELECT A SIZE"
              ) : (
                "ADD TO CART"
              )}
            </button>
            <Link
              to="/products/$slug"
              params={{ slug: product.slug }}
              className="trending-details-link"
            >
              <span>VIEW FULL DETAILS →</span>
            </Link>
          </div>

          {/* 8. Small Trust Row */}
          <div
            className="trending-trust-row trending-fade-item"
            style={{ "--fade-index": 8 } as React.CSSProperties}
          >
            <div className="trending-trust-item">
              <Shirt size={14} className="trending-trust-icon" />
              <span>Heavyweight cotton</span>
            </div>
            <div className="trending-trust-item">
              <Sparkles size={14} className="trending-trust-icon" />
              <span>Limited drop</span>
            </div>
            <div className="trending-trust-item">
              <Truck size={14} className="trending-trust-icon" />
              <span>Delivery across Ghana</span>
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL VIEW LIGHTBOX */}
      {isLightboxOpen && (
        <div
          className="trending-lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Detail Graphic View"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="trending-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="trending-lightbox-close"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Close detail view"
            >
              <X size={20} />
            </button>
            <div className="trending-lightbox-image-wrap">
              <img
                src={displayedSide === "front" ? teeFront : teeBack}
                alt={
                  displayedSide === "front"
                    ? `${product.name}, front view`
                    : `${product.name}, back view`
                }
                className="trending-lightbox-img"
                data-pin-nopin="true"
              />
            </div>
            <div className="trending-lightbox-meta">
              <span className="trending-lightbox-title">
                {productName} • {product.colorway.toUpperCase()}
              </span>
              {scripture && (
                <span className="trending-lightbox-scripture">{scripture.toUpperCase()}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SIZE GUIDE MODAL */}
      {isSizeGuideOpen && (
        <div
          className="trending-lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Size Guide"
          onClick={() => setIsSizeGuideOpen(false)}
        >
          <div className="trending-size-guide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="trending-size-guide-header">
              <h3>SIZE GUIDE</h3>
              <button
                type="button"
                className="trending-lightbox-close"
                onClick={() => setIsSizeGuideOpen(false)}
                aria-label="Close size guide"
              >
                <X size={18} />
              </button>
            </div>
            {product.details?.fit && <p className="trending-size-guide-note">{product.details.fit}</p>}
            <table className="trending-size-table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Chest (cm)</th>
                  <th>Length (cm)</th>
                  <th>Shoulder (cm)</th>
                </tr>
              </thead>
              <tbody>
                {(product.sizeChart ?? []).map((row) => (
                  <tr key={row.size}>
                    <td>{row.size}</td>
                    <td>{row.chest}</td>
                    <td>{row.length}</td>
                    <td>{row.shoulder ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
