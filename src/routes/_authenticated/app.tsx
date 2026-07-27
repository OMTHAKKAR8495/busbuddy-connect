import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMyRole } from "@/hooks/use-role";
import StudentDashboard from "@/components/student-dashboard";
import DriverDashboard from "@/components/driver-dashboard";
import AdminDashboard from "@/components/admin-dashboard";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppRouter,
});

function AppRouter() {
  const { data, isLoading } = useMyRole();
  if (isLoading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  if (!data) return <Navigate to="/auth" />;
  if (data.role === "admin") return <AdminDashboard user={data} />;
  if (data.role === "driver") return <DriverDashboard user={data} />;
  return <StudentDashboard user={data} />;
}
