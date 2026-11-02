import { useState, useRef, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getProductBySlug, getRelatedProducts, type Product } from "../data/products";
import { BrandedNotFound } from "../components/common/BrandedNotFound";
import { ProductGallery } from "../components/pdp/ProductGallery";
import { ProductBuyBox } from "../components/pdp/ProductBuyBox";
import { ProductAccordion } from "../components/pdp/ProductAccordion";
import { ProductStoryBlock } from "../components/pdp/ProductStoryBlock";
import { SizeGuideModal } from "../components/pdp/SizeGuideModal";
import { ProductStickyMobileBar } from "../components/pdp/ProductStickyMobileBar";
import { FeaturedProductsSection } from "../components/FeaturedProductsSection";

export const Route = createFileRoute("/products/$slug")({
  head: ({ params }) => {
    const product = getProductBySlug(params.slug);
    if (!product) {
      return {
        meta: [
          { title: "Product Not Found | Jesusity" },
          {
            name: "description",
            content: "The requested piece could not be located in our catalog.",
          },
        ],
      };
    }

    return {
      meta: [
        { title: `${product.name} | Jesusity` },
        {
          name: "description",
          content:
            product.description ||
            `Luxury heavyweight streetwear essential engineered by Jesusity. ${product.colorway}.`,
        },
      ],
    };
  },
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const product = getProductBySlug(slug);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [shakeSize, setShakeSize] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const sizeSelectorRef = useRef<HTMLDivElement>(null);

  // Reset size selection when product slug changes
  useEffect(() => {
    setSelectedSize(null);
    setShakeSize(false);
    setIsSizeGuideOpen(false);
    setIsLoaded(true);
  }, [slug]);

  if (!product) {
    return (
      <BrandedNotFound
        title="PIECE UNAVAILABLE"
        message="The requested garment does not exist in our catalog or has been moved to our archival vault."
      />
    );
  }

  const triggerShake = () => {
    setShakeSize(true);
    setTimeout(() => setShakeSize(false), 500);
  };

  const relatedProducts = getRelatedProducts(product, 4);

  // Structured Data (JSON-LD)
  const isAvailable = product.sizes.some((s) => s.inStock) && product.badge !== "SOLD OUT";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [product.images.front, product.images.back].filter(Boolean),
    description:
      product.description || `${product.name} in ${product.colorway} by Jesusity.`,
    color: product.colorway,
    brand: {
      "@type": "Brand",
      name: "Jesusity",
    },
    offers: {
      "@type": "Offer",
      url: `https://jesusity.com/products/${product.slug}`,
      priceCurrency: "GHS",
      price: product.price,
      availability: isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className={`pdp-page-container ${isLoaded ? "pdp-ready" : ""}`}>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* TOP BREADCRUMB */}
      <div className="pdp-breadcrumb-wrapper">
        <nav className="pdp-breadcrumbs-nav" aria-label="Breadcrumb">
          <Link to="/" className="pdp-crumb-link">
            HOME
          </Link>
          <span className="pdp-crumb-sep">/</span>
          <Link to="/shop" className="pdp-crumb-link">
            SHOP
          </Link>
          <span className="pdp-crumb-sep">/</span>
          <span className="pdp-crumb-current" aria-current="page">
            {product.name}
          </span>
        </nav>
      </div>

      {/* MAIN TWO-COLUMN SECTION */}
      <section className="pdp-main-section">
        <div className="pdp-main-container">
          {/* LEFT COLUMN 58%: Gallery */}
          <div className="pdp-gallery-col">
            <ProductGallery product={product} />
          </div>

          {/* RIGHT COLUMN 42%: Sticky Buy Box & Details Accordion */}
          <div className="pdp-buybox-col">
            <div className="pdp-buybox-sticky-wrapper">
              <ProductBuyBox
                product={product}
                selectedSize={selectedSize}
                onSelectSize={setSelectedSize}
                onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
                sizeSelectorRef={sizeSelectorRef}
                shakeSize={shakeSize}
                onTriggerShake={triggerShake}
              />

              <div className="pdp-accordion-wrapper">
                <ProductAccordion product={product} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FULL-WIDTH STORY BLOCK (only rendered if product.story exists) */}
      {product.story && <ProductStoryBlock story={product.story} />}

      {/* YOU MAY ALSO LIKE RAIL */}
      {relatedProducts.length > 0 && (
        <section className="pdp-related-rail-section" aria-label="Recommended pieces">
          <FeaturedProductsSection
            productsList={relatedProducts}
            title="YOU MAY ALSO LIKE"
            eyebrow="CURATED COMPANIONS"
            subcopy="Pieces precision-tailored to complement this silhouette."
            viewAllLink="/shop"
          />
        </section>
      )}

      {/* SIZE GUIDE MODAL */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        sizeChart={product.sizeChart}
        selectedSize={selectedSize}
        productName={product.name}
      />

      {/* STICKY BOTTOM BAR ON MOBILE (< 1024px) */}
      <ProductStickyMobileBar
        product={product}
        selectedSize={selectedSize}
        sizeSelectorRef={sizeSelectorRef}
        onTriggerShake={triggerShake}
      />
    </div>
  );
}
