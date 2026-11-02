import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, ArrowRight } from "lucide-react";
import { searchProducts, products, type Product } from "../data/products";
import { PageHeader } from "../components/common/PageHeader";
import { ProductCard } from "../components/common/ProductCard";

interface SearchPageParams {
  q?: string;
}

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchPageParams => {
    const q = typeof search["q"] === "string" ? search["q"] : undefined;
    return q ? { q } : {};
  },
  head: () => ({
    meta: [
      { title: "Search Catalog | Supernatural Apparel" },
      {
        name: "description",
        content:
          "Search the complete Supernatural catalog of heavyweight graphic tees and luxury essentials.",
      },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const currentQ = searchParams.q || "";
  const [inputVal, setInputVal] = useState(currentQ);

  const results = useMemo(() => {
    if (!currentQ.trim()) return products;
    return searchProducts(currentQ);
  }, [currentQ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      navigate({ search: { q: inputVal.trim() } });
    }
  };

  const headerTitle = currentQ.trim() ? `SEARCH: "${currentQ.toUpperCase()}"` : "SEARCH STOREFRONT";

  const headerSubcopy = currentQ.trim()
    ? `Showing ${results.length} ${results.length === 1 ? "piece" : "pieces"} matching your inquiry.`
    : "Enter a keyword, product name, or collection to discover available pieces.";

  return (
    <div className="search-page-container">
      <PageHeader eyebrow="CATALOG QUERY" title={headerTitle} subcopy={headerSubcopy} />

      {/* Refine Search Bar */}
      <div className="search-page-bar-wrap">
        <form onSubmit={handleSearchSubmit} className="search-page-form">
          <Search size={18} className="search-page-form-icon" />
          <input
            type="search"
            placeholder="SEARCH PRODUCTS, DROPS, MATERIALS..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="search-page-input"
          />
          <button type="submit" className="search-page-submit-btn">
            SEARCH
          </button>
        </form>
      </div>

      {results.length === 0 ? (
        <div className="catalog-empty-grid">
          <h3>NO EXACT MATCHES FOUND</h3>
          <p>
            We couldn't find any pieces matching "{currentQ}". Explore these popular collections
            instead:
          </p>
          <div className="search-empty-suggestions">
            {["Graphic Tees", "Thorny Crown", "The Valuable Fish", "Core Essentials"].map((term) => (
              <button
                key={term}
                type="button"
                className="search-tag-chip"
                onClick={() => {
                  setInputVal(term);
                  navigate({ search: { q: term } });
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="catalog-grid">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
