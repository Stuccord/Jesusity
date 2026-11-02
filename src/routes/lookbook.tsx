import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import heroImage from "../assets/hero-thorns.jpg";
import thornyCrownBlackWhite from "../assets/products/thorny-crown-black-white.jpg";
import thornyCrownWhiteBold from "../assets/products/thorny-crown-white-bold.jpg";
import { products } from "../data/products";

export const Route = createFileRoute("/lookbook")({
  head: () => ({
    meta: [
      { title: "Lookbook | Supernatural Apparel" },
      {
        name: "description",
        content:
          "Explore the visual editorial lookbook for Supernatural: architectural silhouettes, raw street textures, and timeless luxury.",
      },
    ],
  }),
  component: LookbookPage,
});

function LookbookPage() {
  const editorialItems = [
    {
      title: "CHAPTER I: THE CROWN & THE THORNS",
      season: "DROP 01 CAMPAIGN",
      description:
        "High-density embroidery and sacred allegories captured against brutalist concrete in central Accra. Heavy 280 GSM cotton tailored for effortless drape.",
      image: heroImage,
      ctaText: "Explore Thorny Crown",
      ctaLink: "/collections/thorny-crown",
    },
    {
      title: "CHAPTER II: THE VALUABLE FISH",
      season: "ARCHIVAL SPECIAL",
      description:
        "Vivid chromatic iridescent printing on garment-dyed vintage black jersey. An homage to Matthew 17:27 and the currency of faith.",
      image: thornyCrownBlackWhite,
      ctaText: "Shop The Collection",
      ctaLink: "/collections/the-most-valuable-fish",
    },
    {
      title: "CHAPTER III: CORE FOUNDATIONS",
      season: "ESSENTIALS CAPSULE",
      description:
        "Heavyweight garment-dyed combed cotton tees finished with subtle monochrome micro-embroidery detailing.",
      image: thornyCrownWhiteBold,
      ctaText: "Shop Core Essentials",
      ctaLink: "/collections/core-essentials",
    },
  ];

  return (
    <div className="lookbook-page-container">
      <PageHeader
        eyebrow="EDITORIAL ARCHIVE"
        title="VISUAL LOOKBOOK"
        subcopy="A photographic exploration of weight, texture, and cultural allegory."
      />

      <div className="lookbook-chapters-list">
        {editorialItems.map((chapter, idx) => (
          <section key={chapter.title} className="lookbook-chapter-row">
            <div className="lookbook-image-panel">
              <img src={chapter.image} alt={chapter.title} className="lookbook-img" />
              <div className="lookbook-season-badge">{chapter.season}</div>
            </div>

            <div className="lookbook-text-panel">
              <span className="lookbook-chapter-index">0{idx + 1} // CHAPTER</span>
              <h2>{chapter.title}</h2>
              <p>{chapter.description}</p>
              <Link to={chapter.ctaLink} className="lookbook-cta-btn">
                {chapter.ctaText} <ArrowRight size={15} />
              </Link>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
