import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Check for our frontend demo user fallback first
    if (typeof window !== "undefined") {
      const demoUser = sessionStorage.getItem("sentinel:demo_user");
      if (demoUser) {
        return { user: JSON.parse(demoUser) };
      }
    }
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user)
      throw redirect({ to: "/auth/login", search: { next: location.href } });
    return { user: data.user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});