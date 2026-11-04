import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useMatch,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

import { CartProvider } from "../context/CartContext";
import { CatalogProvider } from "../context/CatalogContext";
import { getCatalog, type Catalog } from "../lib/catalog";
import { fallbackProducts } from "../data/products";
import { PageViewTracker } from "../components/common/PageViewTracker";
import { AuthLinkRedirect } from "../components/common/AuthLinkRedirect";
import { SiteLayout } from "../components/layout/SiteLayout";
import { BrandedNotFound } from "../components/common/BrandedNotFound";

const EMPTY_CATALOG: Catalog = { products: fallbackProducts, live: false };

function NotFoundComponent() {
  const rootMatch = useMatch({ from: "__root__", shouldThrow: false });
  const catalog = (rootMatch?.loaderData as Catalog | undefined) ?? EMPTY_CATALOG;
  return (
    <CatalogProvider catalog={catalog}>
      <CartProvider>
        <SiteLayout>
          <BrandedNotFound />
        </SiteLayout>
      </CartProvider>
    </CatalogProvider>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Jesusity | Official Store" },
      {
        name: "description",
        content:
          "Exclusive streetwear drops, graphic tees, and luxury heavyweight essentials from Jesusity.",
      },
      { name: "author", content: "Jesusity" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  // The storefront catalog (products, prices, stock) loads once and refreshes every minute
  loader: () => getCatalog(),
  staleTime: 60_000,
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const catalog = Route.useLoaderData();
  const isAdmin = useRouterState({ select: (s) => s.location.pathname.startsWith("/admin") });

  return (
    <QueryClientProvider client={queryClient}>
      <CatalogProvider catalog={catalog}>
        <CartProvider>
          <PageViewTracker />
          <AuthLinkRedirect />
          {isAdmin ? (
            <Outlet />
          ) : (
            <SiteLayout>
              {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
              <Outlet />
            </SiteLayout>
          )}
        </CartProvider>
      </CatalogProvider>
    </QueryClientProvider>
  );
}
