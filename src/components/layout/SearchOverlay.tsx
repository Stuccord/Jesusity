import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { ArrowRight, Search, X } from "lucide-react";
import { useProducts } from "../../context/CatalogContext";
import { searchProducts, formatGHS, type Product } from "../../data/products";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const products = useProducts();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input and lock scroll when opened
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Handle live search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const matches = searchProducts(products, query);
    setResults(matches);
  }, [query, products]);

  // Handle keys (Escape to close, Enter to navigate to /search?q=...)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter" && query.trim()) {
      e.preventDefault();
      onClose();
      navigate({ to: "/search", search: { q: query.trim() } });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      navigate({ to: "/search", search: { q: query.trim() } });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="search-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Search storefront"
      onKeyDown={handleKeyDown}
    >
      <div className="search-overlay-backdrop" onClick={onClose} />

      <div className="search-overlay-content">
        <div className="search-overlay-header">
          <form className="search-overlay-form" onSubmit={handleFormSubmit}>
            <Search className="search-overlay-icon" size={26} />
            <input
              ref={inputRef}
              type="search"
              className="search-overlay-input"
              placeholder="SEARCH BY KEYWORD, PRODUCT, OR DROP..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search products"
            />
            {query && (
              <button
                type="button"
                className="search-overlay-clear"
                onClick={() => setQuery("")}
                aria-label="Clear search input"
              >
                <X size={18} />
              </button>
            )}
          </form>

          <button
            type="button"
            className="search-overlay-close-btn"
            onClick={onClose}
            aria-label="Close search"
          >
            <X size={24} />
          </button>
        </div>

        {/* Live Results Panel */}
        <div className="search-overlay-body">
          {query.trim() && (
            <div className="search-overlay-results-bar">
              <span className="search-results-count">
                {results.length} {results.length === 1 ? "RESULT" : "RESULTS"} FOR "
                {query.toUpperCase()}"
              </span>
              {results.length > 0 && (
                <button type="button" className="search-view-all-link" onClick={handleFormSubmit}>
                  VIEW ALL RESULTS <ArrowRight size={13} />
                </button>
              )}
            </div>
          )}

          {query.trim() && results.length === 0 && (
            <div className="search-empty-state">
              <p>NO PRODUCTS MATCHED YOUR QUERY</p>
              <span>Try searching for "tee", "fish", "black", or "thorns".</span>
            </div>
          )}

          {results.length > 0 && (
            <div className="search-results-grid">
              {results.map((product) => (
                <Link
                  key={product.id}
                  to="/products/$slug"
                  params={{ slug: product.slug }}
                  className="search-result-card"
                  onClick={onClose}
                >
                  <div className="search-result-image-box">
                    <img src={product.images.front} alt={product.name} loading="lazy" />
                    {product.badge && <span className="search-result-badge">{product.badge}</span>}
                  </div>
                  <div className="search-result-info">
                    <div className="search-result-name">{product.name}</div>
                    <div className="search-result-color">{product.colorway}</div>
                    <div className="search-result-price-row">
                      <span className="search-result-price">{formatGHS(product.price)}</span>
                      {product.compareAtPrice && (
                        <span className="search-result-compare">
                          {formatGHS(product.compareAtPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!query.trim() && (
            <div className="search-quick-links">
              <span className="search-quick-title">POPULAR SEARCHES</span>
              <div className="search-quick-tags">
                {["Graphic Tees", "Thorny Crown", "The Valuable Fish", "Core Essentials", "Sale"].map(
                  (term) => (
                    <button
                      key={term}
                      type="button"
                      className="search-tag-chip"
                      onClick={() => setQuery(term)}
                    >
                      {term}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
