import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, Loader2, FileText } from "lucide-react";
import { apiClient, type ScanStatusResponse, type ScanListItem } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/scans")({
  head: () => ({
    meta: [
      { title: "Scan progress — SentinelAI" },
      { name: "description", content: "Watch a live SentinelAI security scan progress step by step." },
    ],
  }),
  component: ScansPage,
});

const steps = [
  "Repository Cloned",
  "Scanning Secrets",
  "Scanning Dependencies",
  "Scanning Containers",
  "AI Analysis",
  "Building Attack Graph",
  "Generating Report",
];

const statusToStep: Record<string, number> = {
  PENDING: 0,
  CLONING: 0,
  SCANNING: 2,
  PROCESSING: 3,
  AI_ANALYSIS: 4,
  GRAPHING: 5,
  COMPLETED: 7,
  FAILED: 7,
};

const sevBadge = (status: string) => {
  if (status === "COMPLETED") return "bg-brand-emerald/15 text-brand-emerald";
  if (status === "FAILED") return "bg-destructive/15 text-destructive";
  return "bg-chart-4/15 text-chart-4";
};

function ScansPage() {
  // Check if we got a scanId from navigation
  const search = (Route.useSearch() as any) || {};
  const scanId = search?.scanId as string | undefined;

  const [scanStatus, setScanStatus] = useState<ScanStatusResponse | null>(null);
  const [demoProgress, setDemoProgress] = useState(0);
  const [history, setHistory] = useState<ScanListItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load real scan history
  useEffect(() => {
    setHistoryLoading(true);
    apiClient
      .getScans()
      .then((res) => setHistory(res.scans))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [scanId]);

  // Poll real scan status if we have a scanId
  useEffect(() => {
    if (!scanId) return;
    const poll = async () => {
      try {
        const status = await apiClient.getScanStatus(scanId);
        setScanStatus(status);
        if (status.status === "COMPLETED" || status.status === "FAILED") {
          if (pollRef.current) clearInterval(pollRef.current);
          // Refresh history after scan completes
          apiClient.getScans().then((res) => setHistory(res.scans)).catch(() => {});
        }
      } catch {
        // backend unreachable
      }
    };
    poll();
    pollRef.current = setInterval(poll, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [scanId]);

  // Demo progress animation (when no real scan)
  useEffect(() => {
    if (scanId) return;
    const timer = setInterval(() => {
      setDemoProgress((p) => (p >= 100 ? 0 : p + 1));
    }, 120);
    return () => clearInterval(timer);
  }, [scanId]);

  // Compute progress from real scan status or demo
  const progress = scanStatus
    ? Math.min(100, ((statusToStep[scanStatus.status] ?? 0) / steps.length) * 100)
    : demoProgress;

  const activeStep = Math.min(steps.length - 1, Math.floor((progress / 100) * steps.length));
  const remaining = Math.max(0, Math.round(((100 - progress) / 100) * 84));

  const repoLabel = scanStatus ? `Scan ${scanId?.slice(0, 8)}…` : "payments-api";
  const branchLabel = scanStatus ? `Status: ${scanStatus.status}` : "main · full security scan";

  // Find the scan in history to get the repo name
  const activeScanHistory = scanId ? history.find((s) => s.scanId === scanId) : null;
  const displayRepoLabel = activeScanHistory?.repoName || repoLabel;

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Scanning {displayRepoLabel}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{branchLabel}</p>
      </header>

      <div className="glass glow rounded-2xl p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div className="min-w-0">
            <p className="font-display text-4xl font-semibold">{Math.round(progress)}%</p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {scanStatus?.status === "COMPLETED"
                ? `Complete — Risk Score: ${scanStatus.score?.toFixed(0)}/100`
                : `${steps[activeStep]}…`}
            </p>
          </div>
          <p className="shrink-0 text-right text-xs text-muted-foreground">
            {scanStatus?.status === "COMPLETED" ? "Scan complete" : `Est. ${remaining}s remaining`}
          </p>
        </div>
        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-brand transition-[width] duration-150 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <ol className="mt-8 grid gap-3">
          {steps.map((step, i) => {
            const done = i < activeStep;
            const current = i === activeStep;
            return (
              <li
                key={step}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                  current
                    ? "border-brand-blue/40 bg-secondary/60 text-foreground"
                    : done
                      ? "border-border text-muted-foreground"
                      : "border-border/60 text-muted-foreground/70"
                }`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                    done ? "bg-brand-emerald/20 text-brand-emerald" : current ? "bg-brand-blue/20 text-brand-blue" : "bg-secondary"
                  }`}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : current ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span className="text-[10px]">{i + 1}</span>
                  )}
                </span>
                <span className="truncate">{step}</span>
              </li>
            );
          })}
        </ol>

        {scanStatus?.status === "COMPLETED" && scanId && (
          <div className="mt-4 flex justify-end">
            <Link
              to="/reports"
              search={{ scanId } as any}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              <FileText className="h-4 w-4" />
              View Full Report
            </Link>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-5">
        <h2 className="text-sm font-semibold">Scan history</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="pb-3 font-medium">Repository</th>
                <th className="pb-3 font-medium">Findings</th>
                <th className="pb-3 font-medium">Critical</th>
                <th className="pb-3 font-medium">Score</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Live scan entry at top */}
              {scanStatus && (
                <tr>
                  <td className="py-3">{displayRepoLabel}</td>
                  <td className="py-3 text-muted-foreground">—</td>
                  <td className="py-3 text-muted-foreground">—</td>
                  <td className="py-3 text-muted-foreground">
                    {scanStatus.status === "COMPLETED" ? `${scanStatus.score?.toFixed(0)}/100` : "—"}
                  </td>
                  <td className="py-3 text-muted-foreground">Live</td>
                  <td className="py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] ${sevBadge(scanStatus.status)}`}>
                      {scanStatus.status}
                    </span>
                  </td>
                  <td className="py-3">
                    {scanStatus.status === "COMPLETED" && (
                      <Link
                        to="/reports"
                        search={{ scanId } as any}
                        className="text-xs text-brand-emerald hover:underline"
                      >
                        View
                      </Link>
                    )}
                  </td>
                </tr>
              )}
              {historyLoading ? (
                <tr>
                  <td colSpan={7} className="py-5 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  </td>
                </tr>
              ) : history.length > 0 ? (
                history
                  .filter((s) => s.scanId !== scanId) // don't duplicate the live scan
                  .map((s) => (
                    <tr key={s.scanId}>
                      <td className="py-3">{s.repoName}</td>
                      <td className="py-3 text-muted-foreground">{s.findingsCount}</td>
                      <td className="py-3 text-muted-foreground">{s.criticalCount}</td>
                      <td className="py-3 text-muted-foreground">
                        {s.score != null ? `${s.score.toFixed(0)}/100` : "—"}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {s.started_at ? new Date(s.started_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] ${sevBadge(s.status)}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {s.status === "COMPLETED" && (
                          <Link
                            to="/reports"
                            search={{ scanId: s.scanId } as any}
                            className="text-xs text-brand-emerald hover:underline"
                          >
                            View
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-5 text-center text-muted-foreground">
                    No historical scans available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}