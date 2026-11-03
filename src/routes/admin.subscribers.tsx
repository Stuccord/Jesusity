import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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

interface VipMember {
  id: number;
  phone: string;
  email: string | null;
  created_at: string;
  redeemed_at: string | null;
  orders: { reference: string } | null;
}

type Tab = "vip" | "newsletter" | "restock";

function AdminSubscribers() {
  const { supabase } = useAdmin();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("vip");

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

  const vips = useQuery({
    queryKey: ["admin-vip-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vip_members")
        .select("id, phone, email, created_at, redeemed_at, orders!redeemed_order_id(reference)")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return data as unknown as VipMember[];
    },
  });

  const remove = useMutation({
    mutationFn: async ({ table, id }: { table: "subscribers" | "vip_members"; id: number }) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-vip-members"] });
    },
  });

  const list = (subscribers.data ?? []).filter((s) => s.source === tab);
  const vipList = vips.data ?? [];
  const counts: Record<Tab, number> = {
    vip: vipList.length,
    newsletter: (subscribers.data ?? []).filter((s) => s.source === "newsletter").length,
    restock: (subscribers.data ?? []).filter((s) => s.source === "restock").length,
  };
  const redeemed = vipList.filter((v) => v.redeemed_at).length;

  const today = new Date().toISOString().slice(0, 10);
  const exportCsv = () =>
    tab === "vip"
      ? downloadCsv(
          `jesusity-vip-${today}.csv`,
          vipList.map((v) => ({
            phone: v.phone,
            email: v.email ?? "",
            joined: v.created_at,
            discount_used_on: v.orders?.reference ?? "",
          })),
        )
      : downloadCsv(
          `jesusity-${tab}-${today}.csv`,
          list.map((s) => ({
            email: s.email,
            ...(tab === "restock"
              ? {
                  product: s.products ? `${s.products.name} (${s.products.colorway})` : "",
                  size: s.size ?? "",
                }
              : {}),
            signed_up: s.created_at,
          })),
        );

  const isLoading = tab === "vip" ? vips.isLoading : subscribers.isLoading;
  const isEmpty = tab === "vip" ? vipList.length === 0 : list.length === 0;

  return (
    <div>
      <PageTitle
        title="Subscribers"
        description="VIP list, newsletter sign-ups and people waiting for sold-out items. Export to your SMS or email tool."
        actions={
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={isEmpty}>
            <Download size={15} /> Export CSV
          </Button>
        }
      />
      <ErrorNote error={vips.error || subscribers.error || remove.error} />

      <div className="mb-4 flex flex-wrap gap-1">
        {(
          [
            ["vip", "VIP list"],
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

      {tab === "vip" && vipList.length > 0 && (
        <p className="mb-3 text-sm text-neutral-500">
          {redeemed} of {vipList.length} have used their first-order discount.
        </p>
      )}

      <div className="overflow-hidden rounded-lg border bg-white">
        {isLoading ? (
          <Empty>Loading…</Empty>
        ) : isEmpty ? (
          <Empty>Nobody yet.</Empty>
        ) : tab === "vip" ? (
          <ul className="divide-y text-sm">
            {vipList.map((v) => (
              <li key={v.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate tabular-nums">
                    <a href={`tel:${v.phone}`} className="hover:underline">
                      {v.phone}
                    </a>
                  </p>
                  <p className="truncate text-xs text-neutral-500">{v.email ?? "No email"}</p>
                </div>
                {v.orders ? (
                  <Link
                    to="/admin/orders"
                    search={{ ref: v.orders.reference }}
                    className="shrink-0 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700"
                  >
                    Used · {v.orders.reference}
                  </Link>
                ) : (
                  <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs text-neutral-500">
                    Not used
                  </span>
                )}
                <span className="hidden shrink-0 text-xs text-neutral-400 sm:block">
                  {formatDateTime(v.created_at)}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${v.phone}`}
                  className="p-1 text-neutral-400 hover:text-red-600"
                  onClick={() => {
                    if (window.confirm(`Remove ${v.phone} from the VIP list?`))
                      remove.mutate({ table: "vip_members", id: v.id });
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
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
                    if (window.confirm(`Remove ${s.email}?`))
                      remove.mutate({ table: "subscribers", id: s.id });
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
