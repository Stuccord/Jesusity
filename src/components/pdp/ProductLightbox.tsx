import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, ArrowRight, Minus, Plus, RotateCcw, X } from "lucide-react";

interface ProductLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  productName: string;
  colorway: string;
}

export function ProductLightbox({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  productName,
  colorway,
}: ProductLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPosRef = useRef({ x: 0, y: 0 });
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Store trigger element on open for focus return
  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement as HTMLElement | null;
      setCurrentIndex(initialIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else if (triggerElementRef.current) {
      triggerElementRef.current.focus();
    }
  }, [isOpen, initialIndex]);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  const handlePrev = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(3, +(prev + 0.5).toFixed(1)));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(1, +(prev - 0.5).toFixed(1));
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Keyboard navigation & Escape key & focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        handleResetZoom();
      } else if (e.key === "Tab") {
        // Focus trap
        const container = containerRef.current;
        if (!container) return;
        const focusable = container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext, handleZoomIn, handleZoomOut, handleResetZoom]);

  // Wheel zoom (with non-passive listener)
  useEffect(() => {
    const container = containerRef.current;
    if (!isOpen || !container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -Math.sign(e.deltaY) * 0.25;
      setScale((prev) => {
        const next = Math.min(3, Math.max(1, +(prev + delta).toFixed(2)));
        if (next === 1) {
          setPosition({ x: 0, y: 0 });
        }
        return next;
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [isOpen]);

  // Drag to pan when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPosRef.current = { ...position };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    // Bound panning to proportional max
    const maxBound = (scale - 1) * 350;
    setPosition({
      x: Math.max(-maxBound, Math.min(maxBound, initialPosRef.current.x + dx)),
      y: Math.max(-maxBound, Math.min(maxBound, initialPosRef.current.y + dy)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  const currentImage = images[currentIndex] || images[0] || "";

  return (
    <div
      ref={containerRef}
      className="pdp-lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${productName} full screen image gallery`}
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div className="pdp-lightbox-top-bar" onClick={(e) => e.stopPropagation()}>
        <div className="pdp-lightbox-title-wrap">
          <span className="pdp-lightbox-product-name">{productName}</span>
          <span className="pdp-lightbox-colorway">{colorway}</span>
        </div>

        <div className="pdp-lightbox-controls">
          <div className="pdp-lightbox-zoom-tools">
            <button
              type="button"
              className="pdp-lightbox-btn"
              onClick={handleZoomOut}
              disabled={scale <= 1}
              aria-label="Zoom out"
              title="Zoom out (-)"
            >
              <Minus size={18} />
            </button>
            <span className="pdp-lightbox-scale-indicator">{Math.round(scale * 100)}%</span>
            <button
              type="button"
              className="pdp-lightbox-btn"
              onClick={handleZoomIn}
              disabled={scale >= 3}
              aria-label="Zoom in"
              title="Zoom in (+)"
            >
              <Plus size={18} />
            </button>
            {scale > 1 && (
              <button
                type="button"
                className="pdp-lightbox-btn"
                onClick={handleResetZoom}
                aria-label="Reset zoom"
                title="Reset zoom (0)"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="pdp-lightbox-close-btn"
            onClick={onClose}
            aria-label="Close full-screen image"
            title="Close (Esc)"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="pdp-lightbox-stage"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
        }}
      >
        <img
          src={currentImage}
          alt={`${productName} high resolution angle ${currentIndex + 1}`}
          className="pdp-lightbox-image"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 150ms ease-out",
          }}
          draggable={false}
        />
      </div>

      {/* Prev / Next Buttons (if more than 1 image) */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            className="pdp-lightbox-nav-btn pdp-lightbox-prev"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Previous image"
            title="Previous (Left arrow)"
          >
            <ArrowLeft size={22} />
          </button>
          <button
            type="button"
            className="pdp-lightbox-nav-btn pdp-lightbox-next"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next image"
            title="Next (Right arrow)"
          >
            <ArrowRight size={22} />
          </button>
        </>
      )}

      {/* Bottom Counter & Help */}
      <div className="pdp-lightbox-footer" onClick={(e) => e.stopPropagation()}>
        <span className="pdp-lightbox-counter">
          {String(currentIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
        </span>
        <span className="pdp-lightbox-hint">
          {scale > 1
            ? "Click and drag to pan • Scroll to zoom"
            : "Scroll to zoom up to 3x • Arrow keys to switch angles"}
        </span>
      </div>
    </div>
  );
}
