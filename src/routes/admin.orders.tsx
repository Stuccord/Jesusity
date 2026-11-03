import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Mail, MessageCircle, Phone, Search } from "lucide-react";
import { useAdmin } from "../components/admin/AdminContext";
import { Empty, ErrorNote, PageTitle, StatusBadge } from "../components/admin/AdminUi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../components/ui/sheet";
import { formatGHS } from "../data/products";
import { ORDER_STATUS_LABELS } from "../config/store";
import { downloadCsv, formatDateTime, timeAgo } from "../lib/admin";

interface OrdersSearch {
  ref?: string;
}

export const Route = createFileRoute("/admin/orders")({
  validateSearch: (search: Record<string, unknown>): OrdersSearch =>
    typeof search["ref"] === "string" ? { ref: search["ref"] } : {},
  component: AdminOrders,
});

interface OrderRow {
  id: string;
  reference: string;
  status: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  notes: string | null;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  payment_reference: string | null;
  payment_channel: string | null;
  paid_at: string | null;
  created_at: string;
  order_items: {
    id: number;
    product_name: string;
    colorway: string | null;
    size: string;
    quantity: number;
    unit_price: number;
    image: string | null;
  }[];
  order_events: { id: number; status: string; note: string | null; created_at: string }[];
}

const FILTERS = [
  { key: "all", label: "All", statuses: null },
  { key: "todo", label: "To fulfil", statuses: ["paid", "processing"] },
  { key: "shipped", label: "Shipped", statuses: ["shipped"] },
  { key: "delivered", label: "Delivered", statuses: ["delivered"] },
  { key: "unpaid", label: "Unpaid", statuses: ["pending_payment", "payment_failed"] },
  { key: "closed", label: "Cancelled", statuses: ["cancelled", "refunded"] },
] as const;

