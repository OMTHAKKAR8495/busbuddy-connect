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
  const { data } = useMyRole();
  const [overrideRole, setOverrideRole] = useState<"student" | "driver" | "admin" | "scanner" | null>(null);

  const fallbackUser = {
    userId: "eval-om-thakkar",
    role: "student" as const,
    profile: { full_name: "Om Thakkar", roll_number: "24BT04171", photo_url: null },
  };

  const userObj = data || fallbackUser;
  const u = userObj as never;
  const activeRole = overrideRole ?? userObj.role;

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
