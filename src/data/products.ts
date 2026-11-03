const teeValuableFishFront = "/products/tee-valuable-fish-front.png";
const teeValuableFishBack = "/products/tee-valuable-fish-back.png";
const supernaturalBlackFrontTransparent = "/products/supernatural-black-front-transparent.png";
const supernaturalBlackBackTransparent = "/products/supernatural-black-back-transparent.png";
const supernaturalLogoWhiteFrontTransparent = "/products/supernatural-logo-white-front-transparent.png";
const supernaturalLogoBlackFrontTransparent = "/products/supernatural-logo-black-front-transparent.png";
const thornyCrownBlackWhite = "/products/thorny-crown-black-white.jpg";
const thornyCrownWhiteBold = "/products/thorny-crown-white-bold.jpg";
const thornyCrownBlackTonal = "/products/thorny-crown-black-tonal.jpg";
const thornyCrownWhiteTonal = "/products/thorny-crown-white-tonal.jpg";

export interface ProductSize {
  label: string;
  inStock: boolean;
  /** Units on hand, when the catalog comes from the database */
  stock?: number;
}

export interface ProductSwatch {
  color: string;
  colorway: string;
  hex: string;
  slug?: string;
  active?: boolean;
}

export interface ProductStory {
  scripture?: string;
  title: string;
  body: string;
}

export interface ProductDetails {
  description?: string;
  fit?: string;
  fabric?: string;
  care?: string[];
}

export interface ProductSizeMeasurement {
  size: string;
  chest: number; // in cm
  length: number; // in cm
  shoulder?: number; // in cm
  sleeve?: number; // in cm
}

export interface ProductImages {
  front: string;
  back?: string;
  gallery?: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  colorway: string;
  price: number;
  compareAtPrice?: number;
  badge?: "NEW" | "ESSENTIAL" | "TRENDING" | "LIMITED" | "SOLD OUT" | "BEST SELLER";
  category: "Tees" | "Hoodies" | "Jackets" | "Bottoms" | "Accessories";
  collection?: string;
  collectionSlug?: string;
  description?: string;
  images: ProductImages;
  defaultView: "front" | "back";
  sizes: ProductSize[];
  swatches?: ProductSwatch[];
  /** Units sold in paid orders, used for the "best selling" sort */
  unitsSold?: number;
  story?: ProductStory;
  details?: ProductDetails;
  sizeChart?: ProductSizeMeasurement[];
  relatedSlugs?: string[];
}

