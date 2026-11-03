import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { useAdmin } from "../components/admin/AdminContext";
import { useOverview } from "../components/admin/useOverview";
import {
  Empty,
  ErrorNote,
  PageTitle,
  Panel,
  RangePicker,
  RankList,
  Stat,
} from "../components/admin/AdminUi";
import { timeAgo } from "../lib/admin";

export const Route = createFileRoute("/admin/visitors")({
  component: AdminVisitors,
});

interface PageView {
  id: number;
  session_id: string;
  path: string;
  referrer: string | null;
  country: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  created_at: string;
}

const countryName = (code: string) => {
  if (!code || code === "Unknown") return "Unknown";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
};

const DeviceIcon = ({ device }: { device: string | null }) =>
  device === "Mobile" ? (
    <Smartphone size={14} />
  ) : device === "Tablet" ? (
    <Tablet size={14} />
  ) : (
    <Monitor size={14} />
  );

function AdminVisitors() {
  const { supabase } = useAdmin();
  const [days, setDays] = useState(7);
  const overview = useOverview(days);

  const live = useQuery({
    queryKey: ["admin-live-views"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_views")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(150);
      if (error) throw error;
      return data as PageView[];
    },
    refetchInterval: 15_000,
  });

  const fiveMinutesAgo = Date.now() - 5 * 60_000;
  const activeNow = new Set(
    (live.data ?? [])
      .filter((v) => new Date(v.created_at).getTime() > fiveMinutesAgo)
      .map((v) => v.session_id),
  ).size;

  const o = overview.data;
  const pagesPerVisit = o && o.visitors > 0 ? (o.page_views / o.visitors).toFixed(1) : "—";

  return (
    <div>
      <PageTitle
        title="Visitors"
        description="Who's visiting, where they come from and what they look at. Anonymous: no IP addresses are stored."
        actions={<RangePicker days={days} onChange={setDays} />}
      />
      <ErrorNote error={overview.error || live.error} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Active now"
          value={
            <span className="inline-flex items-center gap-2">
              {activeNow > 0 && <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />}
              {activeNow}
            </span>
          }
          hint="Last 5 minutes"
        />
        <Stat label="Visitors" value={o?.visitors ?? "…"} hint={`${o?.visitors_today ?? 0} today`} />
        <Stat label="Page views" value={o?.page_views ?? "…"} />
        <Stat label="Pages per visit" value={pagesPerVisit} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Top pages">
          <RankList
            rows={(o?.top_pages ?? []).map((p) => ({
              label: p.path,
              value: Number(p.views),
              sub: `${p.visitors} visitors`,
            }))}
          />
        </Panel>
        <Panel title="Traffic sources">
          <RankList
            rows={(o?.referrers ?? []).map((r) => ({ label: r.source, value: Number(r.visitors) }))}
          />
        </Panel>
        <Panel title="Countries">
          <RankList
            rows={(o?.countries ?? []).map((c) => ({
              label: countryName(c.country),
              value: Number(c.visitors),
            }))}
          />
        </Panel>
        <Panel title="Devices">
          <RankList
            rows={(o?.devices ?? []).map((d) => ({ label: d.device, value: Number(d.visitors) }))}
          />
        </Panel>
      </div>

      <Panel title="Live activity" className="mt-4">
        {live.isLoading ? (
          <Empty>Loading…</Empty>
        ) : (live.data ?? []).length === 0 ? (
          <Empty>No visits recorded yet.</Empty>
        ) : (
          <ul className="divide-y text-sm">
            {live.data!.map((v) => (
              <li key={v.id} className="flex items-center gap-3 py-2">
                <span className="text-neutral-400">
                  <DeviceIcon device={v.device} />
                </span>
                <span className="min-w-0 flex-1 truncate font-medium" title={v.path}>
                  {v.path}
                </span>
                <span className="hidden w-40 truncate text-neutral-500 md:block">
                  {[v.city, v.country ? countryName(v.country) : null].filter(Boolean).join(", ") ||
                    "—"}
                </span>
                <span className="hidden w-32 truncate text-neutral-500 sm:block">
                  {v.referrer ?? "Direct"}
                </span>
                <span className="w-16 shrink-0 text-right text-xs text-neutral-400">
                  {timeAgo(v.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
