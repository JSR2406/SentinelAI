import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  GitBranch,
  Radar,
  FileText,
  Share2,
  Sparkles,
  Settings,
  User,
  Search,
  Bell,
  Menu,
  LogOut,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Repositories", to: "/repositories", icon: GitBranch },
  { label: "Scans", to: "/scans", icon: Radar },
  { label: "Reports", to: "/reports", icon: FileText },
  { label: "Attack Graph", to: "/attack-graph", icon: Share2 },
  { label: "AI Copilot", to: "/copilot", icon: Sparkles },
  { label: "Profile", to: "/profile", icon: User },
  { label: "Settings", to: "/settings", icon: Settings },
] as const;

const notifications = [
  { title: "Critical secret found", body: "AWS key exposed in payments-api", time: "2m" },
  { title: "Scan completed", body: "sentinel-web finished in 1m 42s", time: "18m" },
  { title: "New CVE reachable", body: "CVE-2026-1187 affects auth-service", time: "3h" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [email, setEmail] = useState<string>("");
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth/login", replace: true });
  };

  const initials = (email || "SA").slice(0, 2).toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to="/dashboard" className="flex items-center gap-2.5 px-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-brand">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="oklch(0.14 0.015 260)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
          </svg>
        </span>
        <span className="font-display text-[15px] font-semibold">SentinelAI</span>
      </Link>
      <nav className="grid gap-1">
        {nav.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-secondary text-foreground ring-1 ring-brand-blue/30"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground">Free plan · 3 repos</p>
        <Link
          to="/"
          hash="pricing"
          className="mt-3 block rounded-lg bg-gradient-brand px-3 py-2 text-center text-xs font-semibold text-accent-foreground"
        >
          Upgrade to Pro
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card/40 lg:block">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-border bg-card">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="rounded-lg p-2 text-muted-foreground hover:text-foreground lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="relative min-w-0 lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search repositories, scans, CVEs…"
                className="w-full rounded-xl border border-input bg-secondary/40 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-brand-blue/60"
              />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => setBellOpen((v) => !v)}
                  aria-label="Notifications"
                  className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
                </button>
                {bellOpen && (
                  <div className="glass absolute right-0 top-11 z-50 w-72 rounded-xl p-2">
                    {notifications.map((n) => (
                      <div key={n.title} className="rounded-lg p-3 hover:bg-secondary/60">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium">{n.title}</p>
                          <span className="shrink-0 text-[11px] text-muted-foreground">{n.time}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Link
                to="/settings"
                className="grid h-9 w-9 place-items-center rounded-full bg-gradient-brand text-xs font-semibold text-accent-foreground"
                title={email}
              >
                {initials}
              </Link>
              <button
                onClick={signOut}
                aria-label="Sign out"
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}