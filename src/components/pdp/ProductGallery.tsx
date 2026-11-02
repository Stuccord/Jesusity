import { useState, useRef, useEffect, useCallback } from "react";
import { Maximize2 } from "lucide-react";
import { type Product, getProductImages } from "../../data/products";
import { ProductLightbox } from "./ProductLightbox";

interface ProductGalleryProps {
  product: Product;
}

export function ProductGallery({ product }: ProductGalleryProps) {
  const images = getProductImages(product);
  const defaultIndex = 0;

  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const [displayedIndex, setDisplayedIndex] = useState(defaultIndex);
  const [turnPhase, setTurnPhase] = useState<"idle" | "out" | "in">("idle");
  const [isPillPressed, setIsPillPressed] = useState(false);
  const [panelEntered, setPanelEntered] = useState(false);
  const [floatingActive, setFloatingActive] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const isTurningRef = useRef(false);
  const touchStartX = useRef<number | null>(null);

  // Sync when product changes
  useEffect(() => {
    setActiveIndex(0);
    setDisplayedIndex(0);
    setTurnPhase("idle");
    isTurningRef.current = false;
  }, [product.id, product.defaultView, images.length]);

  // Preload all gallery images
  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    images.forEach((src) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = src;
      document.head.appendChild(link);
      links.push(link);
    });
    return () => {
      links.forEach((l) => l.remove());
    };
  }, [images]);

  // Entrance observer
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
          }, 800);
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  // 3D Turn transition with midpoint swap
  const triggerTurn = useCallback(
    (targetIndex: number) => {
      if (targetIndex === activeIndex || isTurningRef.current) return;
      if (targetIndex < 0 || targetIndex >= images.length) return;

      isTurningRef.current = true;
      setActiveIndex(targetIndex);

      const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (isReducedMotion) {
        setDisplayedIndex(targetIndex);
        setTimeout(() => {
          isTurningRef.current = false;
        }, 200);
        return;
      }

      // Phase 1: 0 to 90deg over 260ms
      setTurnPhase("out");
      setTimeout(() => {
        // Midpoint swap at edge-on
        setDisplayedIndex(targetIndex);
        // Phase 2: -90deg to 0 over 320ms
        setTurnPhase("in");
        setTimeout(() => {
          setTurnPhase("idle");
          isTurningRef.current = false;
        }, 320);
      }, 260);
    },
    [activeIndex, images.length],
  );

  // ArrowLeft / ArrowRight navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen) return;
      if (e.key === "ArrowLeft") {
        const next = activeIndex > 0 ? activeIndex - 1 : images.length - 1;
        triggerTurn(next);
      } else if (e.key === "ArrowRight") {
        const next = activeIndex < images.length - 1 ? activeIndex + 1 : 0;
        triggerTurn(next);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, images.length, isLightboxOpen, triggerTurn]);

  // Touch swipe support
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
      if (deltaX < 0 && activeIndex < images.length - 1) {
        triggerTurn(activeIndex + 1);
      } else if (deltaX > 0 && activeIndex > 0) {
        triggerTurn(activeIndex - 1);
      }
    }
  };

  // Cursor spotlight (lerp 0.12) & 3D tilt toward cursor (max 5deg)
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

  const hasBackView = Boolean(product.images.back);
  const frontIndex = product.images.front ? images.indexOf(product.images.front) : -1;
  const backIndex = product.images.back ? images.indexOf(product.images.back) : -1;
  const isBackActive = backIndex !== -1 && activeIndex === backIndex;
  const isFrontActive = frontIndex !== -1 && activeIndex === frontIndex;
  const currentDisplayedImage = images[displayedIndex] || images[0] || "";

  return (
    <div className="pdp-gallery-wrapper">
      {/* Thumbnail Strip (Left side on >= 1280px or beneath main panel) */}
      {images.length > 1 && (
        <div className="pdp-thumbnail-strip" role="tablist" aria-label="Product image angles">
          {images.map((imgSrc, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={`${imgSrc}-${idx}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`pdp-thumbnail-btn ${isActive ? "active" : ""}`}
                onClick={() => triggerTurn(idx)}
                aria-label={`View angle ${idx + 1}`}
              >
                <img src={imgSrc} alt="" className="pdp-thumbnail-img" />
              </button>
            );
          })}
        </div>
      )}

      {/* Main Square Stage */}
      <div className="pdp-main-stage-col">
        <div
          ref={panelRef}
          className={`pdp-gallery-panel ${panelEntered ? "entered" : ""}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Magnifier Button (top right) */}
          <button
            type="button"
            className="pdp-magnifier-btn"
            onClick={() => setIsLightboxOpen(true)}
            aria-label="Open full resolution image zoom"
            title="Full screen zoom"
          >
            <Maximize2 size={18} />
          </button>

          {/* Badge (top left) */}
          {product.badge && (
            <span
              className={`pdp-gallery-badge badge-${product.badge.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {product.badge}
            </span>
          )}

          {/* Stage Area */}
          <div className="pdp-shirt-stage">
            {/* Soft Floor Shadow */}
            <div className="pdp-shirt-shadow" aria-hidden="true" />

            {/* Float wrapper */}
            <div
              className={`pdp-shirt-float ${
                floatingActive && turnPhase === "idle" ? "floating" : ""
              }`}
            >
              {/* Tilt wrapper */}
              <div ref={tiltRef} className="pdp-shirt-tilt">
                {/* 3D Turn wrapper */}
                <div
                  className={`pdp-shirt-turn ${
                    turnPhase === "out" ? "turn-out" : turnPhase === "in" ? "turn-in" : ""
                  }`}
                >
                  <img
                    src={currentDisplayedImage}
                    alt={`${product.name} - ${product.colorway}, angle ${displayedIndex + 1}`}
                    className="pdp-main-product-img"
                    data-pin-nopin="true"
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Front / Back Toggle Pill (only if front & back both exist in images) */}
          {hasBackView && frontIndex !== -1 && backIndex !== -1 && (
            <div
              className={`pdp-toggle-pill ${isPillPressed ? "pressed" : ""}`}
              role="group"
              aria-label="Toggle front or back view"
            >
              <span
                className={`pdp-pill-indicator ${isBackActive ? "back" : "front"}`}
                aria-hidden="true"
              />
              <button
                type="button"
                aria-pressed={isFrontActive}
                className={`pdp-pill-btn ${isFrontActive ? "active" : ""}`}
                onClick={() => triggerTurn(frontIndex)}
                onMouseDown={() => setIsPillPressed(true)}
                onMouseUp={() => setIsPillPressed(false)}
                onMouseLeave={() => setIsPillPressed(false)}
              >
                FRONT
              </button>
              <button
                type="button"
                aria-pressed={isBackActive}
                className={`pdp-pill-btn ${isBackActive ? "active" : ""}`}
                onClick={() => triggerTurn(backIndex)}
                onMouseDown={() => setIsPillPressed(true)}
                onMouseUp={() => setIsPillPressed(false)}
                onMouseLeave={() => setIsPillPressed(false)}
              >
                BACK
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      <ProductLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={images}
        initialIndex={activeIndex}
        productName={product.name}
        colorway={product.colorway}
      />
    </div>
  );
}
