import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import heroImage from "../assets/hero-thorns.jpg";
import { TrendingItemSection } from "../components/TrendingItemSection";
import { FeaturedProductsSection } from "../components/FeaturedProductsSection";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jesusity | Official Store" },
      {
        name: "description",
        content:
          "Exclusive streetwear drops, graphic tees, and luxury heavyweight essentials from Jesusity.",
      },
      { property: "og:title", content: "Jesusity | Official Store" },
      {
        property: "og:description",
        content: "Timeless style. Unmatched quality. Built for every chapter of your journey.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="storefront-homepage">
      {/* HERO SECTION */}
      <section className="hero-section" aria-label="Hero">
        <div className="hero-copy">
          <h1>
            <span className="hero-line">
              <span>Endless</span>
            </span>
            <span className="hero-line">
              <span>Pursuit</span>
            </span>
          </h1>
          <p className="hero-subtext">
            Timeless style. Unmatched quality.
            <br />
            Built for every chapter of your journey.
          </p>
          <div className="hero-ctas">
            <Link className="primary-cta" to="/shop" search={{ sort: "best-selling" }}>
              Shop Now <ArrowRight size={17} className="cta-arrow" />
            </Link>
            <Link className="secondary-cta" to="/lookbook">
              View Lookbook
            </Link>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="hero-radial-highlight" />
          <img
            src={heroImage}
            alt="Man wearing black heavyweight sweatshirt with tonal crown-of-thorns embroidery"
            loading="eager"
            className="hero-bg-image"
            data-pin-nopin="true"
          />
          <div className="hero-spotlight">
            <img src={heroImage} alt="" className="hero-bg-image hero-lit-image" />
          </div>
        </div>

        <a href="#trending" className="hero-scroll-indicator" aria-label="Scroll to trending piece">
          <span className="scroll-text">SCROLL</span>
          <span className="scroll-line">
            <span className="scroll-dot" />
          </span>
        </a>
      </section>

      {/* TRENDING ITEM SECTION */}
      <TrendingItemSection />

      {/* FEATURED PRODUCTS RAIL */}
      <FeaturedProductsSection />

      {/* NEWSLETTER */}
      <section className="newsletter">
        <div>
          <h2>Stay in the Loop</h2>
          <p>
            Subscribe to get special offers, free giveaways,
            <br />
            and once-in-a-lifetime deals.
          </p>
        </div>
        <form onSubmit={(event) => event.preventDefault()}>
          <label className="sr-only" htmlFor="email">
            Email address
          </label>
          <input id="email" type="email" placeholder="Enter your email" required />
          <button type="submit">Subscribe</button>
        </form>
      </section>
    </div>
  );
}