export const formatGHS = (amount: number): string => {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Standard Tee Size Chart in cm
const standardTeeSizeChart: ProductSizeMeasurement[] = [
  { size: "S", chest: 106, length: 71, shoulder: 51, sleeve: 22 },
  { size: "M", chest: 114, length: 74, shoulder: 53, sleeve: 23 },
  { size: "L", chest: 122, length: 76, shoulder: 56, sleeve: 24 },
  { size: "XL", chest: 130, length: 79, shoulder: 58, sleeve: 25 },
  { size: "XXL", chest: 138, length: 81, shoulder: 61, sleeve: 26 },
];

// Standard Hoodie Size Chart in cm
const standardHoodieSizeChart: ProductSizeMeasurement[] = [
  { size: "S", chest: 116, length: 68, shoulder: 56, sleeve: 62 },
  { size: "M", chest: 122, length: 71, shoulder: 58, sleeve: 64 },
  { size: "L", chest: 128, length: 74, shoulder: 61, sleeve: 66 },
  { size: "XL", chest: 134, length: 76, shoulder: 63, sleeve: 67 },
  { size: "XXL", chest: 140, length: 79, shoulder: 66, sleeve: 68 },
];

// Standard Jacket Size Chart in cm
const standardJacketSizeChart: ProductSizeMeasurement[] = [
  { size: "S", chest: 118, length: 72, shoulder: 50, sleeve: 64 },
  { size: "M", chest: 124, length: 74, shoulder: 52, sleeve: 65 },
  { size: "L", chest: 130, length: 76, shoulder: 54, sleeve: 66 },
  { size: "XL", chest: 136, length: 78, shoulder: 56, sleeve: 67 },
  { size: "XXL", chest: 142, length: 80, shoulder: 58, sleeve: 68 },
];

// Launch catalog. Seeds the database (supabase/seed.sql) and is what the site
// shows until Supabase is connected. Once connected, the database is the source
// of truth and admins manage products from /admin.
export const fallbackProducts: Product[] = [
  {
    id: "valuable-fish-vintage-black",
    slug: "valuable-fish-tee-vintage-black",
    name: "The Most Valuable Fish Tee",
    colorway: "Vintage Black",
    category: "Tees",
    collection: "The Most Valuable Fish",
    collectionSlug: "the-most-valuable-fish",
    description:
      "High-definition iridescent graphic artwork on 280 GSM heavyweight combed cotton. Matthew 17:27.",
    price: 200,
    compareAtPrice: 250,
    badge: "TRENDING",
    images: {
      front: supernaturalBlackFrontTransparent,
      back: supernaturalBlackBackTransparent,
      gallery: [teeValuableFishFront, teeValuableFishBack],
    },
    defaultView: "back",
    sizes: [
      { label: "S", inStock: true },
      { label: "M", inStock: true },
      { label: "L", inStock: true },
      { label: "XL", inStock: true },
      { label: "XXL", inStock: false },
    ],
    swatches: [
      { color: "Vintage Black", colorway: "Vintage Black", hex: "#181818", active: true },
      {
        color: "Crisp White",
        colorway: "Crisp White",
        hex: "#F2F2F2",
        slug: "valuable-fish-tee-crisp-white",
        active: false,
      },
    ],
    // TODO: replace with real copy
    story: {
      scripture: "MATTHEW 17:27",
      title: "THE CURRENCY OF FAITH",
      body: "Go to the sea and cast a hook, and take the first fish that comes up, and when you open its mouth you will find a shekel. Designed in Accra, The Most Valuable Fish is a meditation on unseen provision and divine sovereignty, captured through vivid iridescent screen printing on brutalist heavyweight jersey.",
    },
    // TODO: replace with real copy
    details: {
      description:
        "Engineered with a boxy, dropped-shoulder silhouette cut from 280 GSM combed organic cotton. Features high-density chromatic screen-print on front chest and back body, reinforced 3cm rib collar, and twin-needle hems.",
      fit: "Relaxed boxy cut with dropped shoulders. True to size for intentional streetwear drape. Size down for regular silhouette.",
      fabric:
        "100% Combed Heavy Cotton (280 GSM). Pre-shrunk and garment-washed for vintage softness.",
      care: [
        "Machine wash cold inside out with similar dark tones",
        "Do not bleach or tumble dry",
        "Iron inside out on low heat; avoid direct contact with graphic artwork",
        "Dry flat in shade to preserve garment weight and drape",
      ],
    },
    sizeChart: standardTeeSizeChart,
    relatedSlugs: [
      "valuable-fish-tee-crisp-white",
      "thorny-crown-heavyweight-tee-noir",
      "signature-logo-tee-washed-black",
      "thorny-crown-heavyweight-tee-blanco",
    ],
  },
  {
    id: "valuable-fish-crisp-white",
    slug: "valuable-fish-tee-crisp-white",
    name: "The Most Valuable Fish Tee",
    colorway: "Crisp White",
    category: "Tees",
    collection: "The Most Valuable Fish",
    collectionSlug: "the-most-valuable-fish",
    description: "Heavy luxury combed cotton drape with vivid chromatic graphics front and back.",
    price: 200,
    badge: "BEST SELLER",
    images: {
      front: teeValuableFishFront,
      back: teeValuableFishBack,
      gallery: [supernaturalLogoWhiteFrontTransparent],
    },
    defaultView: "back",
    sizes: [
      { label: "S", inStock: true },
      { label: "M", inStock: true },
      { label: "L", inStock: true },
      { label: "XL", inStock: false },
      { label: "XXL", inStock: true },
    ],
    swatches: [
      { color: "Crisp White", colorway: "Crisp White", hex: "#F2F2F2", active: true },
      {
        color: "Vintage Black",
        colorway: "Vintage Black",
        hex: "#181818",
        slug: "valuable-fish-tee-vintage-black",
        active: false,
      },
    ],
    // TODO: replace with real copy
    story: {
      scripture: "MATTHEW 17:27",
      title: "IRIDESCENT PROVIDENCE",
      body: "Rendered in optic white with contrast oceanic gradients. The Valuable Fish Tee speaks of miraculous timing and trusting what lies beneath the surface. Each garment undergoes strict hand-inspection in our Accra studio before numbered release.",
    },
    // TODO: replace with real copy
    details: {
      description:
        "High-density multi-color silkscreen artwork on compact combed luxury cotton. Features custom woven brand labeling at internal neckline and tonal neck binding.",
      fit: "Relaxed streetwear boxy silhouette with generous sleeve drape.",
      fabric: "100% Luxury Combed Cotton (280 GSM).",
      care: [
        "Cold wash gentle cycle",
        "Wash with like colors",
        "Hang dry immediately after washing",
        "Do not iron print",
      ],
    },
    sizeChart: standardTeeSizeChart,
    relatedSlugs: [
      "valuable-fish-tee-vintage-black",
      "thorny-crown-heavyweight-tee-blanco",
      "signature-logo-tee-white",
      "signature-logo-tee-washed-black",
    ],
  },
  {
    id: "signature-logo-washed-black",
    slug: "signature-logo-tee-washed-black",
    name: "Signature Logo Tee",
    colorway: "Washed Black",
    category: "Tees",
    collection: "Core Essentials",
    collectionSlug: "core-essentials",
    description:
      "Garment-dyed vintage black finish with subtle monochrome tonal chest embroidery detailing.",
    price: 200,
    badge: "ESSENTIAL",
    images: {
      front: supernaturalLogoBlackFrontTransparent,
      back: supernaturalBlackBackTransparent,
    },
    defaultView: "front",
    sizes: [
      { label: "S", inStock: true },
      { label: "M", inStock: true },
      { label: "L", inStock: true },
      { label: "XL", inStock: true },
      { label: "XXL", inStock: true },
    ],
    swatches: [
      { color: "Washed Black", colorway: "Washed Black", hex: "#1c1c1c", active: true },
      {
        color: "Optic White",
        colorway: "Optic White",
        hex: "#EAEAEA",
        slug: "signature-logo-tee-white",
        active: false,
      },
    ],
    // TODO: replace with real copy
    details: {
      description:
        "Everyday foundational luxury tee featuring precision micro-embroidery of the Supernatural wordmark at the sternum. Enzyme-washed for an authentic lived-in touch.",
      fit: "Standard boxy streetwear fit. Clean shoulder lines.",
      fabric: "100% Combed Cotton (240 GSM).",
      care: [
        "Machine wash 30°C",
        "Wash with dark shades",
        "Do not tumble dry",
        "Warm iron if necessary",
      ],
    },
    sizeChart: standardTeeSizeChart,
    relatedSlugs: [
      "signature-logo-tee-white",
      "thorny-crown-heavyweight-tee-noir",
      "valuable-fish-tee-vintage-black",
      "thorny-crown-heavyweight-tee-blanco",
    ],
  },
  {
    id: "signature-logo-white",
    slug: "signature-logo-tee-white",
    name: "Signature Logo Tee",
    colorway: "Optic White",
    category: "Tees",
    collection: "Core Essentials",
    collectionSlug: "core-essentials",
    description:
      "Minimalist high-density chest embroidery on ultra-soft compact combed luxury cotton.",
    price: 200,
    badge: "BEST SELLER",
    images: {
      front: supernaturalLogoWhiteFrontTransparent,
      back: teeValuableFishBack,
    },
    defaultView: "front",
    sizes: [
      { label: "S", inStock: false },
      { label: "M", inStock: true },
      { label: "L", inStock: true },
      { label: "XL", inStock: true },
      { label: "XXL", inStock: false },
    ],
    swatches: [
      { color: "Optic White", colorway: "Optic White", hex: "#EAEAEA", active: true },
      {
        color: "Washed Black",
        colorway: "Washed Black",
        hex: "#1c1c1c",
        slug: "signature-logo-tee-washed-black",
        active: false,
      },
    ],
    // TODO: replace with real copy
    details: {
      description:
        "The bright optical counterpart to our core signature piece. High-density black micro-thread stitching on bright white luxury jersey.",
      fit: "Boxy structured cut, ribbed neckband.",
      fabric: "100% Premium Cotton (240 GSM).",
      care: ["Machine wash cold with whites only", "Line dry in shade", "Iron inside out"],
    },
    sizeChart: standardTeeSizeChart,
    relatedSlugs: [
      "signature-logo-tee-washed-black",
      "valuable-fish-tee-crisp-white",
      "thorny-crown-heavyweight-tee-blanco",
      "valuable-fish-tee-vintage-black",
    ],
  },
  {
    id: "thorny-crown-noir",
    slug: "thorny-crown-heavyweight-tee-noir",
    name: "Thorny Crown Heavyweight Tee",
    colorway: "Noir / White",
    category: "Tees",
    collection: "Thorny Crown",
    collectionSlug: "thorny-crown",
    description:
      "Architectural crown of thorns artwork engineered across front and back on luxury heavyweight cotton.",
    price: 200,
    compareAtPrice: 250,
    badge: "LIMITED",
    images: {
      front: thornyCrownBlackWhite,
      back: thornyCrownBlackTonal,
      gallery: [thornyCrownWhiteBold, thornyCrownWhiteTonal],
    },
    defaultView: "front",
    sizes: [
      { label: "S", inStock: true },
      { label: "M", inStock: true },
      { label: "L", inStock: false },
      { label: "XL", inStock: true },
      { label: "XXL", inStock: true },
    ],
    swatches: [
      { color: "Noir / White", colorway: "Noir / White", hex: "#111111", active: true },
      {
        color: "Blanco / Bold",
        colorway: "Blanco / Bold",
        hex: "#F4F4F4",
        slug: "thorny-crown-heavyweight-tee-blanco",
        active: false,
      },
    ],
    // TODO: replace with real copy
    story: {
      scripture: "JOHN 19:2",
      title: "BEAUTY FROM SUFFERING",
      body: "And the soldiers twisted together a crown of thorns and put it on his head. Thorny Crown recontextualizes the historic symbol of torment into an emblem of unmatched majesty and perseverance. Heavyweight construction designed to outlast trend cycles.",
    },
    // TODO: replace with real copy
    details: {
      description:
        "High-definition distressed crown motif spanning the chest, paired with brutalist typography on the reverse collar. Heavyweight 280 GSM cotton ensures zero cling and dramatic drape.",
      fit: "Oversized silhouette with extended body and dropped shoulder seams.",
      fabric: "100% Combed Cotton (280 GSM).",
      care: ["Cold wash separately", "Do not tumble dry", "Do not wring", "Reshape while damp"],
    },
    sizeChart: standardTeeSizeChart,
    relatedSlugs: [
      "thorny-crown-heavyweight-tee-blanco",
      "valuable-fish-tee-vintage-black",
      "signature-logo-tee-washed-black",
      "signature-logo-tee-white",
    ],
  },
  {
    id: "thorny-crown-blanco",
    slug: "thorny-crown-heavyweight-tee-blanco",
    name: "Thorny Crown Heavyweight Tee",
    colorway: "Blanco / Bold",
    category: "Tees",
    collection: "Thorny Crown",
    collectionSlug: "thorny-crown",
    description:
      "Crisp white luxury jersey with high-impact thorny crown graphic print. Limited initial release.",
    price: 200,
    badge: "BEST SELLER",
    images: {
      front: thornyCrownWhiteBold,
      back: thornyCrownWhiteTonal,
      gallery: [thornyCrownBlackWhite],
    },
    defaultView: "front",
    sizes: [
      { label: "S", inStock: true },
      { label: "M", inStock: true },
      { label: "L", inStock: true },
      { label: "XL", inStock: true },
      { label: "XXL", inStock: false },
    ],
    swatches: [
      { color: "Blanco / Bold", colorway: "Blanco / Bold", hex: "#F4F4F4", active: true },
      {
        color: "Noir / White",
        colorway: "Noir / White",
        hex: "#111111",
        slug: "thorny-crown-heavyweight-tee-noir",
        active: false,
      },
    ],
    // TODO: replace with real copy
    story: {
      scripture: "JOHN 19:2",
      title: "THE CROWN OF TRIUMPH",
      body: "The white edition of the Thorny Crown tee mirrors purity through redemption. Crisp contrast printing executed with water-based eco-certified pigments on 280 GSM luxury jersey.",
    },
    // TODO: replace with real copy
    details: {
      description:
        "High-contrast black graphic print on pure white combed cotton. Features seamless neck collar and reinforced shoulder tapes.",
      fit: "Oversized boxy cut.",
      fabric: "100% Combed Cotton (280 GSM).",
      care: ["Machine wash cold with whites", "Dry flat", "Iron inside out"],
    },
    sizeChart: standardTeeSizeChart,
    relatedSlugs: [
      "thorny-crown-heavyweight-tee-noir",
      "valuable-fish-tee-crisp-white",
      "signature-logo-tee-white",
      "valuable-fish-tee-vintage-black",
    ],
  },
];


export interface CollectionInfo {
  name: string;
  slug: string;
  description: string;
  count: number;
}

export const getCategories = (
  products: Product[],
): { name: string; slug: string; count: number }[] => {
  const counts = new Map<string, number>();
  products.forEach((p) => {
    if (p.category) {
      counts.set(p.category, (counts.get(p.category) || 0) + 1);
    }
  });
  return Array.from(counts.entries()).map(([name, count]) => ({
    name,
    slug: name.toLowerCase(),
    count,
  }));
};

export const getCollections = (products: Product[]): CollectionInfo[] => {
  const map = new Map<string, { name: string; count: number; desc: string }>();
  products.forEach((p) => {
    if (p.collection && p.collectionSlug) {
      const existing = map.get(p.collectionSlug);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(p.collectionSlug, {
          name: p.collection,
          count: 1,
          desc: p.description || "Limited seasonal apparel capsule.",
        });
      }
    }
  });
  return Array.from(map.entries()).map(([slug, data]) => ({
    slug,
    name: data.name,
    count: data.count,
    description: data.desc,
  }));
};

