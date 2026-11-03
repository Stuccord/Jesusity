import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Heart, Search, X } from "lucide-react";
import logoImage from "../../assets/logo.png";
import { useProducts } from "../../context/CatalogContext";
import { getNavItems } from "../../config/nav";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
}

export function MobileMenu({ isOpen, onClose, onOpenSearch }: MobileMenuProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const products = useProducts();
  const navItems = getNavItems(products);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleSection = (id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  return (
    <div
      className="mobile-fullscreen-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
    >
      <div className="mobile-menu-header">
        <Link to="/" className="mobile-menu-brand" onClick={onClose}>
          <img src={logoImage} alt="Jesusity" className="mobile-menu-logo" />
        </Link>
        <button
          type="button"
          className="mobile-menu-close"
          onClick={onClose}
          aria-label="Close navigation menu"
        >
          <X size={26} />
        </button>
      </div>

      <nav className="mobile-menu-nav">
        <div className="mobile-menu-links-list">
          {navItems.map((item, index) => {
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const isExpanded = expandedSection === item.id;

            return (
              <div
                key={item.id}
                className="mobile-menu-item"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {hasChildren ? (
                  <>
                    <button
                      type="button"
                      className="mobile-menu-expand-btn"
                      onClick={() => toggleSection(item.id)}
                      aria-expanded={isExpanded}
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        size={20}
                        className={`mobile-chevron ${isExpanded ? "rotated" : ""}`}
                      />
                    </button>
                    {isExpanded && (
                      <div className="mobile-submenu">
                        {item.children?.map((child) => (
                          <Link
                            key={child.href}
                            to={child.href}
                            className="mobile-submenu-link"
                            onClick={onClose}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link to={item.href} className="mobile-menu-main-link" onClick={onClose}>
                    {item.label}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Bottom utility links */}
      <div className="mobile-menu-footer">
        <button
          type="button"
          className="mobile-footer-action"
          onClick={() => {
            onClose();
            onOpenSearch();
          }}
        >
          <Search size={18} />
          <span>SEARCH STORE</span>
        </button>
        <Link to="/wishlist" className="mobile-footer-action" onClick={onClose}>
          <Heart size={18} />
          <span>WISHLIST</span>
        </Link>
      </div>
    </div>
  );
}
