import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Minus, Plus } from "lucide-react";
import { type Product } from "../../data/products";

interface ProductAccordionProps {
  product: Product;
}

type AccordionSectionId = "description" | "fit" | "fabric" | "delivery";

export function ProductAccordion({ product }: ProductAccordionProps) {
  const [openSection, setOpenSection] = useState<AccordionSectionId | null>("description");

  const toggleSection = (id: AccordionSectionId) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const details = product.details;

  return (
    <div className="pdp-accordion-root" aria-label="Product Information">
      {/* 1. DESCRIPTION */}
      <div className="pdp-accordion-item">
        <h3>
          <button
            type="button"
            className="pdp-accordion-header"
            onClick={() => toggleSection("description")}
            aria-expanded={openSection === "description"}
            aria-controls="pdp-sec-description"
            id="pdp-header-description"
          >
            <span>DESCRIPTION</span>
            <span className="pdp-accordion-icon">
              {openSection === "description" ? <Minus size={16} /> : <Plus size={16} />}
            </span>
          </button>
        </h3>
        <div
          id="pdp-sec-description"
          role="region"
          aria-labelledby="pdp-header-description"
          className={`pdp-accordion-body ${openSection === "description" ? "open" : ""}`}
        >
          <div className="pdp-accordion-inner">
            <p className="pdp-accordion-text">
              {details?.description ||
                product.description ||
                "Heavyweight luxury streetwear tailored with precision in Accra, Ghana."}
            </p>
            {product.collection && (
              <div className="pdp-accordion-meta-line">
                <span className="pdp-accordion-meta-label">COLLECTION:</span>
                <span className="pdp-accordion-meta-val">{product.collection}</span>
              </div>
            )}
            {product.category && (
              <div className="pdp-accordion-meta-line">
                <span className="pdp-accordion-meta-label">CATEGORY:</span>
                <span className="pdp-accordion-meta-val">{product.category}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. FIT & SIZING */}
      <div className="pdp-accordion-item">
        <h3>
          <button
            type="button"
            className="pdp-accordion-header"
            onClick={() => toggleSection("fit")}
            aria-expanded={openSection === "fit"}
            aria-controls="pdp-sec-fit"
            id="pdp-header-fit"
          >
            <span>FIT & SIZING</span>
            <span className="pdp-accordion-icon">
              {openSection === "fit" ? <Minus size={16} /> : <Plus size={16} />}
            </span>
          </button>
        </h3>
        <div
          id="pdp-sec-fit"
          role="region"
          aria-labelledby="pdp-header-fit"
          className={`pdp-accordion-body ${openSection === "fit" ? "open" : ""}`}
        >
          <div className="pdp-accordion-inner">
            <p className="pdp-accordion-text">
              {details?.fit ||
                "Engineered with dropped shoulders and a boxy silhouette for an authentic luxury drape. Fits true to size for an oversized streetwear look. Take your regular size or size down for a slimmer tailored profile."}
            </p>
            <ul className="pdp-accordion-list">
              <li>Relaxed structured body drape</li>
              <li>Reinforced collar and cuffs designed to prevent sagging over time</li>
              <li>Preshrunk combed cotton minimizing shrinkage after wash</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. FABRIC & CARE */}
      <div className="pdp-accordion-item">
        <h3>
          <button
            type="button"
            className="pdp-accordion-header"
            onClick={() => toggleSection("fabric")}
            aria-expanded={openSection === "fabric"}
            aria-controls="pdp-sec-fabric"
            id="pdp-header-fabric"
          >
            <span>FABRIC & CARE</span>
            <span className="pdp-accordion-icon">
              {openSection === "fabric" ? <Minus size={16} /> : <Plus size={16} />}
            </span>
          </button>
        </h3>
        <div
          id="pdp-sec-fabric"
          role="region"
          aria-labelledby="pdp-header-fabric"
          className={`pdp-accordion-body ${openSection === "fabric" ? "open" : ""}`}
        >
          <div className="pdp-accordion-inner">
            <div className="pdp-accordion-fabric-spec">
              <span className="pdp-fabric-title">COMPOSITION</span>
              <p>{details?.fabric || "100% Combed Heavy Organic Cotton (280 GSM)."}</p>
            </div>
            {details?.care && details.care.length > 0 ? (
              <div className="pdp-accordion-care-instructions">
                <span className="pdp-fabric-title">CARE GUIDE</span>
                <ul className="pdp-accordion-list">
                  {details.care.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <ul className="pdp-accordion-list">
                <li>Wash cold inside-out with like dark colors</li>
                <li>Do not tumble dry; lay flat in shade</li>
                <li>Do not iron directly over artwork</li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* 4. DELIVERY & RETURNS */}
      <div className="pdp-accordion-item">
        <h3>
          <button
            type="button"
            className="pdp-accordion-header"
            onClick={() => toggleSection("delivery")}
            aria-expanded={openSection === "delivery"}
            aria-controls="pdp-sec-delivery"
            id="pdp-header-delivery"
          >
            <span>DELIVERY & RETURNS</span>
            <span className="pdp-accordion-icon">
              {openSection === "delivery" ? <Minus size={16} /> : <Plus size={16} />}
            </span>
          </button>
        </h3>
        <div
          id="pdp-sec-delivery"
          role="region"
          aria-labelledby="pdp-header-delivery"
          className={`pdp-accordion-body ${openSection === "delivery" ? "open" : ""}`}
        >
          <div className="pdp-accordion-inner">
            {/* TODO: replace with real policy */}
            <p className="pdp-accordion-text">
              All orders are dispatched from our Accra atelier via discreet tracked courier. We
              deliver across Greater Accra within 1-2 business days and across other regions in
              Ghana within 2-5 business days. International express shipping is available at
              checkout.
            </p>
            <p className="pdp-accordion-text">
              We accept unworn, unwashed returns in original packaging within 7 days of delivery.
            </p>
            <div className="pdp-accordion-policy-links">
              <Link
                to="/policies/$slug"
                params={{ slug: "shipping" }}
                className="pdp-policy-nav-link"
              >
                Full Shipping Policy <ChevronRight size={13} />
              </Link>
              <Link
                to="/policies/$slug"
                params={{ slug: "returns" }}
                className="pdp-policy-nav-link"
              >
                Returns & Exchanges <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