export const hasSaleProducts = (products: Product[]): boolean => {
  return products.some((p) => Boolean(p.compareAtPrice && p.compareAtPrice > p.price));
};

export const getProductBySlug = (products: Product[], slug: string): Product | undefined => {
  return products.find((p) => p.slug === slug || p.id === slug);
};

export const getProductsByCollection = (products: Product[], collectionSlug: string): Product[] => {
  return products.filter((p) => p.collectionSlug === collectionSlug);
};

export const getProductImages = (product: Product): string[] => {
  const set = new Set<string>();
  const isBackDefault = product.defaultView === "back";
  const primary = isBackDefault ? product.images.back : product.images.front;
  const secondary = isBackDefault ? product.images.front : product.images.back;

  if (primary) set.add(primary);
  if (secondary) set.add(secondary);
  if (product.images.gallery) {
    product.images.gallery.forEach((img) => {
      if (img) set.add(img);
    });
  }
  return Array.from(set);
};

export const getRelatedProducts = (products: Product[], product: Product, limit = 4): Product[] => {
  if (product.relatedSlugs && product.relatedSlugs.length > 0) {
    const matched = product.relatedSlugs
      .map((slug) => getProductBySlug(products, slug))
      .filter((p): p is Product => Boolean(p && p.id !== product.id));
    if (matched.length >= limit) return matched.slice(0, limit);
    // Fill remaining with other products
    const remaining = products.filter(
      (p) => p.id !== product.id && !matched.some((m) => m.id === p.id),
    );
    return [...matched, ...remaining].slice(0, limit);
  }
  return products.filter((p) => p.id !== product.id).slice(0, limit);
};

export const searchProducts = (products: Product[], query: string): Product[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.colorway.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      Boolean(p.collection && p.collection.toLowerCase().includes(q)) ||
      Boolean(p.description && p.description.toLowerCase().includes(q)),
  );
};
