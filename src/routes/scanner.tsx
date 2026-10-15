import { createFileRoute, redirect } from "@tanstack/react-router";
import ConductorScannerPage from "@/components/conductor-scanner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/scanner")({
  beforeLoad: async () => {
    const { data: auth, error } = await supabase.auth.getUser();
    if (error || !auth.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", auth.user.id);
    if (!roles?.some(({ role }) => ["scanner", "driver", "admin"].includes(role))) throw redirect({ to: "/app" });
    if (roles.some(({ role }) => role === "admin")) {
      const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance?.currentLevel !== "aal2") throw redirect({ to: "/admin" });
    }
  },
  head: () => ({
    meta: [
      { title: "Conductor QR Bus Pass Scanner — GSFCU Transit" },
      { name: "description", content: "Scan and verify GSFC University student bus passes and identity cards." },
    ],
  }),
  component: ScannerRoute,
});

function ScannerRoute() {
  return <ConductorScannerPage />;
}
