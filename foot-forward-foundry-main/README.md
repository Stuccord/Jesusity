# Footwear Frontstage

Build a full e-commerce homepage for a men's footwear brand called "[BRAND NAME]".

=== GLOBAL STYLE ===

- Monochrome palette: black, white, and grays as the base — accent color optional, keep minimal

- Bold condensed sans-serif for headings (uppercase), clean sans-serif for body text

- Generous whitespace, sharp edges (no heavy rounding except buttons), high-contrast product photography on white or black backgrounds

- Fully responsive: stacks to single column on mobile, category grid becomes horizontal scroll

=== 1. ANNOUNCEMENT BAR ===

- Thin black bar, full width

- Left: shipping icon + "Free Shipping on all orders over $[X]"

- Right: text links "Help | Track Order | Returns"

=== 2. HEADER ===

- White background, border-bottom

- Left: logo (brand name bold + small tagline underneath, e.g. "MEN SHOES")

- Center: nav links — New Arrivals, Shoes (dropdown), Collections (dropdown), Best Sellers, Sale, About Us

- Right: search icon, account icon, cart icon with item-count badge

- Sticky on scroll

=== 3. HERO SECTION ===

- Full-width, black background, ~450px height

- Left half: small eyebrow text ("Step Into Confidence"), large bold headline (2 lines, white), 2-line supporting copy (gray), white pill/rect button "Shop Now" with arrow icon

- Right half: large product cutout image bleeding off the edge, no background, dramatic lighting/shadow

- Placeholder image slot: single hero product shot, transparent or dark background

=== 4. TRUST BADGES ROW ===

- White background, thin border top/bottom

- 4 columns, each: icon (outline style) + bold label + small gray subtext

  1. Truck icon — "Free Shipping" / "On all orders over $[X]"

  2. Return icon — "Easy Returns" / "[X] days return policy"

  3. Shield icon — "Secure Payment" / "100% secure checkout"

  4. Badge icon — "Premium Quality" / "Quality you can trust"

=== 5. SHOP BY CATEGORY ===

- Left column (~20% width): section heading "Shop by Category", 1-line description, black button "View All Collections" with arrow

- Right: 4-column grid of category cards — each a light-gray rounded card with centered product image, category name (bold, uppercase) + "Shop Now" link with arrow underneath

- Placeholder categories: Dress Shoes, Casual Shoes, Boots, Loafers — make these props/data-driven so they're easy to relabel

=== 6. SPLIT PROMO BANNER ===

- Two-column full-width banner, ~350px height

- Left panel: black background, product image bottom-bleeding, top-left small label ("New Arrivals"), bold heading (2 lines, white), short copy, "Shop Now" link with arrow

- Right panel: light-gray background, mirrored layout ("Best Sellers" label, "Customer Favorites" heading), product image right side

- Both panels should be swappable via props (label/heading/copy/image per side)

=== 7. FEATURED PRODUCTS GRID ===

- Section header row: "Featured Products" bold left, "View All" link with arrow right

- 4-column product card grid (2-col mobile)

- Each card: white bg, product image, wishlist heart icon top-right corner, product name, price (bold), star rating + review count in parentheses

- Build as a reusable ProductCard component fed by an array — so dropping in real products later is a data swap, not a rebuild

=== 8. NEWSLETTER BAR ===

- Full-width black section

- Left: bold heading "Stay in the Loop" + short gray subtext

- Right: email input field (white, rounded) + black "Subscribe" button inline

=== 9. FOOTER ===

- Black background, 4-column layout

- Col 1: logo + tagline, copyright line at bottom

- Col 2: "Shop" links (All Shoes, New Arrivals, Best Sellers, Sale)

- Col 3: "Help" links (Contact Us, Track Order, Returns, FAQ)

- Col 4: "About" links (Our Story, Careers, Privacy Policy, Terms & Conditions)

- Col 5: "Follow Us" heading + social icon row (Facebook, Instagram, Twitter/X, Pinterest)

- Bottom strip: payment method icons (Visa, Mastercard, PayPal, Apple Pay) right-aligned

=== TECHNICAL NOTES ===

- Build ProductCard, CategoryCard, and PromoBanner as reusable components with props/data arrays — not hardcoded — so real product data can be dropped in later without touching layout code

- Use placeholder gray boxes with a shoe silhouette icon for all product images until real photography is supplied

- Keep spacing/grid system consistent (8px baseline) so it scales cleanly once real content replaces placeholders

Match the attached reference image exactly for layout, spacing, and visual hierarchy.

Use placeholder shoe-silhouette icons for all product images — I will replace these

with real product photos and data afterward.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/466f1966-9517-41b0-89b7-787502644d94).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
