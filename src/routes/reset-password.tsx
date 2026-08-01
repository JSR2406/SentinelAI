import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field, SubmitButton } from "@/components/auth/Field";

const title = "Set a new password — SentinelAI";
const description = "Choose a new password for your SentinelAI account.";

export const Route = createFileRoute("/reset-password")({
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
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  };

  return (
    <AuthShell
      title="New password"
      subtitle="Choose a strong password you haven't used before."
      footer={
        <Link to="/auth/login" className="text-brand-emerald hover:underline">
          Back to sign in
        </Link>
      }
    >
      {!ready ? (
        <div className="rounded-xl border border-border bg-secondary/40 p-5 text-sm text-muted-foreground">
          This reset link is invalid or has expired. Request a new one from the{" "}
          <Link to="/auth/forgot-password" className="text-brand-emerald hover:underline">
            forgot password
          </Link>{" "}
          page.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-4">
          <Field
            label="New password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Field
            label="Confirm password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <SubmitButton loading={loading}>Update password</SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}