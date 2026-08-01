import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { apiClient, type ScanStatusResponse } from "@/lib/api";
import { recentScans } from "@/lib/dummy-data";

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

function ScansPage() {
  // Check if we got a scanId from navigation
  const search = (Route.useSearch() as any) || {};
  const scanId = search?.scanId as string | undefined;

  const [scanStatus, setScanStatus] = useState<ScanStatusResponse | null>(null);
  const [demoProgress, setDemoProgress] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll real scan status if we have a scanId
  useEffect(() => {
    if (!scanId) return;
    const poll = async () => {
      try {
        const status = await apiClient.getScanStatus(scanId);
        setScanStatus(status);
        if (status.status === "COMPLETED" || status.status === "FAILED") {
          if (pollRef.current) clearInterval(pollRef.current);
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

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Scanning {repoLabel}</h1>
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
      </div>

      <div className="glass rounded-2xl p-5">
        <h2 className="text-sm font-semibold">Scan history</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="pb-3 font-medium">Repository</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Findings</th>
                <th className="pb-3 font-medium">Duration</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Live scan entry at top */}
              {scanStatus && (
                <tr>
                  <td className="py-3">{repoLabel}</td>
                  <td className="py-3 text-muted-foreground">Full Security Scan</td>
                  <td className="py-3 text-muted-foreground">—</td>
                  <td className="py-3 text-muted-foreground">Live</td>
                  <td className="py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] ${
                      scanStatus.status === "COMPLETED"
                        ? "bg-brand-emerald/15 text-brand-emerald"
                        : scanStatus.status === "FAILED"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-chart-4/15 text-chart-4"
                    }`}>
                      {scanStatus.status}
                    </span>
                  </td>
                </tr>
              )}
              {recentScans.map((s) => (
                <tr key={s.id}>
                  <td className="py-3">{s.repo}</td>
                  <td className="py-3 text-muted-foreground">{s.type}</td>
                  <td className="py-3 text-muted-foreground">{s.findings}</td>
                  <td className="py-3 text-muted-foreground">{s.duration}</td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] ${
                        s.status === "Failed"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-brand-emerald/15 text-brand-emerald"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}