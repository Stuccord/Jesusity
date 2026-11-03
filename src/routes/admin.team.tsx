import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, UserPlus } from "lucide-react";
import { useAdmin } from "../components/admin/AdminContext";
import { Empty, ErrorNote, PageTitle, Panel } from "../components/admin/AdminUi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ORDER_STATUS_LABELS } from "../config/store";
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  formatDateTime,
  timeAgo,
  type AdminRole,
} from "../lib/admin";
import { addAdmin } from "../lib/team";

export const Route = createFileRoute("/admin/team")({
  component: AdminTeam,
});

const ROLES: AdminRole[] = ["manager", "accounts", "staff"];

interface Member {
  user_id: string;
  email: string;
  role: AdminRole;
  added_at: string;
  last_sign_in_at: string | null;
}

interface Activity {
  id: number;
  actor_email: string | null;
  action: string;
  target: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

function AdminTeam() {
  const { supabase, session } = useAdmin();
  const queryClient = useQueryClient();

  const team = useQuery({
    queryKey: ["admin-team"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_team");
      if (error) throw error;
      return data as Member[];
    },
  });

  const activity = useQuery({
    queryKey: ["admin-activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_activity")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(150);
      if (error) throw error;
      return data as Activity[];
    },
    refetchInterval: 60_000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-team"] });
    queryClient.invalidateQueries({ queryKey: ["admin-activity"] });
  };

  const changeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AdminRole }) => {
      const { error } = await supabase.from("admin_users").update({ role }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("admin_users").delete().eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  return (
    <div>
      <PageTitle
        title="Team"
        description="Who can use this dashboard and what each person can see. Only managers see this page."
      />
      <ErrorNote error={team.error || changeRole.error || remove.error} />

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Panel title="Admins">
            {team.isLoading ? (
              <Empty>Loading…</Empty>
            ) : (
              <ul className="-my-2 divide-y">
                {(team.data ?? []).map((m) => {
                  const isMe = m.user_id === session.user.id;
                  return (
                    <li key={m.user_id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {m.email}
                          {isMe && <span className="ml-1 font-normal text-neutral-400">(you)</span>}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {m.last_sign_in_at
                            ? `Last signed in ${timeAgo(m.last_sign_in_at)}`
                            : "Hasn't signed in yet"}
                        </p>
                      </div>
                      <select
                        value={m.role}
                        disabled={isMe || changeRole.isPending}
                        title={isMe ? "Ask another manager to change your role" : undefined}
                        onChange={(e) =>
                          changeRole.mutate({ userId: m.user_id, role: e.target.value as AdminRole })
                        }
                        className="h-9 rounded-md border bg-white px-2 text-sm disabled:opacity-60"
                        aria-label={`Role for ${m.email}`}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={isMe}
                        aria-label={`Remove ${m.email}`}
                        title={isMe ? "You can't remove yourself" : "Remove from team"}
                        className="p-1 text-neutral-400 hover:text-red-600 disabled:invisible"
                        onClick={() => {
                          if (window.confirm(`Remove ${m.email} from the admin team?`))
                            remove.mutate(m.user_id);
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Recent activity">
            <ErrorNote error={activity.error} />
            {activity.isLoading ? (
              <Empty>Loading…</Empty>
            ) : (activity.data ?? []).length === 0 ? (
              <Empty>Changes to orders, products, stock and the team will show here.</Empty>
            ) : (
              <ul className="-my-2 divide-y text-sm">
                {activity.data!.map((a) => (
                  <li key={a.id} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-3">
                    <span
                      className="shrink-0 text-xs text-neutral-400 sm:w-32 sm:pt-0.5"
                      title={formatDateTime(a.created_at)}
                    >
                      {timeAgo(a.created_at)}
                    </span>
                    <span className="min-w-0">
                      <span className="font-medium">{a.actor_email ?? "Someone"}</span>{" "}
                      {describeActivity(a)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <AddAdminForm accessToken={session.access_token} onAdded={refresh} />
          <Panel title="What each role can do">
            <dl className="space-y-3 text-sm">
              {ROLES.map((r) => (
                <div key={r}>
                  <dt className="font-medium">{ROLE_LABELS[r]}</dt>
                  <dd className="text-neutral-600">{ROLE_DESCRIPTIONS[r]}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function AddAdminForm({ accessToken, onAdded }: { accessToken: string; onAdded: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("staff");
  const [message, setMessage] = useState<string | null>(null);

  const add = useMutation({
    mutationFn: async () => {
      const result = await addAdmin({ data: { accessToken, email, role } });
      if (!result.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: (result) => {
      setMessage(
        result.invited
          ? `${email} has been added as ${ROLE_LABELS[role]}. They'll get an email to choose a password. If it doesn't arrive, they can use "Forgot password" on the sign-in page.`
          : `${email} has been added as ${ROLE_LABELS[role]}. They can sign in with their existing password.`,
      );
      setEmail("");
      onAdded();
    },
    onMutate: () => setMessage(null),
  });

  return (
    <Panel title="Add an admin">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="team-email">Email</Label>
          <Input
            id="team-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@domain.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="team-role">Role</Label>
          <select
            id="team-role"
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            className="h-9 w-full rounded-md border bg-white px-2 text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <p className="text-xs text-neutral-500">{ROLE_DESCRIPTIONS[role]}</p>
        </div>
        {add.error && <p className="text-sm text-red-600">{(add.error as Error).message}</p>}
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        <Button type="submit" size="sm" disabled={add.isPending}>
          <UserPlus size={15} /> {add.isPending ? "Adding…" : "Add admin"}
        </Button>
      </form>
    </Panel>
  );
}

/** Plain-English line for one activity log entry */
function describeActivity(a: Activity): string {
  const d = a.details ?? {};
  const change = (field: string) => d[field] as { from: unknown; to: unknown } | undefined;
  const target = a.target ?? "";
  switch (a.action) {
    case "order.status": {
      const from = ORDER_STATUS_LABELS[String(d["from"])] ?? d["from"];
      const to = ORDER_STATUS_LABELS[String(d["to"])] ?? d["to"];
      const note = d["note"] ? ` with the note "${String(d["note"])}"` : "";
      return from === to
        ? `added a note to ${target}${note}`
        : `moved ${target} from ${String(from)} to ${String(to)}${note}`;
    }
    case "stock.update": {
      const stock = change("stock");
      return `changed stock for ${target} from ${String(stock?.from)} to ${String(stock?.to)}`;
    }
    case "stock.insert":
      return `added ${target}`;
    case "stock.delete":
      return `removed ${target}`;
    case "product.insert":
      return `added the product ${target}`;
    case "product.delete":
      return `deleted the product ${target}`;
    case "product.update": {
      const visible = change("is_active");
      const price = change("price");
      const parts = Object.keys(d)
        .filter((k) => k !== "is_active" && k !== "price")
        .map((k) => k.replace(/_/g, " "));
      const said: string[] = [];
      if (visible) said.push(visible.to ? "made it visible" : "hid it");
      if (price) said.push(`changed the price from GH₵${String(price.from)} to GH₵${String(price.to)}`);
      if (parts.length) said.push(`edited ${parts.join(", ")}`);
      return `updated ${target}: ${said.join("; ") || "no visible changes"}`;
    }
    case "team.insert":
      return `added ${target} as ${ROLE_LABELS[d["role"] as AdminRole] ?? String(d["role"])}`;
    case "team.update": {
      const role = change("role");
      return `changed ${target}'s role from ${ROLE_LABELS[role?.from as AdminRole] ?? "?"} to ${ROLE_LABELS[role?.to as AdminRole] ?? "?"}`;
    }
    case "team.delete":
      return `removed ${target || "an admin"} from the team`;
    default:
      return `${a.action} ${target}`;
  }
}
