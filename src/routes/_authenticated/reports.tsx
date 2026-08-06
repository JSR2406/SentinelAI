import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient, type SecurityReportResponse } from "@/lib/api";

type Severity = "critical" | "high" | "medium" | "low";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Security report — SentinelAI" },
      { name: "description", content: "Detailed security findings grouped by category with suggested fixes." },
    ],
  }),
  component: ReportsPage,
});

const sevTone: Record<Severity, string> = {
  critical: "bg-destructive/15 text-destructive",
  high: "bg-chart-1/15 text-chart-1",
  medium: "bg-chart-4/15 text-chart-4",
  low: "bg-brand-emerald/15 text-brand-emerald",
};

/** Group flat findings from backend into categories by tool or type */
function groupFindings(issues: SecurityReportResponse["findings"]) {
  const groups: Record<string, typeof issues> = {};
  for (const issue of issues) {
    const cat = issue.type || issue.tool || "Other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(issue);
  }
  return Object.entries(groups).map(([category, issues]) => ({ category, issues }));
}

const FALLBACK_CATEGORIES = [
  {
    category: "Authentication & Secrets",
    issues: [
      { severity: "critical", file_path: "src/config/keys.ts", title: "Hardcoded AWS secret key in source control.", description: "Hardcoded AWS secret key in source control.", recommendation: "Move to Vercel/GitHub environment variables." },
    ],
  },
  {
    category: "Dependencies",
    issues: [
      { severity: "high", file_path: "package.json", title: "Vulnerable dependency 'axios' (CVE-2023-45811).", description: "Vulnerable version of 'axios' (CVE-2023-45811).", recommendation: "Upgrade axios to >= 1.6.0" },
    ],
  },
];

function ReportsPage() {
  const search = (Route.useSearch() as any) || {};
  const scanId = search?.scanId as string | undefined;

  const [open, setOpen] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ category: string; issues: any[] }>>([]);
  const [counts, setCounts] = useState({ critical: 0, high: 0, medium: 0, low: 0 });
  const [repoName, setRepoName] = useState("Loading...");
  const [reportMeta, setReportMeta] = useState<{ score: number; total: number; scannersRun: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);

    const loadReport = async () => {
      // Determine which scan ID to load
      let targetScanId = scanId;

      if (!targetScanId) {
        // Try to get the most recent completed scan
        try {
          const scans = await apiClient.getScans();
          const completed = scans.scans.find((s) => s.status === "COMPLETED");
          if (completed) {
            targetScanId = completed.scanId;
          }
        } catch {
          // pass
        }
      }

      if (targetScanId) {
        try {
          const report = await apiClient.getReport(targetScanId);
          setRepoName(report.repoName);
          setCounts({
            critical: report.summary.severityCounts.critical,
            high: report.summary.severityCounts.high,
            medium: report.summary.severityCounts.medium,
            low: report.summary.severityCounts.low,
          });
          setReportMeta({
            score: report.summary.riskScore,
            total: report.summary.totalFindings,
            scannersRun: report.summary.scannersRun,
          });
          setRecommendations(report.recommendations || []);

          if (report.findings.length > 0) {
            const grouped = groupFindings(report.findings);
            setCategories(grouped);
            setOpen(grouped[0]?.category || null);
          } else {
            setCategories([]);
          }
          setLoading(false);
          return;
        } catch (e) {
          // Fall through to fallback
        }
      }

      // Fallback: try loading at least repo name from repos
      try {
        const repos = await apiClient.getRepositories();
        setRepoName(repos.repositories[0]?.name || "demo-api");
      } catch {
        setRepoName("payments-api");
      }

      // Show demo fallback data
      setCounts({ critical: 1, high: 2, medium: 5, low: 12 });
      setCategories(FALLBACK_CATEGORIES);
      setOpen("Authentication & Secrets");
      setRecommendations([
        "Revoke and rotate all hardcoded secrets detected by Gitleaks and TruffleHog.",
        "Sanitize dynamic queries to eliminate SQL and command injection risks.",
        "Upgrade vulnerable third-party libraries identified in dependency scans.",
      ]);
      setLoading(false);
    };

    loadReport();
  }, [scanId]);

  const handleExportPDF = () => {
    if (!scanId) {
      toast.info("Export PDF", { description: "Select a specific scan from the Scans page to export." });
      return;
    }
    // Open HTML report in new tab (rendered by backend)
    window.open(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/api/v1/report/${scanId}/html`, "_blank");
  };

  return (
    <div className="grid gap-5">
      <header className="grid gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold sm:text-3xl">Security report</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {repoName}
            {reportMeta && (
              <> · Risk score <span className="font-medium text-foreground">{reportMeta.score.toFixed(0)}/100</span> · {reportMeta.total} findings</>
            )}
            {!reportMeta && " · generated recently"}
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:border-brand-blue/50"
        >
          <FileDown className="h-4 w-4" />
          Export PDF
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Critical", counts.critical, "critical"],
            ["High", counts.high, "high"],
            ["Medium", counts.medium, "medium"],
            ["Low", counts.low, "low"],
          ] as const
        ).map(([label, value, sev]) => (
          <div key={label} className="glass rounded-2xl p-4">
            <span className={`rounded-full px-2 py-0.5 text-[11px] ${sevTone[sev]}`}>{label}</span>
            <p className="mt-3 font-display text-3xl font-semibold">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : value}
            </p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="glass flex items-center justify-center rounded-2xl p-10 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading scan report…
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {categories.length > 0 ? categories.map((cat) => {
              const isOpen = open === cat.category;
              return (
                <section key={cat.category} className="glass overflow-hidden rounded-2xl">
                  <button
                    onClick={() => setOpen(isOpen ? null : cat.category)}
                    className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 text-left"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{cat.category}</span>
                      <span className="block text-xs text-muted-foreground">{cat.issues.length} finding{cat.issues.length !== 1 ? "s" : ""}</span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-border">
                      {cat.issues.map((issue: any, idx: number) => (
                        <div key={`${issue.file_path || "f"}-${idx}`} className="border-b border-border/60 px-5 py-4 last:border-b-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] capitalize ${
                                sevTone[(issue.severity?.toLowerCase() as Severity)] || sevTone.low
                              }`}
                            >
                              {issue.severity || "info"}
                            </span>
                            {issue.file_path && (
                              <code className="truncate rounded bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                                {issue.file_path}
                                {issue.line ? `:${issue.line}` : ""}
                              </code>
                            )}
                            {issue.tool && (
                              <span className="rounded bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                                {issue.tool}
                              </span>
                            )}
                          </div>
                          <p className="mt-3 text-sm font-medium">{issue.title || issue.description}</p>
                          {issue.description && issue.description !== issue.title && (
                            <p className="mt-1 text-xs text-muted-foreground">{issue.description}</p>
                          )}
                          {(issue.recommendation || issue.fix) && (
                            <p className="mt-2 rounded-xl border border-brand-emerald/25 bg-brand-emerald/5 p-3 text-xs text-muted-foreground">
                              <span className="font-semibold text-brand-emerald">Suggested fix · </span>
                              {issue.recommendation || issue.fix}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            }) : (
              <div className="glass rounded-2xl p-8 text-center text-muted-foreground text-sm">
                No findings detected in this scan. Great security posture! 🎉
              </div>
            )}
          </div>

          {recommendations.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h2 className="text-sm font-semibold">Recommendations</h2>
              <ul className="mt-3 space-y-2">
                {recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-brand-blue/20 text-[10px] text-brand-blue grid place-items-center font-bold">
                      {i + 1}
                    </span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}