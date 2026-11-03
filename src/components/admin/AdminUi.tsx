import type { ReactNode } from "react";
import { ORDER_STATUS_LABELS } from "../../config/store";
import { STATUS_STYLES } from "../../lib/admin";

export function PageTitle({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border bg-white ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums xl:text-2xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] ?? "bg-neutral-100 text-neutral-700"
      }`}
    >
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-neutral-500">{children}</p>;
}

export function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : String(error);
  return (
    <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {message}
    </p>
  );
}

/** Simple ranked list with proportional bars (top pages, referrers, countries…) */
export function RankList({
  rows,
  empty = "No data yet",
}: {
  rows: { label: string; value: number; sub?: string }[];
  empty?: string;
}) {
  if (rows.length === 0) return <Empty>{empty}</Empty>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-2">
      {rows.map((row, i) => (
        <li key={`${row.label}-${i}`} className="relative overflow-hidden rounded">
          <div
            className="absolute inset-y-0 left-0 bg-neutral-100"
            style={{ width: `${(row.value / max) * 100}%` }}
            aria-hidden="true"
          />
          <div className="relative flex items-center justify-between gap-3 px-2 py-1.5 text-sm">
            <span className="truncate" title={row.label}>
              {row.label}
            </span>
            <span className="shrink-0 tabular-nums text-neutral-600">
              {row.value.toLocaleString()}
              {row.sub && <span className="ml-1 text-xs text-neutral-400">{row.sub}</span>}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function RangePicker({ days, onChange }: { days: number; onChange: (d: number) => void }) {
  return (
    <div className="inline-flex rounded-md border bg-white p-0.5 text-sm">
      {[1, 7, 30, 90].map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          className={`rounded px-3 py-1.5 ${d === days ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
        >
          {d === 1 ? "Today" : `${d} days`}
        </button>
      ))}
    </div>
  );
}
