import { createContext, useContext, type ReactNode } from "react";
import type { Catalog } from "../lib/catalog";
import { fallbackProducts, type Product } from "../data/products";

const CatalogContext = createContext<Catalog>({ products: fallbackProducts, live: false });

export function CatalogProvider({ catalog, children }: { catalog: Catalog; children: ReactNode }) {
  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Catalog {
  return useContext(CatalogContext);
}

export function useProducts(): Product[] {
  return useContext(CatalogContext).products;
}
