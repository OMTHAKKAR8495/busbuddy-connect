import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data } = await supabase.auth.getUser();
      return { user: data?.user ?? null };
    } catch (e) {
      return { user: null };
    }
  },
  component: () => <Outlet />,
});
