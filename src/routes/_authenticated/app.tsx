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
  // Initialize override role from demo selection if present
  const [overrideRole, setOverrideRole] = useState<"student" | "driver" | "scanner" | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("gsfcu_demo_role");
        if (saved === "driver" || saved === "scanner" || saved === "student") {
          return saved;
        }
      } catch (e) {}
    }
    return null;
  });

  // Read active driver profile or newly registered user profile
  let activeDriverPass: any = null;
  let activeRegisteredUser: any = null;
  if (typeof window !== "undefined") {
    try {
      const storedDriver = localStorage.getItem("gsfcu_active_driver_profile");
      if (storedDriver) activeDriverPass = JSON.parse(storedDriver);
      const storedUser = localStorage.getItem("gsfcu_active_user");
      if (storedUser) activeRegisteredUser = JSON.parse(storedUser);
    } catch (e) {}
  }

  const fallbackUser = {
    userId: overrideRole === "driver" 
      ? (activeDriverPass?.id || "eval-driver-ramesh") 
      : (activeRegisteredUser?.userId || "eval-om-thakkar"),
    role: (overrideRole === "driver" ? "driver" : (overrideRole || activeRegisteredUser?.role || "student")) as const,
    profile: {
      full_name: overrideRole === "driver" 
        ? (activeDriverPass?.driver_name || "Ramesh Patel") 
        : (activeRegisteredUser?.profile?.full_name || "Om Thakkar"),
      roll_number: overrideRole === "driver" 
        ? (activeDriverPass?.employee_id || "DRV-101") 
        : (activeRegisteredUser?.profile?.roll_number || "24BT04171"),
      photo_url: overrideRole === "driver" ? (activeDriverPass?.photo_url || null) : null,
    },
  };

  const userObj = activeRegisteredUser || (overrideRole === "driver" && activeDriverPass ? fallbackUser : (data || fallbackUser));
  const u = userObj as { userId: string; profile: { full_name: string; roll_number: string | null; photo_url: string | null } };

  // ⛔ SECURITY GATE: Intercept any attempt to set admin role via override
  const handleSetOverrideRole = (role: "student" | "driver" | "admin" | "scanner" | null) => {
    if (role === "admin") {
      // Silently redirect to /admin passcode gate instead of granting access inline
      window.location.href = "/admin";
      return;
    }
    try {
      if (role) {
        localStorage.setItem("gsfcu_demo_role", role);
      } else {
        localStorage.removeItem("gsfcu_demo_role");
      }
    } catch (e) {}
    setOverrideRole(role as "student" | "driver" | "scanner" | null);
  };

  // Determine effective role — admin override is always blocked here
  const dbRole = userObj.role?.toLowerCase() ?? "student";
  const activeRole = overrideRole ?? (dbRole === "admin" ? "student" : dbRole); // DB admins viewing /app see student view

  if (activeRole === "scanner")
    return (
      <ConductorScannerPage
        onOverrideRole={handleSetOverrideRole}
        overrideRole={overrideRole}
      />
    );

  if (activeRole === "driver")
    return (
      <DriverDashboard
        user={{ ...u, role: "driver" }}
        onOverrideRole={handleSetOverrideRole}
        overrideRole={overrideRole}
      />
    );

  // ⛔ Default: ALL users on /app see Student Dashboard — never Admin
  return (
    <StudentDashboard
      user={{ ...u, role: "student" }}
      onOverrideRole={handleSetOverrideRole}
      overrideRole={overrideRole}
    />
  );
}
