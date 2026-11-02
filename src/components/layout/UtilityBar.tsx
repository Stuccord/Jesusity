import { Link } from "@tanstack/react-router";

// Thin top strip with secondary links (desktop only), modelled on big-retail headers.
export function UtilityBar() {
  return (
    <div className="utility-bar">
      <nav className="utility-links" aria-label="Help and account">
        <Link to="/track">Track Order</Link>
        <span aria-hidden="true">|</span>
        <Link to="/faq">Help</Link>
        <span aria-hidden="true">|</span>
        <Link to="/contact">Contact</Link>
        <span aria-hidden="true">|</span>
        <Link to="/account">Sign In</Link>
      </nav>
    </div>
  );
}
