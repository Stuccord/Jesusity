import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAdmin } from "../components/admin/AdminContext";
import { useOverview } from "../components/admin/useOverview";
import { formatGHS } from "../data/products";
import { timeAgo } from "../lib/admin";
import {
  Empty,
  ErrorNote,
  PageTitle,
  Panel,
  RangePicker,
  RankList,
  Stat,
  StatusBadge,
} from "../components/admin/AdminUi";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

const shortDate = (d: string) =>
  new Intl.DateTimeFormat("en-GH", { day: "numeric", month: "short" }).format(new Date(d));

function AdminOverview() {
  const { supabase } = useAdmin();
  const [days, setDays] = useState(30);
  const overview = useOverview(days);
  const recent = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, reference, customer_name, total, status, created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
    refetchInterval: 60_000,
  });

  const o = overview.data;
  const conversion = o && o.visitors > 0 ? ((o.orders / o.visitors) * 100).toFixed(1) + "%" : "—";
  const aov = o && o.orders > 0 ? formatGHS(Number(o.revenue) / o.orders) : "—";

  return (
    <div>
      <PageTitle
        title="Overview"
        description="Sales and traffic for your store. Updates every minute."
        actions={<RangePicker days={days} onChange={setDays} />}
      />
      <ErrorNote error={overview.error} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Revenue" value={o ? formatGHS(Number(o.revenue)) : "…"} hint="Paid orders" />
        <Stat label="Orders" value={o?.orders ?? "…"} hint={`Avg. ${aov}`} />
        <Stat label="Visitors" value={o?.visitors ?? "…"} hint={`${o?.visitors_today ?? 0} today`} />
        <Stat label="Conversion" value={conversion} hint="Orders ÷ visitors" />
        <Stat
          label="To fulfil"
          value={o?.pending_orders ?? "…"}
          hint="Paid, not yet shipped"
        />
        <Stat
          label="Unfinished checkouts"
          value={o?.abandoned_checkouts ?? "…"}
          hint="Started but not paid"
        />
        <Stat label="Page views" value={o?.page_views ?? "…"} />
        <Stat
          label="Unread messages"
          value={o?.unread_messages ?? "…"}
          hint={`${o?.subscribers ?? 0} newsletter subscribers`}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Visitors">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={o?.daily ?? []} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} fontSize={11} minTickGap={24} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip labelFormatter={(d) => shortDate(String(d))} />
                <Area
                  type="monotone"
                  dataKey="views"
                  name="Page views"
                  stroke="#a3a3a3"
                  fill="#f5f5f5"
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  name="Visitors"
                  stroke="#111"
                  fill="#11111122"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Revenue">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={o?.daily ?? []} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} fontSize={11} minTickGap={24} />
                <YAxis fontSize={11} />
                <Tooltip
                  labelFormatter={(d) => shortDate(String(d))}
                  formatter={(v) => formatGHS(Number(v))}
                />
                <Bar dataKey="revenue" name="Revenue" fill="#111" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Panel
          title="Recent orders"
          action={
            <Link to="/admin/orders" className="text-xs text-neutral-500 hover:underline">
              View all
            </Link>
          }
          className="xl:col-span-2"
        >
          {recent.data && recent.data.length > 0 ? (
            <ul className="divide-y">
              {recent.data.map((order) => (
                <li key={order.id}>
                  <Link
                    to="/admin/orders"
                    search={{ ref: order.reference }}
                    className="flex items-center justify-between gap-3 py-2.5 text-sm hover:bg-neutral-50"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{order.reference}</p>
                      <p className="truncate text-xs text-neutral-500">
                        {order.customer_name} · {timeAgo(order.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="tabular-nums">{formatGHS(Number(order.total))}</span>
                      <StatusBadge status={order.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No orders yet.</Empty>
          )}
        </Panel>

        <Panel
          title="Low stock"
          action={
            <Link to="/admin/products" className="text-xs text-neutral-500 hover:underline">
              Manage
            </Link>
          }
        >
          {o && o.low_stock.length > 0 ? (
            <ul className="divide-y text-sm">
              {o.low_stock.map((row) => (
                <li key={`${row.id}-${row.size}`} className="flex justify-between gap-3 py-2">
                  <span className="truncate">
                    {row.name} <span className="text-neutral-500">· {row.colorway} · {row.size}</span>
                  </span>
                  <span
                    className={`shrink-0 tabular-nums ${row.stock === 0 ? "font-semibold text-red-600" : "text-amber-700"}`}
                  >
                    {row.stock === 0 ? "Sold out" : `${row.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>All sizes have more than 3 in stock.</Empty>
          )}
        </Panel>

        <Panel title="Best sellers">
          <RankList
            rows={(o?.top_products ?? []).map((p) => ({
              label: p.name,
              value: Number(p.units),
              sub: "sold",
            }))}
            empty="No sales in this period."
          />
        </Panel>
        <Panel title="Top pages">
          <RankList
            rows={(o?.top_pages ?? []).map((p) => ({ label: p.path, value: Number(p.views) }))}
          />
        </Panel>
        <Panel title="Traffic sources">
          <RankList
            rows={(o?.referrers ?? []).map((r) => ({ label: r.source, value: Number(r.visitors) }))}
          />
        </Panel>
      </div>
    </div>
  );
}
