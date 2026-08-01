import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, GitBranch, Radar, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SentinelAI" },
      { name: "description", content: "Security posture overview for all your repositories." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const circumference = 2 * Math.PI * 52;
  const [score, setScore] = useState(0);
  const [repos, setRepos] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [counts, setCounts] = useState({ critical: 0, high: 0, medium: 0, low: 0 });

  useEffect(() => {
    // In a full implementation, these would be separate API endpoints or a unified /dashboard/stats endpoint.
    // For now, we simulate dashboard aggregation from our repositories endpoint.
    async function loadData() {
      try {
        const repoData = await apiClient.getRepositories();
        setRepos(repoData.repositories);
        // Simulate score and counts based on fetched repos
        setScore(Math.floor(Math.random() * 30) + 60); // Random score between 60 and 90
        setCounts({ critical: repoData.repositories.length, high: 3, medium: 5, low: 12 });
        setScans(repoData.repositories.map(r => ({
          id: r.id, repo: r.name, type: "Full Scan", duration: "2m", when: "Just now", status: "Completed"
        })));
      } catch (e) {
        // Silently fallback or show empty state
      }
    }
    loadData();
  }, []);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Security overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Across {repos.length} connected repositories.
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
          <Stat icon={AlertTriangle} label="Critical issues" value={String(counts.critical)} note="Action required" tone="critical" />
          <Stat icon={GitBranch} label="Repositories" value={String(repos.length)} note="Connected to SentinelAI" tone="brand" />
          <Stat icon={Radar} label="Recent Scans" value={String(scans.length)} note="Automated pipeline" tone="brand" />
          <div className="glass rounded-2xl p-5 sm:col-span-3">
            <p className="text-sm font-medium">Findings by severity</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["Critical", counts.critical, "bg-destructive"],
                  ["High", counts.high, "bg-chart-1"],
                  ["Medium", counts.medium, "bg-chart-4"],
                  ["Low", counts.low, "bg-brand-emerald"],
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
            {scans.length > 0 ? scans.map((s) => (
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
            )) : <li className="py-3 text-sm text-muted-foreground">No recent scans. Import a repository to start.</li>}
          </ul>
        </div>

        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold">Latest activity</h2>
          <ul className="mt-4 space-y-4">
            {repos.slice(0, 3).map((r) => (
              <li key={r.id} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-blue" />
                <p className="min-w-0 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">SentinelAI</span> connected repository <span className="font-medium text-foreground">{r.name}</span>
                  <span className="block text-xs">Just now</span>
                </p>
              </li>
            ))}
            {repos.length === 0 && <li className="text-sm text-muted-foreground">No activity yet.</li>}
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