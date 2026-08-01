import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Bot, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const title = "Profile & connections — SentinelAI";
const description =
  "Manage your SentinelAI profile details and review the AI agents you granted OAuth access to your account.";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

type Grant = {
  id: string;
  client: string;
  scopes: string[];
  granted: string;
  lastUsed: string;
};

const initialGrants: Grant[] = [
  {
    id: "claude",
    client: "Claude Desktop",
    scopes: ["Basic profile", "Email address", "SentinelAI tools"],
    granted: "12 Mar 2026",
    lastUsed: "4 minutes ago",
  },
  {
    id: "chatgpt",
    client: "ChatGPT Connectors",
    scopes: ["Basic profile", "SentinelAI tools"],
    granted: "28 Feb 2026",
    lastUsed: "Yesterday",
  },
];

function ProfilePage() {
  const [email, setEmail] = useState("");
  const [provider, setProvider] = useState("email");
  const [displayName, setDisplayName] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [grants, setGrants] = useState<Grant[]>(initialGrants);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;
      setEmail(user.email ?? "");
      setProvider((user.app_metadata?.['provider'] as string) ?? "email");
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

  const revoke = (grant: Grant) => {
    setGrants((prev) => prev.filter((g) => g.id !== grant.id));
    toast.success(`Access revoked for ${grant.client}`);
  };

  const initials =
    (displayName || email || "S")
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "S";

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account details and the agents allowed to act as you.
        </p>
      </header>

      <div className="glass flex flex-wrap items-center gap-4 rounded-2xl p-6">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-brand font-display text-lg font-semibold text-accent-foreground">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{displayName || "Unnamed user"}</p>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </div>
        <span className="ml-auto rounded-full bg-secondary px-3 py-1 text-[11px] capitalize text-muted-foreground">
          Signed in with {provider}
        </span>
      </div>

      <form onSubmit={saveProfile} className="glass grid max-w-xl gap-4 rounded-2xl p-6">
        <h2 className="text-sm font-semibold">Profile settings</h2>
        <Labeled label="Email">
          <input value={email} disabled className="input-base opacity-60" />
        </Labeled>
        <Labeled label="Display name">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input-base"
            placeholder="Alex Rivera"
          />
        </Labeled>
        <Labeled label="Company">
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="input-base"
            placeholder="Sentinel Labs"
          />
        </Labeled>
        <Labeled label="Job title">
          <input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="input-base"
            placeholder="Security Engineer"
          />
        </Labeled>
        <button
          type="submit"
          disabled={saving}
          className="justify-self-start rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      <section className="glass grid gap-4 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-emerald" />
          <div>
            <h2 className="text-sm font-semibold">Agent access &amp; OAuth consent</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These clients completed the SentinelAI consent screen and can call your enabled tools
              while signed in as you. Revoking removes their access immediately.
            </p>
          </div>
        </div>

        {grants.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No agents currently have access to your account.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {grants.map((g) => (
              <li key={g.id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Bot className="h-4 w-4 text-brand-blue" />
                    {g.client}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Granted {g.granted} · Last used {g.lastUsed}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {g.scopes.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => revoke(g)}
                  className="inline-flex items-center justify-center gap-2 justify-self-start rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-destructive/60 hover:text-destructive sm:justify-self-end"
                >
                  <Trash2 className="h-4 w-4" />
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-muted-foreground">
          Connecting a new agent starts from your AI client and finishes on the SentinelAI consent
          screen. Billing, team and notification preferences live in{" "}
          <Link to="/settings" className="text-brand-emerald hover:underline">
            Settings
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
