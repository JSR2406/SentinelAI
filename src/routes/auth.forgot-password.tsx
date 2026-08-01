import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field, SubmitButton } from "@/components/auth/Field";

const title = "Reset your password — SentinelAI";
const description = "Request a password reset link for your SentinelAI account.";

export const Route = createFileRoute("/auth/forgot-password")({
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
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll email you a secure link to set a new password."
      footer={
        <Link to="/auth/login" className="text-brand-emerald hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-xl border border-border bg-secondary/40 p-5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Link sent</p>
          <p className="mt-2">
            If an account exists for <span className="text-foreground">{email}</span>, a reset link is
            on its way.
          </p>
        </div>
      ) : (
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
          <SubmitButton loading={loading}>Send reset link</SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}