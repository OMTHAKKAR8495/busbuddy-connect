import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMyRole } from "@/hooks/use-role";
import StudentDashboard from "@/components/student-dashboard";
import DriverDashboard from "@/components/driver-dashboard";
import ConductorScannerPage from "@/components/conductor-scanner";

// NOTE: AdminDashboard is intentionally NOT imported here.
// Admin access is exclusively through /admin URL with passcode authentication.
// Students cannot reach AdminDashboard via this route under any circumstances.

export const Route = createFileRoute("/_authenticated/app")({
  component: AppRouter,
});

function AppRouter() {
  const { data } = useMyRole();

  // ⛔ SECURITY: Override role is restricted — "admin" override is completely blocked.
  // Students and drivers can only switch between "student", "driver", and "scanner" views.
  // Admin access is exclusively via /admin URL with passcode.
  const [overrideRole, setOverrideRole] = useState<"student" | "driver" | "scanner" | null>(null);

  const fallbackUser = {
    userId: "eval-om-thakkar",
    role: "student" as const,
    profile: { full_name: "Om Thakkar", roll_number: "24BT04171", photo_url: null },
  };

  const userObj = data || fallbackUser;
  const u = userObj as never;

  // ⛔ SECURITY GATE: Intercept any attempt to set admin role via override
  const handleSetOverrideRole = (role: "student" | "driver" | "admin" | "scanner" | null) => {
    if (role === "admin") {
      // Silently redirect to /admin passcode gate instead of granting access inline
      window.location.href = "/admin";
      return;
    }
    setOverrideRole(role as "student" | "driver" | "scanner" | null);
  };

  // Determine effective role — admin override is always blocked here
  const dbRole = userObj.role?.toLowerCase() ?? "student";
  const activeRole = overrideRole ?? (dbRole === "admin" ? "student" : dbRole); // DB admins viewing /app see student view

  if (activeRole === "scanner")
    return (
      <ConductorScannerPage
        onOverrideRole={handleSetOverrideRole as never}
        overrideRole={overrideRole as never}
      />
    );

  if (activeRole === "driver")
    return (
      <DriverDashboard
        user={{ ...u, role: "driver" }}
        onOverrideRole={handleSetOverrideRole as never}
        overrideRole={overrideRole as never}
      />
    );

  // ⛔ Default: ALL users on /app see Student Dashboard — never Admin
  return (
    <StudentDashboard
      user={{ ...u, role: "student" }}
      onOverrideRole={handleSetOverrideRole as never}
      overrideRole={overrideRole as never}
    />
  );
}
