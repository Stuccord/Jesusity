import { useState, useEffect, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AnnouncementBar } from "./AnnouncementBar";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { SearchOverlay } from "./SearchOverlay";
import { MobileMenu } from "./MobileMenu";
import { ScrollProgressBar } from "../common/ScrollProgressBar";
import { ScrollReveal } from "../common/ScrollReveal";

interface SiteLayoutProps {
  children: ReactNode;
}

export function SiteLayout({ children }: SiteLayoutProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  // Scroll to top and close drawers on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <div className="storefront-root site-container min-h-screen flex flex-col bg-black text-white">
      {/* Reading progress line pinned to the top of the viewport */}
      <ScrollProgressBar />
      <ScrollReveal />

      {/* Top announcement bar */}
      <AnnouncementBar />

      {/* Sticky navigation bar */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* Main page content */}
      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* Footer on every page */}
      <Footer />

      {/* Slide-in cart drawer */}
      <CartDrawer />

      {/* Full-width search overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Full-screen mobile menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />
    </div>
  );
}
