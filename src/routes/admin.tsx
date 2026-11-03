import { useState } from "react";
import { createFileRoute, Link, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BarChart3,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  ShieldCheck,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import {
  ROLE_LABELS,
  can,
  useAdminAuth,
  type AdminPermission,
  type AdminRole,
} from "../lib/admin";
import { AdminContext } from "../components/admin/AdminContext";
import { getBrowserSupabase } from "../lib/supabase/client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export const Route = createFileRoute("/admin")({
  // The admin session lives in the browser, so render this area client-side only
  ssr: false,
  head: () => ({
    meta: [{ title: "Admin | Jesusity" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminLayout,
});

const NAV: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  permission?: AdminPermission;
}[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true, permission: "overview" },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/visitors", label: "Visitors", icon: BarChart3, permission: "visitors" },
  { to: "/admin/messages", label: "Messages", icon: Inbox, permission: "messages" },
  { to: "/admin/subscribers", label: "Subscribers", icon: Mail, permission: "customers" },
  { to: "/admin/team", label: "Team", icon: Users, permission: "team" },
];

const isActive = (item: (typeof NAV)[number], pathname: string) =>
  item.exact ? pathname === item.to || pathname === `${item.to}/` : pathname.startsWith(item.to);

function AdminLayout() {
  const auth = useAdminAuth();

  if (auth.status === "loading") {
    return <AdminShellMessage title="Loading…" />;
  }
  if (auth.status === "unconfigured") {
    return (
      <AdminShellMessage
        title="Connect Supabase to use the dashboard"
        body="Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (plus the server keys) in your hosting environment, then redeploy. See SETUP.md in the project."
      />
    );
  }
  if (auth.status === "signed-out") return <AdminLogin />;
  if (auth.status === "recovery") return <SetNewPassword supabase={auth.supabase} />;
  if (auth.status === "not-admin") {
    return (
      <AdminShellMessage
        title="This account isn't an admin"
        body={`${auth.email} is signed in but isn't on the admin team. Ask a manager to add you on the Team page, then reload.`}
        action={<SignOutButton />}
      />
    );
  }

  return (
    <AdminContext.Provider value={{ supabase: auth.supabase, session: auth.session, role: auth.role }}>
      <AdminFrame email={auth.session.user.email ?? ""} role={auth.role} />
    </AdminContext.Provider>
  );
}

function AdminFrame({ email, role }: { email: string; role: AdminRole }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [navOpen, setNavOpen] = useState(false);
  const allowed = NAV.filter((item) => !item.permission || can(role, item.permission));
  const current = NAV.find((item) => isActive(item, pathname));
  const blocked = current?.permission ? !can(role, current.permission) : false;

  const nav = (
    <nav className="flex flex-col gap-1">
      {allowed.map((item) => {
        const { to, label, icon: Icon } = item;
        const active = isActive(item, pathname);
        return (
          <Link
            key={to}
            to={to}
            onClick={() => setNavOpen(false)}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <Icon size={17} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="admin-root min-h-screen bg-neutral-50 text-neutral-900">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-4 lg:hidden">
        <span className="text-sm font-bold tracking-widest">JESUSITY ADMIN</span>
        <button
          type="button"
          aria-label={navOpen ? "Close menu" : "Open menu"}
          onClick={() => setNavOpen((v) => !v)}
          className="rounded-md p-2 hover:bg-neutral-100"
        >
          {navOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      {navOpen && (
        <div className="fixed inset-x-0 top-14 z-20 border-b bg-white p-3 shadow-lg lg:hidden">
          {nav}
          <div className="mt-3 border-t pt-3">
            <p className="mb-2 px-3 text-xs text-neutral-500">
              {email} · {ROLE_LABELS[role]}
            </p>
            <SignOutButton />
          </div>
        </div>
      )}

      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-white p-4 lg:flex">
          <div className="mb-6 px-3 pt-2 text-sm font-bold tracking-widest">JESUSITY ADMIN</div>
          {nav}
          <div className="mt-auto space-y-3 border-t pt-4">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 text-sm text-neutral-600 hover:text-neutral-900"
            >
              <ExternalLink size={15} /> View store
            </a>
            <div className="px-3">
              <p className="truncate text-xs text-neutral-500" title={email}>
                {email}
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-neutral-700">
                <ShieldCheck size={13} /> {ROLE_LABELS[role]}
              </p>
            </div>
            <SignOutButton />
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {!blocked ? (
            <Outlet />
          ) : current?.to === "/admin" ? (
            // Staff start on Orders instead of the money overview
            <Navigate to="/admin/orders" replace />
          ) : (
            <div className="mx-auto mt-16 max-w-md rounded-lg border bg-white p-6 text-center">
              <h1 className="text-lg font-semibold">You don't have access to this page</h1>
              <p className="mt-2 text-sm text-neutral-600">
                Your role is {ROLE_LABELS[role]}. Ask a manager if you need access.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function SignOutButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full justify-start gap-2"
      onClick={() => getBrowserSupabase()?.auth.signOut()}
    >
      <LogOut size={15} /> Sign out
    </Button>
  );
}

function AdminShellMessage({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="admin-root flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-md rounded-lg border bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold">{title}</h1>
        {body && <p className="mt-2 text-sm text-neutral-600">{body}</p>}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

function SetNewPassword({ supabase }: { supabase: SupabaseClient }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setError(error.message);
    else window.location.assign("/admin");
  };

  return (
    <div className="admin-root flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <form onSubmit={save} className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold">Choose a new password</h1>
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-neutral-500">At least 10 characters.</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Saving…" : "Save password"}
        </Button>
      </form>
    </div>
  );
}

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setBusy(false);
  };

  const sendReset = async () => {
    const supabase = getBrowserSupabase();
    if (!supabase || !email) {
      setError("Enter your email first, then click “Forgot password”.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin`,
    });
    if (error) setError(error.message);
    else setResetSent(true);
  };

  return (
    <div className="admin-root flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <form
        onSubmit={signIn}
        className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6 shadow-sm"
      >
        <div>
          <h1 className="text-lg font-semibold">Jesusity Admin</h1>
          <p className="text-sm text-neutral-600">Sign in to manage the store.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-email">Email</Label>
          <Input
            id="admin-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-password">Password</Label>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {resetSent && (
          <p className="text-sm text-emerald-700">Check your email for a password reset link.</p>
        )}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <button
          type="button"
          onClick={sendReset}
          className="w-full text-center text-xs text-neutral-500 underline-offset-2 hover:underline"
        >
          Forgot password
        </button>
      </form>
    </div>
  );
}
