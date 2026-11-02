import { getCategories, getCollections, hasSaleProducts } from "../data/products";

export interface NavItemChild {
  label: string;
  href: string;
  badge?: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  children?: NavItemChild[];
  // If defined, exact query param key/value must match on current location
  matchQuery?: Record<string, string>;
  // If true, will not highlight on plain href if matchQuery is specified
  requireQueryMatch?: boolean;
  visible?: boolean;
}

export function getNavItems(): NavItem[] {
  const categories = getCategories();
  const collections = getCollections();
  const showSale = hasSaleProducts();

  const clothingChildren: NavItemChild[] = [
    ...categories.map((c) => ({
      label: c.name,
      href: `/shop?category=${c.slug}`,
    })),
    {
      label: "Shop All Clothing",
      href: "/shop",
    },
  ];

  const collectionsChildren: NavItemChild[] = [
    ...collections.map((col) => ({
      label: col.name,
      href: `/collections/${col.slug}`,
    })),
    {
      label: "View Lookbook",
      href: "/lookbook",
    },
  ];

  const items: NavItem[] = [
    {
      id: "best-sellers",
      label: "Best Sellers",
      href: "/shop?sort=best-selling",
      matchQuery: { sort: "best-selling" },
      requireQueryMatch: true,
      visible: true,
    },
    {
      id: "tees",
      label: "Tees",
      href: "/shop",
      visible: true,
    },
    {
      id: "collections",
      label: "Collections",
      href: "/collections",
      children: collectionsChildren,
      visible: true,
    },
  ];

  if (showSale) {
    items.push({
      id: "sale",
      label: "Sale",
      href: "/shop?filter=sale",
      matchQuery: { filter: "sale" },
      requireQueryMatch: true,
      visible: true,
    });
  }

  items.push({
    id: "about",
    label: "About Us",
    href: "/about",
    visible: true,
  });

  return items;
}
