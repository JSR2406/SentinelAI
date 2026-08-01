import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SentinelAI" },
      { name: "description", content: "Manage your profile, team, billing and notification preferences." },
    ],
  }),
  component: SettingsPage,
});

const tabs = ["Profile", "Team", "Billing", "Notifications", "API Keys"] as const;
type Tab = (typeof tabs)[number];

function SettingsPage() {
  const [tab, setTab] = useState<Tab>("Profile");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;
      setEmail(user.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, company, job_title")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        setDisplayName(profile.display_name ?? "");
        setCompany(profile.company ?? "");
        setJobTitle(profile.job_title ?? "");
      }
    })();
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      setSaving(false);
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, company, job_title: jobTitle })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error("Could not save profile", { description: error.message });
    else toast.success("Profile updated");
  };

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account and workspace.</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm transition-colors ${
              tab === t
                ? "bg-secondary text-foreground ring-1 ring-brand-blue/30"
                : "text-muted-foreground hover:bg-secondary/60"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Profile" && (
        <form onSubmit={saveProfile} className="glass grid max-w-xl gap-4 rounded-2xl p-6">
          <Labeled label="Email">
            <input value={email} disabled className="input-base opacity-60" />
          </Labeled>
          <Labeled label="Display name">
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input-base" placeholder="Alex Rivera" />
          </Labeled>
          <Labeled label="Company">
            <input value={company} onChange={(e) => setCompany(e.target.value)} className="input-base" placeholder="Sentinel Labs" />
          </Labeled>
          <Labeled label="Job title">
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="input-base" placeholder="Security Engineer" />
          </Labeled>
          <button
            type="submit"
            disabled={saving}
            className="justify-self-start rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}

      {tab === "Team" && (
        <div className="glass rounded-2xl p-6">
          <ul className="divide-y divide-border">
            {[
              ["Alex Rivera", "Owner", "alex@sentinel.dev"],
              ["Maya Ortiz", "Admin", "maya@sentinel.dev"],
              ["Dev Raman", "Member", "dev@sentinel.dev"],
            ].map(([name, role, mail]) => (
              <li key={mail} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{name}</p>
                  <p className="truncate text-xs text-muted-foreground">{mail}</p>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">{role}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "Billing" && (
        <div className="glass grid gap-4 rounded-2xl p-6">
          <div>
            <p className="text-sm text-muted-foreground">Current plan</p>
            <p className="font-display text-2xl font-semibold">Team · $79/mo</p>
            <p className="mt-1 text-xs text-muted-foreground">Renews on 12 April 2026 · 6 of 25 repositories used</p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-[24%] rounded-full bg-gradient-brand" />
          </div>
          <button
            onClick={() => toast("Billing is UI-only in this demo")}
            className="justify-self-start rounded-xl border border-border px-5 py-2.5 text-sm font-medium hover:border-brand-blue/50"
          >
            Manage subscription
          </button>
        </div>
      )}

      {tab === "Notifications" && (
        <div className="glass grid gap-4 rounded-2xl p-6">
          {["Critical findings", "Weekly digest", "Scan failures", "Product updates"].map((n, i) => (
            <label key={n} className="flex items-center justify-between gap-4 text-sm">
              <span>{n}</span>
              <input type="checkbox" defaultChecked={i < 3} className="h-4 w-4 accent-[oklch(0.74_0.16_165)]" />
            </label>
          ))}
        </div>
      )}

      {tab === "API Keys" && (
        <div className="glass grid gap-4 rounded-2xl p-6">
          {[
            ["Production", "sk_live_••••••••••••4f8a"],
            ["CI pipeline", "sk_ci_••••••••••••91bc"],
          ].map(([name, key]) => (
            <div key={name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{name}</p>
                <code className="truncate font-mono text-xs text-muted-foreground">{key}</code>
              </div>
              <button
                onClick={() => toast.success("Key revoked")}
                className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-destructive/50 hover:text-destructive"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}