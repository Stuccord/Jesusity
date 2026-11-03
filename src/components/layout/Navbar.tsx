import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Heart, Menu, Search, ShoppingBag } from "lucide-react";
import logoImage from "../../assets/logo.png";
import { useProducts } from "../../context/CatalogContext";
import { getNavItems, type NavItem } from "../../config/nav";
import { useCart } from "../../context/CartContext";

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenMobileMenu: () => void;
}

export function Navbar({ onOpenSearch, onOpenMobileMenu }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const openTimeoutRef = useRef<number | null>(null);

  const products = useProducts();
  const navItems = getNavItems(products);
  const { cartCount, cartBump, openCart } = useCart();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const currentSearchStr = routerState.location.searchStr || "";

  // Sticky header background transition on scroll
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdownId(null);
  }, [currentPath, currentSearchStr]);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenDropdownId(null);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest(".nav-dropdown-wrapper")) {
        setOpenDropdownId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Determine if a top-level nav item is active
  const isItemActive = useCallback(
    (item: NavItem): boolean => {
      // 1. If item has children, it is active if any child URL matches current URL
      if (item.children && item.children.length > 0) {
        return item.children.some((child) => {
          const [childPath, childSearch] = child.href.split("?");
          if (childSearch) {
            return currentPath === childPath && currentSearchStr.includes(childSearch);
          }
          return currentPath === childPath && !currentSearchStr;
        });
      }

      // 2. Query param exact match check (for /shop?sort=newest, /shop?sort=best-selling, /shop?filter=sale)
      if (item.matchQuery) {
        const [targetPath, targetQueryStr] = item.href.split("?");
        if (currentPath !== targetPath) return false;
        return Boolean(targetQueryStr && currentSearchStr.includes(targetQueryStr));
      }

      // 3. For items requiring NO query (e.g. /about)
      if (item.href === "/about") {
        return currentPath === "/about";
      }

      // Plain /shop highlights nothing as specified
      if (item.href === "/shop" && item.requireQueryMatch) {
        return false;
      }

      return currentPath === item.href;
    },
    [currentPath, currentSearchStr],
  );

  // Desktop hover intent: 120ms delay before opening dropdown
  const handleMouseEnter = (itemId: string) => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    openTimeoutRef.current = window.setTimeout(() => {
      setOpenDropdownId(itemId);
    }, 120);
  };

  const handleMouseLeave = () => {
    if (openTimeoutRef.current) {
      window.clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      setOpenDropdownId(null);
    }, 150);
  };

  const toggleDropdown = (itemId: string) => {
    setOpenDropdownId((prev) => (prev === itemId ? null : itemId));
  };

  return (
    <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
      {/* Brand logo: ALWAYS links to "/" */}
      <Link to="/" className="brand" aria-label="Jesusity official home">
        <img src={logoImage} alt="Jesusity" className="brand-logo" />
      </Link>

      {/* Desktop Navigation */}
      <nav className="desktop-nav" aria-label="Main navigation">
        {navItems.map((item) => {
          const hasChildren = Boolean(item.children && item.children.length > 0);
          const active = isItemActive(item);
          const isDropdownOpen = openDropdownId === item.id;

          if (hasChildren) {
            return (
              <div
                key={item.id}
                className="nav-dropdown-wrapper"
                onMouseEnter={() => handleMouseEnter(item.id)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  className={`nav-link nav-dropdown-btn ${active ? "is-active" : ""}`}
                  onClick={() => toggleDropdown(item.id)}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                  aria-current={active ? "page" : undefined}
                >
                  <span>{item.label}</span>
                  <ChevronDown
                    size={14}
                    className={`nav-chevron ${isDropdownOpen ? "open" : ""}`}
                  />
                </button>

                {isDropdownOpen && (
                  <div
                    className="nav-dropdown-panel"
                    role="menu"
                    aria-label={`${item.label} submenu`}
                  >
                    {item.children?.map((child) => {
                      const [childPath, childSearch] = child.href.split("?");
                      const isChildActive = childSearch
                        ? currentPath === childPath && currentSearchStr.includes(childSearch)
                        : currentPath === childPath && !currentSearchStr;

                      return (
                        <Link
                          key={child.href}
                          to={child.href}
                          className={`nav-dropdown-item ${isChildActive ? "is-child-active" : ""}`}
                          role="menuitem"
                          onClick={() => setOpenDropdownId(null)}
                          aria-current={isChildActive ? "page" : undefined}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.id}
              to={item.href}
              className={`nav-link ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Header utility actions */}
      <div className="header-actions">
        {/* Search pill (collapses to an icon on small screens) */}
        <button
          type="button"
          className="icon-button search-button search-pill"
          aria-label="Open search"
          onClick={onOpenSearch}
        >
          <Search size={20} />
          <span className="search-pill-label">Search</span>
        </button>

        {/* Favourites (saved on this device) */}
        <Link to="/wishlist" className="icon-button account-button" aria-label="Wishlist">
          <Heart size={20} />
        </Link>

        {/* Cart button */}
        <button
          type="button"
          className={`icon-button cart-button ${cartBump ? "cart-bump" : ""}`}
          aria-label={`Shopping bag with ${cartCount} items`}
          onClick={openCart}
        >
          <ShoppingBag size={20} />
          <span>{cartCount}</span>
        </button>

        {/* Mobile menu trigger (<1024px) */}
        <button
          type="button"
          className="icon-button menu-button"
          aria-label="Open mobile navigation menu"
          onClick={onOpenMobileMenu}
        >
          <Menu size={22} />
        </button>
      </div>
    </header>
  );
}
