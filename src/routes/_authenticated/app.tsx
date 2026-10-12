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
  const [overrideRole, setOverrideRole] = useState<"student" | "driver" | "scanner" | null>(null);
  const [activeDriverPass, setActiveDriverPass] = useState<any>(null);
  const [activeRegisteredUser, setActiveRegisteredUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("gsfcu_demo_role");
        if (stored === "driver" || stored === "scanner" || stored === "student") {
          setOverrideRole(stored as any);
        }
        const storedDriver = localStorage.getItem("gsfcu_active_driver_profile");
        if (storedDriver) setActiveDriverPass(JSON.parse(storedDriver));
        const storedUser = localStorage.getItem("gsfcu_active_user");
        if (storedUser) {
          setActiveRegisteredUser(JSON.parse(storedUser));
          // Once a registered user is detected, remove any stale demo override
          localStorage.removeItem("gsfcu_demo_role");
          setOverrideRole(null);
        }
      } catch (e) {}
    }
  }, []);

  // If a real account is signed in, do not treat as demo
  const effectiveOverrideRole = activeRegisteredUser ? null : overrideRole;

  const fallbackUser = {
    userId: effectiveOverrideRole === "driver" 
      ? (activeDriverPass?.id || "eval-driver-ramesh") 
      : (activeRegisteredUser?.userId || "eval-om-thakkar"),
    role: (effectiveOverrideRole === "driver" ? "driver" : (effectiveOverrideRole || activeRegisteredUser?.role || "student")) as const,
    profile: {
      full_name: effectiveOverrideRole === "driver" 
        ? (activeDriverPass?.driver_name || "Ramesh Patel") 
        : (activeRegisteredUser?.profile?.full_name || "Student"),
      roll_number: effectiveOverrideRole === "driver" 
        ? (activeDriverPass?.employee_id || "DRV-101") 
        : (activeRegisteredUser?.profile?.roll_number || ""),
      photo_url: effectiveOverrideRole === "driver" ? (activeDriverPass?.photo_url || null) : null,
    },
  };

  const userObj = activeRegisteredUser || (effectiveOverrideRole === "driver" && activeDriverPass ? fallbackUser : (data || fallbackUser));
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
  const activeRole = effectiveOverrideRole ?? (dbRole === "admin" ? "student" : dbRole); // DB admins viewing /app see student view

  if (activeRole === "scanner")
    return (
      <ConductorScannerPage
        onOverrideRole={handleSetOverrideRole}
        overrideRole={effectiveOverrideRole}
      />
    );

  if (activeRole === "driver")
    return (
      <DriverDashboard
        user={{ ...u, role: "driver" }}
        onOverrideRole={handleSetOverrideRole}
        overrideRole={effectiveOverrideRole}
      />
    );

  // ⛔ Default: ALL users on /app see Student Dashboard — never Admin
  return (
    <StudentDashboard
      user={{ ...u, role: "student" }}
      onOverrideRole={handleSetOverrideRole}
      overrideRole={effectiveOverrideRole}
    />
  );
}
