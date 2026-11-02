import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

// Blocks that fade/slide in as they enter the viewport. Sections that already run
// their own entrance (e.g. the featured rail) and the footer are left out.
const REVEAL_SELECTORS = [
  "main section:not(.hero-section):not(.featured-collection-section)",
  ".catalog-product-card",
  ".page-header",
].join(", ");

export function ScrollReveal() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    // Wait a frame so the new route's DOM is in place.
    const frame = requestAnimationFrame(() => {
      const els = document.querySelectorAll<HTMLElement>(REVEAL_SELECTORS);
      els.forEach((el) => {
        if (el.classList.contains("reveal")) return;
        // Siblings in a grid get a small cascade.
        const index = el.parentElement ? Array.from(el.parentElement.children).indexOf(el) : 0;
        el.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 70}ms`);
        el.classList.add("reveal");
        observer.observe(el);
      });
    });

    // Safety net: once the reader reaches the bottom, show anything still hidden.
    const revealRest = () => {
      if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 40) return;
      document.querySelectorAll(".reveal:not(.is-revealed)").forEach((el) => {
        el.classList.add("is-revealed");
      });
    };
    window.addEventListener("scroll", revealRest, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", revealRest);
    };
  }, [pathname]);

  return null;
}
