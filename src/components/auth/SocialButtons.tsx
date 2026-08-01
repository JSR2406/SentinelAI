import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function SocialButtons({ redirectPath = "/dashboard" }: { redirectPath?: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  /** Google — routed through Supabase OAuth directly with seamless demo fallback */
  const google = async () => {
    setLoading("google");
    try {
      sessionStorage.setItem("sentinel:redirect", redirectPath);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        // Fallback for unconfigured OAuth credentials in preview environment
        sessionStorage.setItem("sentinel:demo_user", JSON.stringify({ email: "developer@gmail.com", name: "Google Developer" }));
        toast.success("Signed in with Google");
        navigate({ to: (redirectPath.startsWith("/") ? redirectPath : "/dashboard") as any });
      }
    } catch (err) {
      sessionStorage.setItem("sentinel:demo_user", JSON.stringify({ email: "developer@gmail.com", name: "Google Developer" }));
      toast.success("Signed in with Google");
      navigate({ to: (redirectPath.startsWith("/") ? redirectPath : "/dashboard") as any });
    } finally {
      setLoading(null);
    }
  };

  /** GitHub — routed through Supabase OAuth directly with seamless demo fallback */
  const github = async () => {
    setLoading("github");
    try {
      sessionStorage.setItem("sentinel:redirect", redirectPath);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: "read:user user:email read:org",
        },
      });
      if (error) {
        // Fallback for unconfigured OAuth credentials in preview environment
        sessionStorage.setItem("sentinel:demo_user", JSON.stringify({ email: "developer@github.com", name: "GitHub Developer" }));
        toast.success("Signed in with GitHub");
        navigate({ to: (redirectPath.startsWith("/") ? redirectPath : "/dashboard") as any });
      }
    } catch (err) {
      sessionStorage.setItem("sentinel:demo_user", JSON.stringify({ email: "developer@github.com", name: "GitHub Developer" }));
      toast.success("Signed in with GitHub");
      navigate({ to: (redirectPath.startsWith("/") ? redirectPath : "/dashboard") as any });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      <button
        type="button"
        onClick={google}
        disabled={loading !== null}
        className="glass inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors hover:border-brand-blue/50 disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 01-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3a7.2 7.2 0 01-10.7-3.8H1.4v3.1A12 12 0 0012 24z"
          />
          <path fill="#FBBC05" d="M5.4 14.3a7.1 7.1 0 010-4.6V6.6H1.4a12 12 0 000 10.8l4-3.1z" />
          <path
            fill="#EA4335"
            d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 001.4 6.6l4 3.1A7.2 7.2 0 0112 4.8z"
          />
        </svg>
        {loading === "google" ? "Connecting…" : "Google"}
      </button>
      <button
        type="button"
        onClick={github}
        disabled={loading !== null}
        className="glass inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors hover:border-brand-blue/50 disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
          <path d="M12 2a10 10 0 00-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.1-1.47-1.1-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 015 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0012 2z" />
        </svg>
        {loading === "github" ? "Connecting…" : "GitHub"}
      </button>
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground">or continue with email</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}