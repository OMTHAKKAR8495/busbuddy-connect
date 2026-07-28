import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMyRole } from "@/hooks/use-role";
import StudentDashboard from "@/components/student-dashboard";
import DriverDashboard from "@/components/driver-dashboard";
import AdminDashboard from "@/components/admin-dashboard";
import ConductorScannerPage from "@/components/conductor-scanner";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppRouter,
});

function AppRouter() {
  const { data, isLoading } = useMyRole();
  const [overrideRole, setOverrideRole] = useState<"student" | "driver" | "admin" | "scanner" | null>(null);

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center font-display text-base font-semibold text-muted-foreground animate-pulse">
        Initializing GSFCU Transit Console…
      </div>
    );
  if (!data) return <Navigate to="/auth" />;

  const u = data as never;
  const activeRole = overrideRole ?? data.role;

  if (activeRole === "scanner" as never)
    return (
      <ConductorScannerPage
        onOverrideRole={setOverrideRole as never}
        overrideRole={overrideRole as never}
      />
    );

  if (activeRole === "admin")
    return (
      <AdminDashboard
        user={{ ...u, role: "admin" }}
        onOverrideRole={setOverrideRole as never}
        overrideRole={overrideRole as never}
      />
    );
  if (activeRole === "driver")
    return (
      <DriverDashboard
        user={{ ...u, role: "driver" }}
        onOverrideRole={setOverrideRole as never}
        overrideRole={overrideRole as never}
      />
    );
  return (
    <StudentDashboard
      user={{ ...u, role: "student" }}
      onOverrideRole={setOverrideRole as never}
      overrideRole={overrideRole as never}
    />
  );
}
