import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, GitBranch, Radar, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient, type DashboardStats } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SentinelAI" },
      { name: "description", content: "Security posture overview for all your repositories." },
    ],
  }),
  component: Dashboard,
});

const FALLBACK: DashboardStats = {
  repoCount: 0,
  scanCount: 0,
  latestScore: 75,
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
  recentScans: [],
};

function Dashboard() {
  const circumference = 2 * Math.PI * 52;
  const [stats, setStats] = useState<DashboardStats>(FALLBACK);
  const [scoreAnim, setScoreAnim] = useState(0);

  useEffect(() => {
    apiClient
      .getDashboardStats()
      .then((data) => {
        setStats(data);
        // Animate the score ring
        setTimeout(() => setScoreAnim(data.latestScore), 80);
      })
      .catch(() => {
        // Fallback: try loading repos at least
        apiClient
          .getRepositories()
          .then((r) =>
            setStats((prev) => ({
              ...prev,
              repoCount: r.repositories.length,
              recentScans: [],
            }))
          )
          .catch(() => {});
        setTimeout(() => setScoreAnim(FALLBACK.latestScore), 80);
      });
  }, []);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Security overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Across {stats.repoCount} connected {stats.repoCount === 1 ? "repository" : "repositories"}.
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
                strokeDashoffset={circumference * (1 - scoreAnim / 100)}
                style={{ transition: "stroke-dashoffset 1s ease-out" }}
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
                <p className="font-display text-4xl font-semibold">{Math.round(scoreAnim)}</p>
                <p className="text-xs text-muted-foreground">Security score</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {stats.latestScore >= 80
              ? "Good posture · Target 90"
              : stats.latestScore >= 60
              ? "Needs improvement · Target 80"
              : "High risk · Immediate action needed"}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat icon={AlertTriangle} label="Critical issues" value={String(stats.critical)} note="Action required" tone="critical" />
          <Stat icon={GitBranch} label="Repositories" value={String(stats.repoCount)} note="Connected to SentinelAI" tone="brand" />
          <Stat icon={Radar} label="Total scans" value={String(stats.scanCount)} note="Automated pipeline" tone="brand" />
          <div className="glass rounded-2xl p-5 sm:col-span-3">
            <p className="text-sm font-medium">Findings by severity</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["Critical", stats.critical, "bg-destructive"],
                  ["High", stats.high, "bg-chart-1"],
                  ["Medium", stats.medium, "bg-chart-4"],
                  ["Low", stats.low, "bg-brand-emerald"],
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
            {stats.recentScans.length > 0 ? (
              stats.recentScans.map((s) => (
                <li key={s.scanId} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.repoName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.findingsCount} findings · Score {s.score?.toFixed(0) ?? "—"} ·{" "}
                      {s.started_at ? new Date(s.started_at).toLocaleDateString() : "Recent"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${
                      s.status === "COMPLETED"
                        ? "bg-brand-emerald/15 text-brand-emerald"
                        : s.status === "FAILED"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-chart-4/15 text-chart-4"
                    }`}
                  >
                    {s.status}
                  </span>
                </li>
              ))
            ) : (
              <li className="py-3 text-sm text-muted-foreground">No recent scans. Import a repository to start.</li>
            )}
          </ul>
        </div>

        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold">Latest activity</h2>
          <ul className="mt-4 space-y-4">
            {stats.recentScans.slice(0, 4).map((s) => (
              <li key={s.scanId} className="flex gap-3">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    s.status === "COMPLETED"
                      ? "bg-brand-emerald"
                      : s.status === "FAILED"
                      ? "bg-destructive"
                      : "bg-chart-4"
                  }`}
                />
                <p className="min-w-0 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">SentinelAI</span>{" "}
                  {s.status === "COMPLETED" ? "completed scan of" : "is scanning"}{" "}
                  <span className="font-medium text-foreground">{s.repoName}</span>
                  {s.score != null && s.status === "COMPLETED" && (
                    <> · Risk score <span className="font-medium text-foreground">{s.score.toFixed(0)}/100</span></>
                  )}
                  <span className="block text-xs">{s.started_at ? new Date(s.started_at).toLocaleString() : "Just now"}</span>
                </p>
              </li>
            ))}
            {stats.recentScans.length === 0 && (
              <li className="text-sm text-muted-foreground">No activity yet.</li>
            )}
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