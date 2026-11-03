import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Facebook, Instagram, Twitter } from "lucide-react";
import logoImage from "../../assets/logo.png";
import { STORE } from "../../config/store";
import { subscribe } from "../../lib/inbound";

const SOCIAL_LINKS = [
  { key: "instagram", label: "Instagram", Icon: Instagram },
  { key: "x", label: "X", Icon: Twitter },
  { key: "facebook", label: "Facebook", Icon: Facebook },
] as const;

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribeError(null);
    try {
      const result = await subscribe({ data: { email, source: "newsletter" } });
      if (result.ok) {
        setSubscribed(true);
        setEmail("");
      } else {
        setSubscribeError(result.error);
      }
    } catch {
      setSubscribeError("Please enter a valid email address.");
    }
  };

  return (
    <footer id="footer" className="site-footer">
      <div className="footer-main">
        {/* Brand column */}
        <div className="footer-brand">
          <Link to="/" className="brand" aria-label="Jesusity homepage">
            <img src={logoImage} alt="Jesusity" className="brand-logo footer-brand-logo" />
          </Link>
          <p className="footer-brand-tagline">
            Heavyweight streetwear and timeless silhouettes engineered for the endless pursuit.
          </p>
          <div className="footer-payment-text">
            <span>MoMo</span>
            <span className="dot">•</span>
            <span>Visa</span>
            <span className="dot">•</span>
            <span>Mastercard</span>
          </div>
        </div>

        {/* SHOP Column */}
        <nav className="footer-nav-col" aria-label="Shop Navigation">
          <h3 className="footer-col-title">Shop</h3>
          <ul className="footer-links-list">
            <li>
              <Link to="/shop" search={{ sort: "best-selling" }}>
                Best Sellers
              </Link>
            </li>
            <li>
              <Link to="/shop">Graphic Tees</Link>
            </li>
            <li>
              <Link to="/collections/$slug" params={{ slug: "core-essentials" }}>
                Core Essentials
              </Link>
            </li>
          </ul>
        </nav>

        {/* HELP Column */}
        <nav className="footer-nav-col" aria-label="Help & Customer Service">
          <h3 className="footer-col-title">Help</h3>
          <ul className="footer-links-list">
            <li>
              <Link to="/faq">FAQ</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
            <li>
              <Link to="/track">Track Order</Link>
            </li>
            <li>
              <Link to="/policies/$slug" params={{ slug: "shipping" }}>
                Shipping
              </Link>
            </li>
            <li>
              <Link to="/policies/$slug" params={{ slug: "returns" }}>
                Returns
              </Link>
            </li>
          </ul>
        </nav>

        {/* BRAND Column */}
        <nav className="footer-nav-col" aria-label="Brand & Community">
          <h3 className="footer-col-title">Brand</h3>
          <ul className="footer-links-list">
            <li>
              <Link to="/about">About Us</Link>
            </li>
            <li>
              <Link to="/lookbook">Lookbook</Link>
            </li>
            <li>
              <Link to="/policies/$slug" params={{ slug: "privacy" }}>
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/policies/$slug" params={{ slug: "terms" }}>
                Terms & Conditions
              </Link>
            </li>
          </ul>
        </nav>

        {/* Newsletter & Socials */}
        <div className="footer-newsletter-col">
          <h3 className="footer-col-title">Stay Connected</h3>
          <p className="footer-newsletter-copy">
            Receive exclusive early release notifications and archival restocks.
          </p>
          <form className="footer-newsletter-form" onSubmit={handleSubscribe}>
            <label htmlFor="footer-newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-newsletter-email"
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="footer-email-input"
            />
            <button
              type="submit"
              className="footer-submit-btn"
              aria-label="Subscribe to newsletter"
            >
              {subscribed ? <Check size={16} /> : <ArrowRight size={16} />}
            </button>
          </form>

          {subscribeError && <p className="footer-newsletter-error">{subscribeError}</p>}
          {subscribed && <p className="footer-newsletter-copy">You're subscribed. Thank you!</p>}

          {/* Social Icons (only accounts set in src/config/store.ts) */}
          {SOCIAL_LINKS.some(({ key }) => STORE.social[key]) && (
            <div className="footer-social-row">
              {SOCIAL_LINKS.filter(({ key }) => STORE.social[key]).map(({ key, label, Icon }) => (
                <a
                  key={key}
                  href={STORE.social[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Jesusity on ${label}`}
                  className="footer-social-link"
                >
                  <Icon size={17} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Copyright Row */}
      <div className="footer-bottom">
        <small className="footer-copyright">© {new Date().getFullYear()} Jesusity. All Rights Reserved.</small>
        <div className="footer-legal-links">
          <Link to="/policies/$slug" params={{ slug: "privacy" }}>
            Privacy
          </Link>
          <span className="dot">•</span>
          <Link to="/policies/$slug" params={{ slug: "terms" }}>
            Terms
          </Link>
          <span className="dot">•</span>
          <Link to="/policies/$slug" params={{ slug: "shipping" }}>
            Shipping & Returns
          </Link>
        </div>
      </div>
    </footer>
  );
}
