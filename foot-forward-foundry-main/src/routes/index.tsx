import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Facebook,
  Instagram,
  Menu,
  Package,
  Search,
  ShoppingBag,
  Twitter,
  UserRound,
} from "lucide-react";
import heroImage from "../assets/hero-thorns.jpg";
import {
  CategoryCard,
  NavDropdownLabel,
  ProductCard,
  PromoBanner,
  type Category,
  type Product,
  type Promo,
} from "../components/storefront";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Premium Men's Shoes | [BRAND NAME]" },
      {
        name: "description",
        content:
          "Shop premium men's dress shoes, casual shoes, boots, and loafers from [BRAND NAME].",
      },
      { property: "og:title", content: "Premium Men's Shoes | [BRAND NAME]" },
      {
        property: "og:description",
        content: "Timeless men's footwear built for every step of your journey.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const categories: Category[] = [
  { name: "Dress Shoes", kind: "dress" },
  { name: "Casual Shoes", kind: "casual" },
  { name: "Boots", kind: "boot" },
  { name: "Loafers", kind: "loafer" },
];

const promos: Promo[] = [
  {
    label: "New Arrivals",
    heading: "The Latest\nStyles",
    copy: "Stay ahead with our new collection.",
    kind: "casual",
    tone: "dark",
  },
  {
    label: "Best Sellers",
    heading: "Customer\nFavorites",
    copy: "Handpicked styles loved by our customers.",
    kind: "dress",
    tone: "light",
  },
];

const products: Product[] = [
  { name: "Urban Runner", price: "$89.99", reviews: 128, rating: 5, kind: "casual" },
  { name: "Classic Oxford", price: "$109.99", reviews: 96, rating: 5, kind: "dress" },
  { name: "Street Casuals", price: "$79.99", reviews: 74, rating: 5, kind: "loafer" },
  { name: "Leather Boots", price: "$129.99", reviews: 64, rating: 5, kind: "boot" },
];

const footerGroups = [
  { title: "Shop", links: ["All Shoes", "New Arrivals", "Best Sellers", "Sale"] },
  { title: "Help", links: ["Contact Us", "Track Order", "Returns", "FAQ"] },
  { title: "About", links: ["Our Story", "Careers", "Privacy Policy", "Terms & Conditions"] },
];

function Index() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="storefront">
      <div className="announcement">
        <div>
          <Package size={13} /> Free Shipping on all orders over $[X]
        </div>
        <nav aria-label="Service links">
          <a href="#footer">Help</a>
          <span>|</span>
          <a href="#footer">Track Order</a>
          <span>|</span>
          <a href="#footer">Returns</a>
        </nav>
      </div>

      <header className={scrolled ? "site-header scrolled" : "site-header"}>
        <a className="brand" href="#top" aria-label="[BRAND NAME] home">
          <strong>[BRAND NAME]</strong>
          <span>MEN SHOES</span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#featured">New Arrivals</a>
          <a href="#categories">
            <NavDropdownLabel>Shoes</NavDropdownLabel>
          </a>
          <a href="#categories">
            <NavDropdownLabel>Collections</NavDropdownLabel>
          </a>
          <a href="#featured">Best Sellers</a>
          <a href="#featured">Sale</a>
          <a href="#footer">About Us</a>
        </nav>
        <div className="header-actions">
          <button className="icon-button menu-button" aria-label="Open menu">
            <Menu />
          </button>
          <button className="icon-button" aria-label="Search">
            <Search />
          </button>
          <button className="icon-button account-button" aria-label="Your account">
            <UserRound />
          </button>
          <button className="icon-button cart-button" aria-label="Shopping bag with 0 items">
            <ShoppingBag />
            <span>0</span>
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <p>Step Into Confidence</p>
            <h1>
              Premium Shoes
              <br />
              For Men
            </h1>
            <span>
              Timeless style. Unmatched comfort.
              <br />
              Built for every step of your journey.
            </span>
            <a className="primary-cta" href="#featured">
              Shop Now <ArrowRight size={17} />
            </a>
          </div>
          <div className="hero-art">
            <img
              src={heroImage}
              alt="Man wearing black heavyweight sweatshirt with tonal crown-of-thorns embroidery"
              loading="eager"
            />
          </div>
        </section>

        <section className="category-section" id="categories">
          <div className="section-intro">
            <h2>Shop by Category</h2>
            <p>Explore our wide range of men's shoes.</p>
            <a className="dark-cta" href="#featured">
              View All Collections <ArrowRight size={16} />
            </a>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <CategoryCard key={category.name} category={category} />
            ))}
          </div>
        </section>

        <section className="promo-grid">
          {promos.map((promo) => (
            <PromoBanner key={promo.label} promo={promo} />
          ))}
        </section>

        <section className="featured-section" id="featured">
          <div className="section-header">
            <h2>Featured Products</h2>
            <a href="#featured">
              View All <ArrowRight size={15} />
            </a>
          </div>
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.name} product={product} />
            ))}
          </div>
        </section>

        <section className="newsletter">
          <div>
            <h2>Stay in the Loop</h2>
            <p>
              Subscribe to get special offers, free giveaways,
              <br />
              and once-in-a-lifetime deals.
            </p>
          </div>
          <form onSubmit={(event) => event.preventDefault()}>
            <label className="sr-only" htmlFor="email">
              Email address
            </label>
            <input id="email" type="email" placeholder="Enter your email" required />
            <button type="submit">Subscribe</button>
          </form>
        </section>
      </main>

      <footer id="footer">
        <div className="footer-main">
          <div className="footer-brand">
            <a className="brand" href="#top">
              <strong>[BRAND NAME]</strong>
              <span>MEN SHOES</span>
            </a>
            <p>Footwear made for modern men.</p>
          </div>
          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h3>{group.title}</h3>
              {group.links.map((link) => (
                <a key={link} href="#top">
                  {link}
                </a>
              ))}
            </nav>
          ))}
          <div className="social">
            <h3>Follow Us</h3>
            <div>
              <a href="#footer" aria-label="Facebook">
                <Facebook />
              </a>
              <a href="#footer" aria-label="Instagram">
                <Instagram />
              </a>
              <a href="#footer" aria-label="X">
                <Twitter />
              </a>
              <a href="#footer" aria-label="Pinterest">
                <span className="pinterest">P</span>
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <small>© 2026 [BRAND NAME]. All Rights Reserved.</small>
          <div className="payments">
            <span>VISA</span>
            <span>mastercard</span>
            <span>PayPal</span>
            <span> Pay</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