// Statuses an admin can move a paid order through
const NEXT_STATUSES = ["paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

function AdminOrders() {
  const { supabase } = useAdmin();
  const { ref } = Route.useSearch();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [query, setQuery] = useState(ref ?? "");
  const [openId, setOpenId] = useState<string | null>(null);
  const [linkDismissed, setLinkDismissed] = useState(false);

  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), order_events(*)")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data as OrderRow[];
    },
    refetchInterval: 30_000,
  });

  const visible = useMemo(() => {
    const statuses = FILTERS.find((f) => f.key === filter)?.statuses;
    const q = query.trim().toLowerCase();
    return (orders.data ?? []).filter((o) => {
      if (statuses && !(statuses as readonly string[]).includes(o.status)) return false;
      if (!q) return true;
      return [o.reference, o.customer_name, o.email, o.phone, o.city]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [orders.data, filter, query]);

  // A link like /admin/orders?ref=JS-… opens that order straight away
  const fromLink =
    ref && !linkDismissed
      ? orders.data?.find((o) => o.reference === ref.toUpperCase())
      : undefined;
  const shown = orders.data?.find((o) => o.id === openId) ?? fromLink;

  const exportCsv = () =>
    downloadCsv(
      `jesusity-orders-${new Date().toISOString().slice(0, 10)}.csv`,
      visible.map((o) => ({
        reference: o.reference,
        date: o.created_at,
        status: ORDER_STATUS_LABELS[o.status] ?? o.status,
        customer: o.customer_name,
        email: o.email,
        phone: o.phone,
        address: o.address,
        city: o.city,
        region: o.region,
        items: o.order_items.map((i) => `${i.quantity}x ${i.product_name} (${i.size})`).join("; "),
        subtotal: o.subtotal,
        vip_discount: o.discount,
        delivery: o.delivery_fee,
        total: o.total,
        payment: o.payment_channel ?? "",
      })),
    );

  return (
    <div>
      <PageTitle
        title="Orders"
        description="Every checkout, paid or not. Click an order to see details and update its status."
        actions={
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={visible.length === 0}>
            <Download size={15} /> Export CSV
          </Button>
        }
      />
      <ErrorNote error={orders.error} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => {
            const count = f.statuses
              ? (orders.data ?? []).filter((o) => (f.statuses as readonly string[]).includes(o.status)).length
              : (orders.data ?? []).length;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  filter === f.key ? "border-neutral-900 bg-neutral-900 text-white" : "bg-white text-neutral-600"
                }`}
              >
                {f.label} <span className="opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Search reference, name, email, phone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        {orders.isLoading ? (
          <Empty>Loading orders…</Empty>
        ) : visible.length === 0 ? (
          <Empty>No orders match.</Empty>
        ) : (
          <ul className="divide-y">
            {visible.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(o.id)}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3 text-left text-sm hover:bg-neutral-50 md:grid-cols-[9rem_1fr_8rem_7rem_9rem]"
                >
                  <span className="font-medium">{o.reference}</span>
                  <span className="text-right tabular-nums md:order-4 md:text-left">
                    {formatGHS(Number(o.total))}
                  </span>
                  <span className="truncate text-neutral-600 md:order-2">
                    {o.customer_name}
                    <span className="text-neutral-400"> · {o.city}</span>
                  </span>
                  <span className="text-right text-xs text-neutral-500 md:order-3 md:text-left">
                    {timeAgo(o.created_at)}
                  </span>
                  <span className="md:order-5">
                    <StatusBadge status={o.status} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Sheet
        open={Boolean(shown)}
        onOpenChange={(open) => {
          if (!open) {
            setOpenId(null);
            setLinkDismissed(true);
          }
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {shown && <OrderDetail order={shown} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function OrderDetail({ order }: { order: OrderRow }) {
  const { supabase } = useAdmin();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState("");

  const update = useMutation({
    mutationFn: async () => {
      if (status !== order.status) {
        const { error } = await supabase.from("orders").update({ status }).eq("id", order.id);
        if (error) throw error;
      }
      const { error } = await supabase.from("order_events").insert({
        order_id: order.id,
        status,
        note: note.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      queryClient.invalidateQueries({ queryKey: ["admin-recent-orders"] });
    },
  });

  const isPaid = Boolean(order.paid_at);
  const events = [...order.order_events].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const waNumber = order.phone.replace(/\D/g, "").replace(/^0/, "233");

  return (
    <>
      <SheetHeader className="text-left">
        <SheetTitle className="flex flex-wrap items-center gap-2">
          {order.reference} <StatusBadge status={order.status} />
        </SheetTitle>
        <p className="text-xs text-neutral-500">Placed {formatDateTime(order.created_at)}</p>
      </SheetHeader>

      <div className="mt-6 space-y-6 text-sm">
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Customer
          </h3>
          <p className="font-medium">{order.customer_name}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a className="inline-flex items-center gap-1 rounded border px-2 py-1 hover:bg-neutral-50" href={`mailto:${order.email}?subject=Your Jesusity order ${order.reference}`}>
              <Mail size={13} /> {order.email}
            </a>
            <a className="inline-flex items-center gap-1 rounded border px-2 py-1 hover:bg-neutral-50" href={`tel:${order.phone}`}>
              <Phone size={13} /> {order.phone}
            </a>
            <a
              className="inline-flex items-center gap-1 rounded border px-2 py-1 hover:bg-neutral-50"
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={13} /> WhatsApp
            </a>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Deliver to
          </h3>
          <p>{order.address}</p>
          <p>
            {order.city}, {order.region}
          </p>
          {order.notes && (
            <p className="mt-2 rounded bg-amber-50 p-2 text-amber-900">Note: {order.notes}</p>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Items
          </h3>
          <ul className="divide-y rounded border">
            {order.order_items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 p-2">
                {item.image && (
                  <img src={item.image} alt="" className="h-12 w-12 shrink-0 rounded bg-neutral-100 object-contain" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.product_name}</p>
                  <p className="text-xs text-neutral-500">
                    {item.colorway} · Size {item.size} · Qty {item.quantity}
                  </p>
                </div>
                <span className="tabular-nums">
                  {formatGHS(Number(item.unit_price) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Subtotal</dt>
              <dd className="tabular-nums">{formatGHS(Number(order.subtotal))}</dd>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-green-700">
                <dt>VIP discount</dt>
                <dd className="tabular-nums">−{formatGHS(Number(order.discount))}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-neutral-500">Delivery</dt>
              <dd className="tabular-nums">{formatGHS(Number(order.delivery_fee))}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatGHS(Number(order.total))}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Payment
          </h3>
          {isPaid ? (
            <p>
              Paid {formatDateTime(order.paid_at!)} via{" "}
              {order.payment_channel === "mobile_money" ? "Mobile Money" : (order.payment_channel ?? "Paystack")}
              {order.payment_reference && (
                <span className="text-neutral-500"> · Paystack ID {order.payment_reference}</span>
              )}
            </p>
          ) : (
            <p className="text-neutral-600">
              Not paid. Don't ship this order unless payment appears in your Paystack dashboard.
            </p>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Timeline
          </h3>
          <ol className="space-y-2 border-l pl-4">
            {events.map((e) => (
              <li key={e.id}>
                <p className="font-medium">{ORDER_STATUS_LABELS[e.status] ?? e.status}</p>
                {e.note && <p className="text-neutral-600">{e.note}</p>}
                <p className="text-xs text-neutral-400">{formatDateTime(e.created_at)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-lg border bg-neutral-50 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Update order
          </h3>
          {isPaid ? (
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                update.mutate();
              }}
            >
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-9 w-full rounded-md border bg-white px-2 text-sm"
                aria-label="Order status"
              >
                {NEXT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Note for the customer (shown on tracking), e.g. rider's name"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
              />
              {update.error && (
                <p className="text-sm text-red-600">{(update.error as Error).message}</p>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={update.isPending || (status === order.status && !note.trim())}
              >
                {update.isPending ? "Saving…" : "Save update"}
              </Button>
              <p className="text-xs text-neutral-500">
                The customer sees status changes and notes on the Track Order page. Refunds are
                issued from your Paystack dashboard.
              </p>
            </form>
          ) : (
            <p className="text-neutral-600">
              Status updates unlock once payment is confirmed.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
