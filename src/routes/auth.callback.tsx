import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: "Authenticating — SentinelAI" }],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Exchange the OAuth code for a session.
        // Supabase automatically parses the URL hash / query parameters.
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setStatus("error");
          setMessage(error.message);
          setTimeout(() => navigate({ to: "/auth/login" }), 3000);
          return;
        }

        if (data.session) {
          setStatus("success");
          setMessage("Signed in! Redirecting…");
          // Honor the saved redirect path (set before OAuth redirect)
          const savedRedirect = sessionStorage.getItem("sentinel:redirect") || "/dashboard";
          sessionStorage.removeItem("sentinel:redirect");
          setTimeout(() => {
            if (savedRedirect === "/dashboard" || savedRedirect.startsWith("/")) {
              navigate({ to: savedRedirect as any });
            } else {
              navigate({ to: "/dashboard" });
            }
          }, 500);
          return;
        }

        // No session yet — exchange the code explicitly
        const hashParams = new URLSearchParams(window.location.hash.replace("#", "?"));
        const code = new URLSearchParams(window.location.search).get("code");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setStatus("error");
            setMessage(exchangeError.message);
            setTimeout(() => navigate({ to: "/auth/login" }), 3000);
          } else {
            setStatus("success");
            setMessage("Signed in! Redirecting…");
            const savedRedirect = sessionStorage.getItem("sentinel:redirect") || "/dashboard";
            sessionStorage.removeItem("sentinel:redirect");
            setTimeout(() => navigate({ to: savedRedirect as any }), 500);
          }
          return;
        }

        // If access_token is in hash (implicit flow)
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken || "" });
          setStatus("success");
          setMessage("Signed in! Redirecting…");
          const savedRedirect = sessionStorage.getItem("sentinel:redirect") || "/dashboard";
          sessionStorage.removeItem("sentinel:redirect");
          setTimeout(() => navigate({ to: savedRedirect as any }), 500);
          return;
        }

        // Fallback — send to login
        setStatus("error");
        setMessage("Authentication failed. Redirecting to login…");
        setTimeout(() => navigate({ to: "/auth/login" }), 2000);
      } catch (err) {
        setStatus("error");
        setMessage("An unexpected error occurred.");
        setTimeout(() => navigate({ to: "/auth/login" }), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="glass max-w-sm rounded-2xl p-8 text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-emerald border-t-transparent" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        )}
        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <span className="text-4xl">✅</span>
            <p className="text-sm font-medium text-brand-emerald">{message}</p>
          </div>
        )}
        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <span className="text-4xl">❌</span>
            <p className="text-sm text-destructive">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
