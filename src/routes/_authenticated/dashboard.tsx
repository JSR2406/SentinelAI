import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, GitBranch, Radar, ShieldCheck } from "lucide-react";
import { activity, recentScans, repositories, severityCounts } from "@/lib/dummy-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SentinelAI" },
      { name: "description", content: "Security posture overview for all your repositories." },
    ],
  }),
  component: Dashboard,
});

const score = 78;

function Dashboard() {
  const circumference = 2 * Math.PI * 52;
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Security overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Across {repositories.length} connected repositories.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="glass grid place-items-center rounded-2xl p-6">
          <div className="relative h-40 w-40">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--secondary)" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="url(#scoreGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - score / 100)}
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="oklch(0.62 0.19 255)" />
                  <stop offset="100%" stopColor="oklch(0.74 0.16 165)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="font-display text-4xl font-semibold">{score}</p>
                <p className="text-xs text-muted-foreground">Security score</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Up 6 points this week · Target 90
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat icon={AlertTriangle} label="Critical issues" value={String(severityCounts.critical)} note="3 newly introduced" tone="critical" />
          <Stat icon={GitBranch} label="Repositories" value={String(repositories.length)} note="2 added this month" tone="brand" />
          <Stat icon={Radar} label="Scans this week" value="27" note="Avg 1m 12s" tone="brand" />
          <div className="glass rounded-2xl p-5 sm:col-span-3">
            <p className="text-sm font-medium">Findings by severity</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["Critical", severityCounts.critical, "bg-destructive"],
                  ["High", severityCounts.high, "bg-chart-1"],
                  ["Medium", severityCounts.medium, "bg-chart-4"],
                  ["Low", severityCounts.low, "bg-brand-emerald"],
                ] as const
              ).map(([label, value, color]) => (
                <div key={label} className="rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${color}`} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                  <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Recent scans</h2>
            <Link to="/scans" className="text-xs text-brand-emerald hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {recentScans.map((s) => (
              <li key={s.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.repo}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.type} · {s.duration} · {s.when}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${
                    s.status === "Failed"
                      ? "bg-destructive/15 text-destructive"
                      : "bg-brand-emerald/15 text-brand-emerald"
                  }`}
                >
                  {s.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold">Latest activity</h2>
          <ul className="mt-4 space-y-4">
            {activity.map((a) => (
              <li key={a.what} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-blue" />
                <p className="min-w-0 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{a.who}</span> {a.what}
                  <span className="block text-xs">{a.when}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  note: string;
  tone: "critical" | "brand";
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <span
        className={`grid h-9 w-9 place-items-center rounded-xl ring-1 ring-border ${
          tone === "critical" ? "bg-destructive/15 text-destructive" : "bg-secondary text-brand-emerald"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-4 font-display text-3xl font-semibold">{value}</p>
      <p className="text-sm text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}