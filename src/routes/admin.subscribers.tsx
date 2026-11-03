import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Trash2 } from "lucide-react";
import { useAdmin } from "../components/admin/AdminContext";
import { Empty, ErrorNote, PageTitle } from "../components/admin/AdminUi";
import { Button } from "../components/ui/button";
import { downloadCsv, formatDateTime } from "../lib/admin";

export const Route = createFileRoute("/admin/subscribers")({
  component: AdminSubscribers,
});

interface Subscriber {
  id: number;
  email: string;
  source: "newsletter" | "restock";
  product_id: string | null;
  size: string | null;
  created_at: string;
  products: { name: string; colorway: string } | null;
}

function AdminSubscribers() {
  const { supabase } = useAdmin();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"newsletter" | "restock">("newsletter");

  const subscribers = useQuery({
    queryKey: ["admin-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscribers")
        .select("*, products(name, colorway)")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return data as Subscriber[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("subscribers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-subscribers"] }),
  });

  const list = (subscribers.data ?? []).filter((s) => s.source === tab);
  const counts = {
    newsletter: (subscribers.data ?? []).filter((s) => s.source === "newsletter").length,
    restock: (subscribers.data ?? []).filter((s) => s.source === "restock").length,
  };

  const exportCsv = () =>
    downloadCsv(
      `jesusity-${tab}-${new Date().toISOString().slice(0, 10)}.csv`,
      list.map((s) => ({
        email: s.email,
        ...(tab === "restock"
          ? { product: s.products ? `${s.products.name} (${s.products.colorway})` : "", size: s.size ?? "" }
          : {}),
        signed_up: s.created_at,
      })),
    );

  return (
    <div>
      <PageTitle
        title="Subscribers"
        description="Newsletter sign-ups and people waiting for sold-out items. Export to your email tool."
        actions={
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={list.length === 0}>
            <Download size={15} /> Export CSV
          </Button>
        }
      />
      <ErrorNote error={subscribers.error || remove.error} />

      <div className="mb-4 flex gap-1">
        {(
          [
            ["newsletter", "Newsletter"],
            ["restock", "Back-in-stock requests"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full border px-3 py-1 text-sm ${
              tab === key ? "border-neutral-900 bg-neutral-900 text-white" : "bg-white text-neutral-600"
            }`}
          >
            {label} <span className="opacity-60">{counts[key]}</span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        {subscribers.isLoading ? (
          <Empty>Loading…</Empty>
        ) : list.length === 0 ? (
          <Empty>Nobody yet.</Empty>
        ) : (
          <ul className="divide-y text-sm">
            {list.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate">{s.email}</p>
                  {tab === "restock" && (
                    <p className="truncate text-xs text-neutral-500">
                      {s.products ? `${s.products.name} · ${s.products.colorway}` : "Removed product"}
                      {s.size ? ` · ${s.size}` : ""}
                    </p>
                  )}
                </div>
                <span className="hidden shrink-0 text-xs text-neutral-400 sm:block">
                  {formatDateTime(s.created_at)}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${s.email}`}
                  className="p-1 text-neutral-400 hover:text-red-600"
                  onClick={() => {
                    if (window.confirm(`Remove ${s.email}?`)) remove.mutate(s.id);
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
