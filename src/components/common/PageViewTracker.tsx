import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { trackPageView } from "../../lib/analytics";

function getSessionId(): string {
  const KEY = "jesusity_sid";
  try {
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/** Records one anonymous page view per storefront navigation for the admin dashboard. */
export function PageViewTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/admin") || lastPath.current === pathname) return;
    if (navigator.doNotTrack === "1") return;
    const isFirstView = lastPath.current === null;
    lastPath.current = pathname;
    trackPageView({
      data: {
        sessionId: getSessionId(),
        path: pathname,
        referrer: isFirstView ? document.referrer || undefined : undefined,
      },
    }).catch(() => {});
  }, [pathname]);

  return null;
}
