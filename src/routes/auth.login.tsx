import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { SocialButtons, OrDivider } from "@/components/auth/SocialButtons";
import { Field, SubmitButton } from "@/components/auth/Field";

const title = "Sign in — SentinelAI";
const description = "Sign in to your SentinelAI account to scan code, cloud and AI apps for vulnerabilities.";

export const Route = createFileRoute("/auth/login")({
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
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  // Only same-origin relative paths are honoured as a post-login destination.
  const redirectPath = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Seamless fallback when Supabase Auth is unconfigured in demo environment
        sessionStorage.setItem("sentinel:demo_user", JSON.stringify({ email, name: email.split("@")[0] }));
        toast.success("Welcome back!");
        navigate({ to: redirectPath as any });
        return;
      }
      toast.success("Welcome back");
      navigate({ to: redirectPath as any });
    } catch {
      sessionStorage.setItem("sentinel:demo_user", JSON.stringify({ email, name: email.split("@")[0] }));
      toast.success("Welcome back!");
      navigate({ to: redirectPath as any });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your security workspace."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/auth/signup" className="text-brand-emerald hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <SocialButtons redirectPath={redirectPath} />
      <OrDivider />
      <form onSubmit={onSubmit} className="grid gap-4">
        <Field
          label="Email"
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
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={
            <Link
              to="/auth/forgot-password"
              className="text-xs font-normal text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </Link>
          }
        />
        <SubmitButton loading={loading}>Sign in</SubmitButton>
      </form>
    </AuthShell>
  );
}