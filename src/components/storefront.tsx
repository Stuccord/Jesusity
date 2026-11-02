import { useState, useEffect, type ComponentType, type SVGProps } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";

export type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export type Category = {
  name: string;
  kind: "hoodie" | "tee" | "jacket" | "trouser";
  image?: string;
};

export type Product = {
  name: string;
  price: string;
  originalPrice?: string;
  description?: string;
  reviews: number;
  rating: number;
  kind: Category["kind"];
  image?: string;
  hoverImage?: string;
  badge?: string;
  tag?: string;
};

export type Promo = {
  label: string;
  heading: string;
  copy: string;
  kind: Category["kind"];
  tone: "dark" | "light";
  image?: string;
  hoverImage?: string;
};

export const trustItems = [
  { icon: Truck, label: "Free Shipping", copy: "On all orders over $150" },
  { icon: RotateCcw, label: "Easy Returns", copy: "30 days return policy" },
  { icon: ShieldCheck, label: "Secure Payment", copy: "100% secure checkout" },
  { icon: BadgeCheck, label: "Premium Quality", copy: "Quality you can trust" },
];

export function ClothingPlaceholder({
  kind,
  inverse = false,
}: {
  kind: Category["kind"];
  inverse?: boolean;
}) {
  return (
    <div
      className={`garment-placeholder garment-${kind}${inverse ? " garment-inverse" : ""}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 360 210" role="presentation">
        {kind === "hoodie" ? (
          /* Hoodie silhouette */
          <path
            className="garment-body"
            d="M120 20 L80 50 L40 70 L55 110 L90 95 L90 185 L270 185 L270 95 L305 110 L320 70 L280 50 L240 20 Q210 40 180 40 Q150 40 120 20Z"
          />
        ) : kind === "tee" ? (
          /* T-shirt silhouette */
          <path
            className="garment-body"
            d="M125 25 L75 55 L45 80 L65 115 L100 95 L100 185 L260 185 L260 95 L295 115 L315 80 L285 55 L235 25 Q210 42 180 42 Q150 42 125 25Z"
          />
        ) : kind === "jacket" ? (
          /* Jacket / bomber silhouette */
          <path
            className="garment-body"
            d="M115 18 L70 48 L35 72 L50 115 L90 98 L90 178 L180 178 L180 178 L270 178 L270 98 L310 115 L325 72 L290 48 L245 18 Q215 38 180 38 Q145 38 115 18Z M160 18 L160 80 M200 18 L200 80"
          />
        ) : (
          /* Trousers silhouette */
          <path
            className="garment-body"
            d="M90 20 L90 110 L155 110 L180 185 L205 110 L270 110 L270 20 Z"
          />
        )}
      </svg>
    </div>
  );
}

export function CategoryCard({ category }: { category: Category }) {
  return (
    <article className="category-card">
      <div className="category-art">
        {category.image ? (
          <img
            src={category.image}
            alt={category.name}
            className="category-image"
            loading="lazy"
            data-pin-nopin="true"
          />
        ) : (
          <ClothingPlaceholder kind={category.kind} />
        )}
      </div>
      <h3>{category.name}</h3>
      <a href="#featured">
        Shop Now <ArrowRight size={13} />
      </a>
    </article>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");

  return (
    <article className={`product-card ${product.hoverImage ? "has-flip" : ""}`}>
      {product.badge && <span className="product-badge">{product.badge}</span>}
      <button className="icon-button wishlist" aria-label={`Add ${product.name} to wishlist`}>
        <Heart size={18} />
      </button>
      <div className="product-art">
        {product.image ? (
          <>
            <img
              src={product.image}
              alt={`${product.name} (Front)`}
              className={`product-image product-image-front ${activeSide === "back" ? "force-hide" : ""}`}
              loading="lazy"
              data-pin-nopin="true"
            />
            {product.hoverImage && (
              <img
                src={product.hoverImage}
                alt={`${product.name} (Back)`}
                className={`product-image product-image-back ${activeSide === "front" ? "force-hide-touch" : ""}`}
                loading="lazy"
                data-pin-nopin="true"
              />
            )}
            {product.hoverImage && (
              <div className="side-toggle-group" aria-label="Select front or back view">
                <button
                  type="button"
                  className={`side-pill ${activeSide === "front" ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveSide("front");
                  }}
                >
                  Front
                </button>
                <button
                  type="button"
                  className={`side-pill ${activeSide === "back" ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveSide("back");
                  }}
                >
                  Back
                </button>
              </div>
            )}
          </>
        ) : (
          <ClothingPlaceholder kind={product.kind} />
        )}
      </div>
      <div className="product-info">
        {product.tag && <span className="product-tag">{product.tag}</span>}
        <h3>{product.name}</h3>
        <div className="product-price-row">
          <strong>{product.price}</strong>
          {product.originalPrice && (
            <span className="product-original-price">{product.originalPrice}</span>
          )}
        </div>
        <div
          className="rating"
          aria-label={`${product.rating} out of 5 stars, ${product.reviews} reviews`}
        >
          <span>
            {Array.from({ length: 5 }, (_, index) => (
              <Star key={index} size={11} fill="currentColor" />
            ))}
          </span>
          <small>({product.reviews})</small>
        </div>
      </div>
    </article>
  );
}

export function PromoBanner({ promo }: { promo: Promo }) {
  const [activeSide, setActiveSide] = useState<"front" | "back">("back");

  return (
    <article className={`promo-panel promo-${promo.tone} ${promo.hoverImage ? "has-flip" : ""}`}>
      <div className="promo-art">
        {promo.image ? (
          <div className="promo-image-container">
            <img
              src={promo.image}
              alt={promo.heading.replace("\n", " ")}
              className={`promo-image promo-image-main ${activeSide === "front" ? "force-hide" : ""}`}
              loading="lazy"
              data-pin-nopin="true"
            />
            {promo.hoverImage && (
              <img
                src={promo.hoverImage}
                alt={`${promo.heading.replace("\n", " ")} - Front View`}
                className={`promo-image promo-image-hover ${activeSide === "back" ? "force-hide-touch" : ""}`}
                loading="lazy"
                data-pin-nopin="true"
              />
            )}
            {promo.hoverImage && (
              <div className="side-toggle-group" aria-label="Select front or back view">
                <button
                  type="button"
                  className={`side-pill ${activeSide === "back" ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveSide("back");
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className={`side-pill ${activeSide === "front" ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveSide("front");
                  }}
                >
                  Front
                </button>
              </div>
            )}
          </div>
        ) : (
          <ClothingPlaceholder kind={promo.kind} inverse={promo.tone === "dark"} />
        )}
      </div>
      <div className="promo-copy">
        <p>{promo.label}</p>
        <h2>{promo.heading}</h2>
        <span>{promo.copy}</span>
        <a href="#featured">
          Shop Now <ArrowRight size={15} />
        </a>
      </div>
    </article>
  );
}

export function NavDropdownLabel({ children }: { children: string }) {
  return (
    <span className="nav-dropdown">
      {children}
      <ChevronDown size={13} />
    </span>
  );
}

export function FeaturedProductCard({
  product,
  isCenter,
}: {
  product: Product;
  isCenter: boolean;
}) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2200);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWishlisted((prev) => !prev);
  };

  return (
    <article className={`featured-card ${isCenter ? "is-center" : "is-side"}`}>
      {/* Top Bar: Badge + Wishlist */}
      <div className="featured-card-top">
        {product.badge ? (
          <span className="featured-badge">{product.badge}</span>
        ) : (
          <span className="featured-badge empty" />
        )}
        <button
          type="button"
          className={`featured-wishlist ${isWishlisted ? "is-active" : ""}`}
          onClick={handleWishlist}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            size={isCenter ? 18 : 16}
            fill={isWishlisted ? "#e11d48" : "none"}
            color={isWishlisted ? "#e11d48" : "currentColor"}
          />
        </button>
      </div>

      {/* Product Image Stage — flex container, object-fit: contain */}
      <div className="featured-card-art">
        {product.image ? (
          <div className="featured-art-frame">
            <img
              src={product.image}
              alt={`${product.name} — front`}
              className={`featured-img featured-img-front${activeSide === "back" ? " fv-hidden" : ""}`}
              loading="eager"
              data-pin-nopin="true"
            />
            {product.hoverImage && (
              <img
                src={product.hoverImage}
                alt={`${product.name} — back`}
                className={`featured-img featured-img-back${activeSide === "front" ? " fv-hidden" : ""}`}
                loading="lazy"
                data-pin-nopin="true"
              />
            )}
          </div>
        ) : (
          <div className="featured-art-frame featured-art-placeholder">
            <ClothingPlaceholder kind={product.kind} inverse />
          </div>
        )}
      </div>

      {/* Front / Back micro-dots */}
      <div className="featured-micro-dots" aria-hidden="true">
        <span
          className={`micro-dot${activeSide === "front" ? " active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            setActiveSide("front");
          }}
          title="Front view"
        />
        {product.hoverImage ? (
          <span
            className={`micro-dot${activeSide === "back" ? " active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setActiveSide("back");
            }}
            title="Back view"
          />
        ) : (
          <span className="micro-dot dim" />
        )}
        <span className="micro-dot dim" />
      </div>

      {/* Card Body */}
      <div className="featured-card-body">
        <h3 className="featured-card-title">{product.name}</h3>
        {product.description && <p className="featured-card-desc">{product.description}</p>}

        {/* Rating */}
        <div className="featured-rating-row">
          <Star size={13} fill="#eab308" color="#eab308" />
          <span className="rating-val">{product.rating.toFixed(1)}</span>
          <span className="rating-count">({product.reviews})</span>
        </div>

        {/* Price + Cart */}
        <div className="featured-card-bottom">
          <div className="featured-price-box">
            <span className="featured-price">{product.price}</span>
            {product.originalPrice && (
              <span className="featured-original-price">{product.originalPrice}</span>
            )}
          </div>

          {isCenter ? (
            <button
              type="button"
              className={`featured-cart-btn btn-expanded${addedToCart ? " is-added" : ""}`}
              onClick={handleAddToCart}
            >
              {addedToCart ? (
                <>
                  <Check size={15} />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={15} />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className={`featured-cart-btn btn-compact${addedToCart ? " is-added" : ""}`}
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} to cart`}
            >
              {addedToCart ? <Check size={15} /> : <ShoppingBag size={15} />}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// Card widths (must match CSS)
const SIDE_W = 220; // px  (is-side card width)
const CTR_W = 330; // px  (is-center card width)
const GAP = 20; // px  between cards

export function FeaturedCarousel({ products }: { products: Product[] }) {
  const count = products.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  if (count === 0) return null;

  // We always render a virtual infinite list: [...prev extras, ...all products, ...next extras]
  // Visible window = currentIndex - 2 .. currentIndex + 2
  // The track is translated so the center card sits at 0 offset relative to the viewport.

  // Total track width for one "page" of 5 cards:
  //   SIDE_W * 4  +  CTR_W * 1  +  GAP * 4
  // The center card's left edge is at:
  //   SIDE_W * 2  +  GAP * 2

  const navigate = (dir: 1 | -1) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + dir + count) % count);
    setTimeout(() => setIsAnimating(false), 480);
  };

  const goTo = (idx: number) => {
    if (isAnimating || idx === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex((idx + count) % count);
    setTimeout(() => setIsAnimating(false), 480);
  };

  // Build the 5 visible card slots: offsets -2, -1, 0, +1, +2 from currentIndex
  const visibleSlots = [-2, -1, 0, 1, 2];

  // Calculate the CSS translateX so the center (slot 0) card lands at the viewport midpoint.
  // We place cards left-to-right; slot -2 is leftmost.
  // Left edge of slot -2 = 0
  // Left edge of slot -1 = SIDE_W + GAP
  // Left edge of slot  0 = SIDE_W*2 + GAP*2  ← center card left edge
  // Center of slot  0 = SIDE_W*2 + GAP*2 + CTR_W/2

  // Track width (5 cards + 4 gaps):
  // SIDE_W + GAP + SIDE_W + GAP + CTR_W + GAP + SIDE_W + GAP + SIDE_W
  // = SIDE_W*4 + CTR_W + GAP*4

  const trackWidth = SIDE_W * 4 + CTR_W + GAP * 4;
  const centerCardLeftEdge = SIDE_W * 2 + GAP * 2;
  const centerOfCenterCard = centerCardLeftEdge + CTR_W / 2;
  // translateX so that centerOfCenterCard aligns with 50% of the viewport (applied via CSS calc)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.targetTouches[0]) {
      setTouchStartX(e.targetTouches[0].clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || !e.changedTouches[0]) return;
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (delta > 50) navigate(-1);
    else if (delta < -50) navigate(1);
    setTouchStartX(null);
  };

  return (
    <div
      className="featured-carousel-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="featured-carousel-viewport">
        {/* Left arrow */}
        <button
          type="button"
          className="carousel-arrow-btn arrow-prev"
          onClick={() => navigate(-1)}
          disabled={isAnimating}
          aria-label="Previous product"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Sliding track — overflow hidden on viewport, track translated */}
        <div className="featured-track-overflow">
          <div
            className="featured-cards-stage"
            style={{
              width: `${trackWidth}px`,
              // Center the center-card in viewport: shift left by (centerOfCenterCard - 50vw)
              transform: `translateX(calc(50% - ${centerOfCenterCard}px))`,
              transition: isAnimating
                ? "none" // position is recalculated via key change — cards reflow instantly
                : undefined,
            }}
          >
            {visibleSlots.map((slot) => {
              const itemIndex = (((currentIndex + slot) % count) + count) % count;
              const product = products[itemIndex];
              if (!product) return null;
              const isCenter = slot === 0;

              return (
                <div
                  key={`${currentIndex}-${slot}`}
                  className={`featured-card-wrapper${isCenter ? " is-center-wrapper" : ""}`}
                  style={{ width: isCenter ? `${CTR_W}px` : `${SIDE_W}px` }}
                  onClick={() => {
                    if (!isCenter) goTo(itemIndex);
                  }}
                  role={isCenter ? undefined : "button"}
                  tabIndex={isCenter ? undefined : 0}
                  onKeyDown={(e) => {
                    if (!isCenter && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      goTo(itemIndex);
                    }
                  }}
                >
                  <FeaturedProductCard key={itemIndex} product={product} isCenter={isCenter} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right arrow */}
        <button
          type="button"
          className="carousel-arrow-btn arrow-next"
          onClick={() => navigate(1)}
          disabled={isAnimating}
          aria-label="Next product"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Pagination dots */}
      <div className="carousel-dots-indicator" role="tablist" aria-label="Featured products pages">
        {products.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`carousel-dot${index === currentIndex ? " active" : ""}`}
            onClick={() => goTo(index)}
            aria-label={`Product ${index + 1}`}
            aria-selected={index === currentIndex}
          />
        ))}
      </div>
    </div>
  );
}
