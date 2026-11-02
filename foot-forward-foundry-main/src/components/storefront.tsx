import type { ComponentType, SVGProps } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Heart,
  RotateCcw,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";

export type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export type Category = {
  name: string;
  kind: "dress" | "casual" | "boot" | "loafer";
};

export type Product = {
  name: string;
  price: string;
  reviews: number;
  rating: number;
  kind: Category["kind"];
};

export type Promo = {
  label: string;
  heading: string;
  copy: string;
  kind: Category["kind"];
  tone: "dark" | "light";
};

export const trustItems = [
  { icon: Truck, label: "Free Shipping", copy: "On all orders over $[X]" },
  { icon: RotateCcw, label: "Easy Returns", copy: "[X] days return policy" },
  { icon: ShieldCheck, label: "Secure Payment", copy: "100% secure checkout" },
  { icon: BadgeCheck, label: "Premium Quality", copy: "Quality you can trust" },
];

export function ShoePlaceholder({
  kind,
  inverse = false,
}: {
  kind: Category["kind"];
  inverse?: boolean;
}) {
  return (
    <div
      className={`shoe-placeholder shoe-${kind}${inverse ? " shoe-inverse" : ""}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 360 210" role="presentation">
        <path className="shoe-shadow" d="M50 177c52-17 218-18 272 1-42 24-233 25-272-1Z" />
        {kind === "boot" ? (
          <path
            className="shoe-body"
            d="M96 26h104l5 86c18 18 51 26 93 36 18 4 28 17 26 34H48c-5-26 11-41 45-47l3-109Z"
          />
        ) : kind === "loafer" ? (
          <path
            className="shoe-body"
            d="M71 123c25-6 50-31 71-66l95 29c18 24 45 39 79 49 19 6 27 19 21 39H48c-2-22 5-39 23-51Zm62-31 90 26"
          />
        ) : kind === "dress" ? (
          <path
            className="shoe-body"
            d="M67 127c41-11 72-40 94-88l79 35c7 26 35 45 84 59 21 6 27 22 18 43H43c-2-24 6-40 24-49Zm91-55 65 29m-79-8 83 32"
          />
        ) : (
          <path
            className="shoe-body"
            d="M47 130c37-10 70-37 98-81l57 23 28 42c30 10 59 19 86 26 17 5 24 18 19 37H42c-3-21-1-37 5-47Zm90-42 89 38m-104-17 102 43"
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
        <ShoePlaceholder kind={category.kind} />
      </div>
      <h3>{category.name}</h3>
      <a href="#featured">
        Shop Now <ArrowRight size={13} />
      </a>
    </article>
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <button className="icon-button wishlist" aria-label={`Add ${product.name} to wishlist`}>
        <Heart size={18} />
      </button>
      <div className="product-art">
        <ShoePlaceholder kind={product.kind} />
      </div>
      <div className="product-info">
        <h3>{product.name}</h3>
        <strong>{product.price}</strong>
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
  return (
    <article className={`promo-panel promo-${promo.tone}`}>
      <div className="promo-copy">
        <p>{promo.label}</p>
        <h2>{promo.heading}</h2>
        <span>{promo.copy}</span>
        <a href="#featured">
          Shop Now <ArrowRight size={15} />
        </a>
      </div>
      <div className="promo-art">
        <ShoePlaceholder kind={promo.kind} inverse={promo.tone === "dark"} />
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
