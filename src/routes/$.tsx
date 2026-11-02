import { createFileRoute } from "@tanstack/react-router";
import { BrandedNotFound } from "../components/common/BrandedNotFound";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "Page Not Found | Jesusity" },
      { name: "description", content: "The requested page does not exist." },
    ],
  }),
  component: SplatNotFoundPage,
});

function SplatNotFoundPage() {
  return <BrandedNotFound />;
}
