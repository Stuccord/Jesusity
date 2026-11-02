import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us | Jesusity" },
      {
        name: "description",
        content:
          "Discover Jesusity: the story of our relentless pursuit of timeless luxury streetwear and heavy-gauge craftsmanship.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="about-page-container">
      <PageHeader
        eyebrow="OUR PHILOSOPHY"
        title="ENDLESS PURSUIT"
        subcopy="Built for every chapter of your journey. Timeless style, unmatched heavyweight craftsmanship."
      />

      <div className="about-content-section">
        <div className="about-narrative-grid">
          <div className="about-narrative-text">
            <h2>CRAFTED WITHOUT COMPROMISE</h2>
            <p>
              Jesusity was founded on a singular conviction: streetwear should not be
              disposable. In an era of fleeting trends and flimsy fabrics, we craft architectural
              essentials from dense, 280 to 480 GSM combed luxury cotton designed to endure decades
              of wear.
            </p>
            <p>
              Rooted in Accra and engineered with global architectural precision, each piece bridges
              biblical allegory, street precision, and raw cultural identity. Every drop is produced
              in strictly numbered, limited editions to preserve integrity and avoid overproduction.
            </p>
          </div>

          <div className="about-pillars-grid">
            <div className="about-pillar-card">
              <Sparkles size={24} className="text-[#ffffff]" />
              <h3>ARCHITECTURAL DRAPE</h3>
              <p>
                Engineered drop shoulders, reinforced necklines, and calculated drape that holds
                structured form throughout the day.
              </p>
            </div>
            <div className="about-pillar-card">
              <ShieldCheck size={24} className="text-[#ffffff]" />
              <h3>LIMITED RUNS</h3>
              <p>
                Each capsule release is archived once allocated. We believe true luxury lies in
                restraint and genuine rarity.
              </p>
            </div>
            <div className="about-pillar-card">
              <Trophy size={24} className="text-[#ffffff]" />
              <h3>LOCAL ROOTS, GLOBAL FINISH</h3>
              <p>
                Designed in Ghana with custom metallic hardware and master tailoring that competes
                on any international stage.
              </p>
            </div>
          </div>
        </div>

        <div className="about-cta-banner">
          <div>
            <h3>DISCOVER THE CURRENT RELEASE</h3>
            <p>Experience the heavyweight feel in person or browse the digital collection.</p>
          </div>
          <div className="about-cta-buttons">
            <Link to="/shop" className="about-btn-primary">
              SHOP GRAPHIC TEES <ArrowRight size={15} />
            </Link>
            <Link to="/lookbook" className="about-btn-secondary">
              EXPLORE LOOKBOOK
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
