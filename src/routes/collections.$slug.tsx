import { createFileRoute, Link } from "@tanstack/react-router";
import { getCollections, getProductsByCollection } from "../data/products";
import { PageHeader } from "../components/common/PageHeader";
import { ProductCard } from "../components/common/ProductCard";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/collections/$slug")({
  head: ({ params }) => {
    const collections = getCollections();
    const collection = collections.find((c) => c.slug === params.slug);
    const title = collection ? `${collection.name} Collection` : "Collection Not Found";

    return {
      meta: [
        { title: `${title} | Supernatural Apparel` },
        {
          name: "description",
          content:
            collection?.description || "Explore curated collections from Supernatural Apparel.",
        },
      ],
    };
  },
  component: CollectionDetailPage,
});

function CollectionDetailPage() {
  const { slug } = Route.useParams();
  const collections = getCollections();
  const collection = collections.find((c) => c.slug === slug);
  const collectionProducts = getProductsByCollection(slug);

  if (!collection) {
    return (
      <div className="branded-not-found-container">
        <div className="branded-not-found-card">
          <div className="branded-not-found-code">COLLECTION NOT FOUND</div>
          <h1 className="branded-not-found-title">CHAPTER ARCHIVED</h1>
          <p className="branded-not-found-desc">
            The collection you requested cannot be located or has completed its seasonal release
            cycle.
          </p>
          <div className="branded-not-found-actions">
            <Link to="/shop" className="branded-not-found-btn-primary">
              <ArrowLeft size={16} /> EXPLORE ALL TEES
            </Link>
            <Link to="/lookbook" className="branded-not-found-btn-secondary">
              VIEW LOOKBOOK
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="collection-page-container">
      <PageHeader
        eyebrow="COLLECTION DROP"
        title={collection.name}
        subcopy={collection.description}
      />

      <div className="collection-meta-bar">
        <Link to="/shop" className="collection-back-link">
          <ArrowLeft size={14} /> Back to Catalog
        </Link>
        <span className="collection-count">
          {collectionProducts.length} {collectionProducts.length === 1 ? "PIECE" : "PIECES"} IN
          CAPSULE
        </span>
      </div>

      {collectionProducts.length === 0 ? (
        <div className="catalog-empty-grid">
          <h3>ARCHIVAL CAPSULE</h3>
          <p>Garments from this collection are currently archived or undergoing restock.</p>
          <Link to="/shop" className="catalog-reset-btn">
            EXPLORE CURRENT DROPS
          </Link>
        </div>
      ) : (
        <div className="catalog-grid">
          {collectionProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
