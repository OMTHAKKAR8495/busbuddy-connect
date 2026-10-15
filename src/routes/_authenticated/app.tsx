import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMyRole } from "@/hooks/use-role";
import StudentDashboard from "@/components/student-dashboard";
import DriverDashboard from "@/components/driver-dashboard";
import ConductorScannerPage from "@/components/conductor-scanner";

export const Route = createFileRoute("/_authenticated/app")({
  beforeLoad: async ({ context }) => {
    if (!context.user) throw redirect({ to: "/auth" });
  },
  component: AppRouter,
});

function AppRouter() {
  const { data, isLoading, isError } = useMyRole();
  if (isLoading) return <main className="p-8" aria-live="polite">Loading account…</main>;
  if (isError || !data) return <main className="p-8">Unable to load account permissions. Please sign in again.</main>;
  if (data.role === "admin") return <main className="p-8">Administrators must use the MFA protected <a className="underline" href="/admin">admin portal</a>.</main>;
  if (data.role === "scanner") return <ConductorScannerPage />;
  if (data.role === "driver") return <DriverDashboard user={{ userId: data.userId, role: "driver", profile: { full_name: data.profile.full_name } }} />;
  return <StudentDashboard user={{ userId: data.userId, role: "student", profile: data.profile }} />;
}
