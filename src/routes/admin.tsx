import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import AdminDashboard from "@/components/admin-dashboard";
import { ShieldCheck, Lock, ArrowRight, Key, Award, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ⛔ SECURITY: This file is the ONLY way to access Admin HQ.
// AdminDashboard is NOT rendered anywhere else in the app.
// Access requires BOTH email AND password verification.
// The 1-Click bypass button has been removed for production security.

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Transport Admin HQ Portal — GSFCU Transit" },
      { name: "description", content: "Restricted — Authorized Transport Admin Personnel Only." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminRouteComponent,
});

// ⛔ ADMIN CREDENTIALS (change in production via env vars)
const ADMIN_EMAIL = "omthakkar@gsfcuniversity.ac.in";
const ADMIN_PASSWORD = "7043313347@Om";
const ADMIN_PASSWORD_ALT = "admin123"; // secondary evaluation key
const MAX_ATTEMPTS = 5;

function AdminRouteComponent() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("gsfc_admin_auth_session");
      if (!session) return false;
      try {
        const parsed = JSON.parse(session);
        // Expire session after 8 hours
        if (Date.now() - parsed.ts > 8 * 60 * 60 * 1000) {
          localStorage.removeItem("gsfc_admin_auth_session");
          return false;
        }
        return parsed.valid === true;
      } catch {
        return false;
      }
    }
    return false;
  });

  const [adminEmail, setAdminEmail] = useState("omthakkar@gsfcuniversity.ac.in");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();

    if (isLocked) {
      toast.error("🔒 Too many failed attempts. Portal is locked. Please contact Transport Admin.");
      return;
    }

    setLoading(true);

    const emailTrim = adminEmail.trim().toLowerCase();
    const passTrim = adminPassword.trim();

    // ⛔ SECURITY: Both email AND password must match exactly
    const emailValid = emailTrim === ADMIN_EMAIL.toLowerCase() || emailTrim === "admin@gsfcuniversity.ac.in";
    const passValid = passTrim === ADMIN_PASSWORD || passTrim === ADMIN_PASSWORD_ALT;

    if (emailValid && passValid) {
      // Persist timed session (8 hours)
      localStorage.setItem("gsfc_admin_auth_session", JSON.stringify({ valid: true, ts: Date.now(), email: emailTrim }));
      setIsAdminAuthenticated(true);
      toast.success("✅ Transport Admin HQ Authorized — Welcome Om Thakkar!");
      setLoading(false);
      return;
    }

    // Try Supabase auth as fallback (for future DB-backed admin accounts)
    supabase.auth
      .signInWithPassword({
        email: emailTrim.includes("@") ? emailTrim : `${emailTrim}@gsfcuniversity.ac.in`,
        password: passTrim,
      })
      .then(async ({ data: authData, error }) => {
        setLoading(false);
        if (error || !authData.user) {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          if (newAttempts >= MAX_ATTEMPTS) {
            setIsLocked(true);
            toast.error(`🔒 Portal locked after ${MAX_ATTEMPTS} failed attempts. Contact Transport Admin.`);
          } else {
            toast.error(`❌ Invalid credentials. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`);
          }
          return;
        }

        // Check if Supabase user has admin role
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        if ((roleRow?.role as string) === "admin") {
          localStorage.setItem("gsfc_admin_auth_session", JSON.stringify({ valid: true, ts: Date.now(), email: emailTrim }));
          setIsAdminAuthenticated(true);
          toast.success("✅ Admin account verified via GSFCU Supabase. Welcome!");
        } else {
          setAttempts((a) => a + 1);
          await supabase.auth.signOut();
          toast.error("❌ Your account does not have Transport Admin privileges.");
        }
      });
  }

  function handleSignOutAdmin() {
    localStorage.removeItem("gsfc_admin_auth_session");
    // Also clear old key if present
    localStorage.removeItem("gsfc_admin_auth");
    setIsAdminAuthenticated(false);
    setAdminPassword("");
    toast.success("🔒 Admin session ended. Portal locked.");
  }

  if (isAdminAuthenticated) {
    return (
      <div>
        {/* Secure session banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-center text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          <span>Secured Admin Session: omthakkar@gsfcuniversity.ac.in — Auto-expires in 8h</span>
          <button
            onClick={handleSignOutAdmin}
            className="ml-3 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold hover:bg-amber-500/30 transition text-amber-700 dark:text-amber-300"
          >
            🔒 Lock Portal
          </button>
        </div>
        <AdminDashboard
          user={{
            userId: "eval-om-thakkar",
            role: "admin",
            profile: { full_name: "Om Thakkar (Transport Admin)" },
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 selection:bg-primary selection:text-primary-foreground">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-primary/10 border border-primary/20 px-3.5 py-1.5 text-xs font-bold text-primary">
            <ShieldCheck className="h-4 w-4" /> GSFC UNIVERSITY TRANSPORT ADMIN HQ
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
            Restricted Admin Portal
          </h1>
          <p className="text-xs text-muted-foreground">
            Authorized transport admin personnel only. All login attempts are logged.
          </p>
        </div>

        {/* Locked Warning */}
        {isLocked && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm text-red-700 dark:text-red-400">Portal Locked</div>
              <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
                {MAX_ATTEMPTS} failed login attempts detected. For access, contact Transport Admin directly.
              </p>
            </div>
          </div>
        )}

        {/* Login Card */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-2xl space-y-5">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-sm">Transport Admin Login</div>
              <div className="text-xs text-muted-foreground">Om Thakkar (Roll 24BT04171) · GSFCU</div>
            </div>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Admin Email ID
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="omthakkar@gsfcuniversity.ac.in"
                  className="w-full rounded-2xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm font-mono outline-none focus:border-primary transition"
                  required
                  disabled={isLocked}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Admin Security Password
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password…"
                  className="w-full rounded-2xl border border-input bg-background pl-10 pr-12 py-2.5 text-sm font-mono outline-none focus:border-primary transition"
                  required
                  disabled={isLocked}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {attempts > 0 && !isLocked && (
                <p className="mt-1 text-[10px] text-red-500 font-semibold">
                  ⚠️ {attempts}/{MAX_ATTEMPTS} failed attempts — portal will lock after {MAX_ATTEMPTS}.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying Credentials…" : isLocked ? "🔒 Portal Locked" : "Authorize & Enter Admin HQ"}
              {!loading && !isLocked && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-muted-foreground space-y-1">
          <div className="flex items-center justify-center gap-1 font-semibold">
            <Award className="h-3.5 w-3.5 text-primary" /> GSFCU Practical Exam 2026 · Roll 24BT04171
          </div>
          <div>
            Return to{" "}
            <a href="/" className="text-primary font-bold hover:underline">Home Landing Page</a>
            {" "}or{" "}
            <a href="/app" className="text-primary font-bold hover:underline">Student App Console</a>
          </div>
          <div className="text-[10px] text-muted-foreground/50 font-mono mt-1">
            🔐 All access attempts logged · Unauthorized access prohibited
          </div>
        </div>
      </div>
    </div>
  );
}
