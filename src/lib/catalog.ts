import { createServerFn } from "@tanstack/react-start";
import { fallbackProducts, type Product, type ProductSize } from "../data/products";
import { getServiceSupabase } from "./supabase/client";

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  colorway: string;
  category: string;
  collection: string | null;
  collection_slug: string | null;
  description: string | null;
  price: number | string;
  compare_at_price: number | string | null;
  badge: string | null;
  images: Product["images"];
  default_view: "front" | "back";
  swatches: Product["swatches"] | null;
  story: Product["story"] | null;
  details: Product["details"] | null;
  size_chart: Product["sizeChart"] | null;
  related_slugs: string[] | null;
  is_active: boolean;
  sort_order: number;
  product_sizes?: { label: string; stock: number; sort_order: number }[];
}

export const PRODUCT_SELECT = "*, product_sizes(label, stock, sort_order)";

export function rowToProduct(row: ProductRow, unitsSold = 0): Product {
  const sizes: ProductSize[] = [...(row.product_sizes ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((s) => ({ label: s.label, stock: s.stock, inStock: s.stock > 0 }));

  const product = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    colorway: row.colorway,
    category: row.category as Product["category"],
    collection: row.collection ?? undefined,
    collectionSlug: row.collection_slug ?? undefined,
    description: row.description ?? undefined,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price == null ? undefined : Number(row.compare_at_price),
    badge: (row.badge as Product["badge"]) ?? undefined,
    images: row.images ?? { front: "" },
    defaultView: row.default_view,
    sizes,
    swatches: row.swatches ?? undefined,
    story: row.story ?? undefined,
    details: row.details ?? undefined,
    sizeChart: row.size_chart ?? undefined,
    relatedSlugs: row.related_slugs ?? undefined,
    unitsSold,
  };
  // Drop undefined keys so optional fields stay truly absent
  return Object.fromEntries(
    Object.entries(product).filter(([, value]) => value !== undefined),
  ) as unknown as Product;
}

export interface Catalog {
  products: Product[];
  /** false while the site runs on the built-in launch catalog (no database yet) */
  live: boolean;
}

export const getCatalog = createServerFn({ method: "GET" }).handler(async (): Promise<Catalog> => {
  const supabase = getServiceSupabase();
  if (!supabase) return { products: fallbackProducts, live: false };

  const [{ data, error }, { data: sales }] = await Promise.all([
    supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("product_sales").select("product_id, units_sold"),
  ]);

  if (error) {
    console.error("Catalog load failed", error);
    return { products: fallbackProducts, live: false };
  }

  const sold = new Map((sales ?? []).map((s) => [s.product_id as string, s.units_sold as number]));
  return {
    products: (data as ProductRow[]).map((row) => rowToProduct(row, sold.get(row.id) ?? 0)),
    live: true,
  };
});
