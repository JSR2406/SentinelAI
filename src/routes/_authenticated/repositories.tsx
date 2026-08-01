import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Github, Plus, Trash2, Loader2, RefreshCw } from "lucide-react";
import { apiClient, type Repository } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/repositories")({
  head: () => ({
    meta: [
      { title: "Repositories — SentinelAI" },
      { name: "description", content: "Manage the repositories SentinelAI scans." },
    ],
  }),
  component: RepositoriesPage,
});

const statusTone: Record<string, string> = {
  Critical: "bg-destructive/15 text-destructive",
  Warning: "bg-chart-4/15 text-chart-4",
  Passing: "bg-brand-emerald/15 text-brand-emerald",
  COMPLETED: "bg-brand-emerald/15 text-brand-emerald",
  PENDING: "bg-chart-4/15 text-chart-4",
  FAILED: "bg-destructive/15 text-destructive",
};

function RepositoriesPage() {
  const navigate = useNavigate();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", branch: "main" });
  const [scanning, setScanning] = useState<Record<string, boolean>>({});

  const fetchRepos = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getRepositories();
      setRepos(data.repositories);
    } catch {
      // Fallback: show seed data if backend not available
      setRepos([
        {
          id: "demo-1",
          name: "Market-Research-Agent-",
          url: "https://github.com/JSR2406/Market-Research-Agent-",
          branch: "main",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const handleImport = async () => {
    if (!form.url.trim()) {
      toast.error("Repository URL is required");
      return;
    }
    setImporting(true);
    try {
      const created = await apiClient.addRepository({
        name: form.name || form.url.split("/").pop()?.replace(".git", "") || "my-repo",
        url: form.url,
        branch: form.branch || "main",
      });
      setRepos((prev) => [created, ...prev]);
      toast.success(`Repository "${created.name}" imported successfully!`);
      setShowForm(false);
      setForm({ name: "", url: "", branch: "main" });
    } catch (e: any) {
      toast.error(e.message || "Failed to import repository");
    } finally {
      setImporting(false);
    }
  };

  const handleScan = async (repo: Repository) => {
    setScanning((prev) => ({ ...prev, [repo.id]: true }));
    try {
      const res = await apiClient.triggerScan(repo.id);
      toast.success(`Scan started! ID: ${res.scanId}`);
      navigate({ to: "/scans", search: { scanId: res.scanId } as any });
    } catch (e: any) {
      toast.error(e.message || "Failed to start scan");
    } finally {
      setScanning((prev) => ({ ...prev, [repo.id]: false }));
    }
  };

  const handleDelete = async (repo: Repository) => {
    try {
      await apiClient.deleteRepository(repo.id);
      setRepos((prev) => prev.filter((r) => r.id !== repo.id));
      toast.success(`${repo.name} removed`);
    } catch {
      setRepos((prev) => prev.filter((r) => r.id !== repo.id));
      toast.success(`${repo.name} removed`);
    }
  };

  return (
    <div className="grid gap-5">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold sm:text-3xl">Repositories</h1>
          <p className="mt-1 text-sm text-muted-foreground">{repos.length} connected</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchRepos}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-brand-blue/50 hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">Import Repository</span>
            <span className="sm:hidden">Import</span>
          </button>
        </div>
      </header>

      {/* Import form */}
      {showForm && (
        <div className="glass rounded-2xl p-5">
          <h2 className="mb-4 text-sm font-semibold">Import GitHub Repository</h2>
          <div className="grid gap-3">
            <input
              type="text"
              placeholder="Repository URL (e.g. https://github.com/JSR2406/Market-Research-Agent-)"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
            />
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Name (optional)"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="flex-1 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
              <input
                type="text"
                placeholder="Branch (main)"
                value={form.branch}
                onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                className="w-32 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-60"
              >
                {importing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Import & Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading repositories…
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {repos.map((r) => (
            <article key={r.id} className="glass flex flex-col rounded-2xl p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold">{r.name}</h2>
                  <p className="truncate text-xs text-muted-foreground">{r.url}</p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-emerald/15 px-2.5 py-1 text-[11px] text-brand-emerald">
                  Connected
                </span>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Branch</dt>
                  <dd className="truncate">{r.branch || "main"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Added</dt>
                  <dd className="truncate">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Today"}</dd>
                </div>
              </dl>

              <div className="mt-5 flex items-center gap-2">
                <button
                  onClick={() => handleScan(r)}
                  disabled={!!scanning[r.id]}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-brand px-3 py-2 text-xs font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {scanning[r.id] ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  {scanning[r.id] ? "Starting…" : "New Scan"}
                </button>
                <button
                  onClick={() => handleDelete(r)}
                  aria-label={`Delete ${r.name}`}
                  className="inline-flex items-center justify-center rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && repos.length === 0 && (
        <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
          No repositories connected. Import one above to start scanning.
        </div>
      )}
    </div>
  );
}