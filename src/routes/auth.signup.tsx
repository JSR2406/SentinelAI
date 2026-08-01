import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { SocialButtons, OrDivider } from "@/components/auth/SocialButtons";
import { Field, SubmitButton } from "@/components/auth/Field";

const title = "Create your account — SentinelAI";
const description = "Start scanning your repositories, cloud and AI apps with SentinelAI in minutes.";

export const Route = createFileRoute("/auth/signup")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search['next'] === "string" ? search['next'] : undefined,
  }),
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
  component: SignupPage,
});

function SignupPage() {
  const { next } = Route.useSearch();
  const redirectPath =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      setSent(true);
      return;
    }
    window.location.href = redirectPath;
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Free forever for up to 3 repositories."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/auth/login"
            search={next ? { next } : {}}
            className="text-brand-emerald hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="rounded-xl border border-border bg-secondary/40 p-5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Check your email</p>
          <p className="mt-2">
            We sent a confirmation link to <span className="text-foreground">{email}</span>. Click it
            to activate your workspace.
          </p>
        </div>
      ) : (
        <>
          <SocialButtons redirectPath={redirectPath} />
          <OrDivider />
          <form onSubmit={onSubmit} className="grid gap-4">
            <Field
              label="Full name"
              required
              autoComplete="name"
              placeholder="Ada Lovelace"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Field
              label="Work email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Field
              label="Password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <SubmitButton loading={loading}>Create account</SubmitButton>
          </form>
        </>
      )}
    </AuthShell>
  );
}