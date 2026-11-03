import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "../components/common/PageHeader";
import { ProductCard } from "../components/common/ProductCard";
import { useProducts } from "../context/CatalogContext";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist | Jesusity" },
      { name: "description", content: "Pieces you've saved on this device." },
    ],
  }),
  component: WishlistPage,
});

// Saved on this device only (no customer accounts)
const WISHLIST_KEY = "supernatural_wishlist";

function WishlistPage() {
  const products = useProducts();
  const [savedIds, setSavedIds] = useState<string[] | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? "[]");
      setSavedIds(Array.isArray(saved) ? saved : []);
    } catch {
      setSavedIds([]);
    }
  }, []);

  const saved = products.filter((p) => savedIds?.includes(p.id));

  return (
    <div className="catalog-page-container">
      <PageHeader
        eyebrow="SAVED PIECES"
        title="WISHLIST"
        subcopy="Tap the heart on any product to save it here. Your wishlist is kept on this device."
      />

      {savedIds === null ? null : saved.length === 0 ? (
        <div className="cart-page-empty">
          <h2>NOTHING SAVED YET</h2>
          <p>Browse the shop and tap the heart on anything you love.</p>
          <Link to="/shop" className="cart-empty-btn">
            EXPLORE SHOP
          </Link>
        </div>
      ) : (
        <div className="catalog-grid">
          {saved.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
