import { useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { products, getCollections, type Product } from "../data/products";
import { PageHeader } from "../components/common/PageHeader";
import { ProductCard } from "../components/common/ProductCard";
import { SlidersHorizontal } from "lucide-react";

interface ShopSearchParams {
  sort?: "newest" | "best-selling" | "price-asc" | "price-desc";
  category?: string;
  collection?: string;
  filter?: string;
}

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearchParams => {
    const res: ShopSearchParams = {};
    const sortVal = search["sort"];
    if (
      sortVal === "newest" ||
      sortVal === "best-selling" ||
      sortVal === "price-asc" ||
      sortVal === "price-desc"
    ) {
      res.sort = sortVal;
    }
    const catVal = search["category"];
    if (typeof catVal === "string" && catVal) {
      res.category = catVal;
    }
    const colVal = search["collection"];
    if (typeof colVal === "string" && colVal) {
      res.collection = colVal;
    }
    const filterVal = search["filter"];
    if (typeof filterVal === "string" && filterVal) {
      res.filter = filterVal;
    }
    return res;
  },
  head: () => ({
    meta: [
      { title: "Graphic Tees | Supernatural Apparel" },
      {
        name: "description",
        content:
          "Shop exclusive heavyweight graphic tees and luxury essentials engineered by Supernatural.",
      },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const collections = getCollections();

  const currentCategory = search.category?.toLowerCase();
  const currentCollection = search.collection?.toLowerCase();
  const currentSort = search.sort || "best-selling";
  const currentFilter = search.filter;

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Filter by collection
    if (currentCollection) {
      list = list.filter((p) => p.collectionSlug?.toLowerCase() === currentCollection);
    }

    // Filter by category
    if (currentCategory) {
      list = list.filter((p) => p.category.toLowerCase() === currentCategory);
    }

    // Filter by sale
    if (currentFilter === "sale") {
      list = list.filter((p) => Boolean(p.compareAtPrice && p.compareAtPrice > p.price));
    }

    // Sort
    switch (currentSort) {
      case "best-selling":
      default:
        list.sort((a, b) => {
          const aScore = (a.badge === "BEST SELLER" ? 2 : 0) + (a.badge === "TRENDING" ? 1 : 0) + (a.reviewCount || 0);
          const bScore = (b.badge === "BEST SELLER" ? 2 : 0) + (b.badge === "TRENDING" ? 1 : 0) + (b.reviewCount || 0);
          return bScore - aScore;
        });
        break;
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        list.sort((a, b) => (a.badge === "BEST SELLER" ? -1 : b.badge === "BEST SELLER" ? 1 : 0));
        break;
    }

    return list;
  }, [currentCollection, currentCategory, currentFilter, currentSort]);

  const handleFilterAll = () => {
    navigate({
      search: (prev) => {
        const next: ShopSearchParams = { ...prev };
        delete next.category;
        delete next.collection;
        delete next.filter;
        return next;
      },
    });
  };

  const handleCollectionChange = (colSlug?: string) => {
    navigate({
      search: (prev) => {
        const next: ShopSearchParams = { ...prev };
        if (colSlug) {
          next.collection = colSlug;
        } else {
          delete next.collection;
        }
        delete next.category;
        delete next.filter;
        return next;
      },
    });
  };

  const handleFilterSale = () => {
    navigate({
      search: (prev) => {
        const next: ShopSearchParams = { ...prev };
        if (next.filter === "sale") {
          delete next.filter;
        } else {
          next.filter = "sale";
        }
        delete next.category;
        delete next.collection;
        return next;
      },
    });
  };

  const handleSortChange = (sortVal?: ShopSearchParams["sort"]) => {
    navigate({
      search: (prev) => {
        const next: ShopSearchParams = { ...prev };
        if (sortVal) {
          next.sort = sortVal;
        } else {
          delete next.sort;
        }
        return next;
      },
    });
  };

  // Dynamic header title
  const activeCollectionObj = collections.find((c) => c.slug === currentCollection);
  const pageTitle = activeCollectionObj
    ? activeCollectionObj.name.toUpperCase()
    : currentFilter === "sale"
      ? "SALE ARCHIVE"
      : currentSort === "best-selling" || currentSort === "newest"
        ? "BEST SELLERS"
        : "GRAPHIC TEES";

  const pageSubcopy = activeCollectionObj
    ? activeCollectionObj.description
    : currentFilter === "sale"
      ? "Archival and promotional graphic tees with limited remaining stock."
      : currentSort === "best-selling" || currentSort === "newest"
        ? "Our highest-rated heavyweight graphic tees and customer favorites."
        : "The complete Supernatural graphic tee lineup. 280 GSM heavyweight drapes and limited editions.";

  return (
    <div className="catalog-page-container">
      <PageHeader eyebrow="SUPERNATURAL / CATALOG" title={pageTitle} subcopy={pageSubcopy} />

      <div className="catalog-toolbar">
        {/* Category & Filter Tabs */}
        <div className="catalog-filter-tabs" role="tablist" aria-label="Tee filters">
          <button
            type="button"
            role="tab"
            aria-selected={!currentCollection && !currentFilter}
            className={`catalog-tab-btn ${!currentCollection && !currentFilter ? "active" : ""}`}
            onClick={handleFilterAll}
          >
            All Tees ({products.length})
          </button>

          {collections.map((col) => (
            <button
              key={col.slug}
              type="button"
              role="tab"
              aria-selected={currentCollection === col.slug}
              className={`catalog-tab-btn ${currentCollection === col.slug ? "active" : ""}`}
              onClick={() => handleCollectionChange(col.slug)}
            >
              {col.name} ({col.count})
            </button>
          ))}

          <button
            type="button"
            role="tab"
            aria-selected={currentFilter === "sale"}
            className={`catalog-tab-btn sale-tab ${currentFilter === "sale" ? "active" : ""}`}
            onClick={handleFilterSale}
          >
            Sale Archive
          </button>
        </div>

        {/* Sort Select */}
        <div className="catalog-sort-group">
          <label htmlFor="shop-sort" className="catalog-sort-label">
            <SlidersHorizontal size={14} />
            <span>SORT:</span>
          </label>
          <select
            id="shop-sort"
            className="catalog-sort-select"
            value={currentSort}
            onChange={(e) => handleSortChange(e.target.value as ShopSearchParams["sort"])}
          >
            <option value="best-selling">BEST SELLERS</option>
            <option value="price-asc">PRICE: LOW TO HIGH</option>
            <option value="price-desc">PRICE: HIGH TO LOW</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="catalog-empty-grid">
          <h3>NO PRODUCTS FOUND</h3>
          <p>Try adjusting your category or sort filters to view available garments.</p>
          <button
            type="button"
            className="catalog-reset-btn"
            onClick={handleFilterAll}
          >
            CLEAR FILTERS
          </button>
        </div>
      ) : (
        <div className="catalog-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
