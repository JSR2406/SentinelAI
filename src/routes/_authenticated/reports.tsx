import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, FileDown } from "lucide-react";
import { toast } from "sonner";
import { issueCategories, severityCounts, type Severity } from "@/lib/dummy-data";

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

function ReportsPage() {
  const [open, setOpen] = useState<string | null>(issueCategories[0]?.category ?? null);

  return (
    <div className="grid gap-5">
      <header className="grid gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold sm:text-3xl">Security report</h1>
          <p className="mt-1 text-sm text-muted-foreground">payments-api · generated 12 minutes ago</p>
        </div>
        <button
          onClick={() => toast.success("Report export queued", { description: "PDF export is UI-only in this demo." })}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:border-brand-blue/50"
        >
          <FileDown className="h-4 w-4" />
          Export PDF
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Critical", severityCounts.critical, "critical"],
            ["High", severityCounts.high, "high"],
            ["Medium", severityCounts.medium, "medium"],
            ["Low", severityCounts.low, "low"],
          ] as const
        ).map(([label, value, sev]) => (
          <div key={label} className="glass rounded-2xl p-4">
            <span className={`rounded-full px-2 py-0.5 text-[11px] ${sevTone[sev]}`}>{label}</span>
            <p className="mt-3 font-display text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3">
        {issueCategories.map((cat) => {
          const isOpen = open === cat.category;
          return (
            <section key={cat.category} className="glass overflow-hidden rounded-2xl">
              <button
                onClick={() => setOpen(isOpen ? null : cat.category)}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 text-left"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{cat.category}</span>
                  <span className="block text-xs text-muted-foreground">{cat.issues.length} findings</span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="border-t border-border">
                  {cat.issues.map((issue) => (
                    <div key={issue.file} className="border-b border-border/60 px-5 py-4 last:border-b-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] capitalize ${sevTone[issue.severity]}`}>
                          {issue.severity}
                        </span>
                        <code className="truncate rounded bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                          {issue.file}
                        </code>
                      </div>
                      <p className="mt-3 text-sm font-medium">{issue.description}</p>
                      <p className="mt-2 rounded-xl border border-brand-emerald/25 bg-brand-emerald/5 p-3 text-xs text-muted-foreground">
                        <span className="font-semibold text-brand-emerald">Suggested fix · </span>
                        {issue.fix}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}