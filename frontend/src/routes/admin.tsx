import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import AdminDashboard from "@/components/admin-dashboard";
import { ShieldCheck, Lock, ArrowRight, Key, Sparkles, CheckCircle2, Award } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Transport Admin HQ Portal — GSFCU Transit" },
      { name: "description", content: "Dedicated Transport Admin HQ login and fleet command portal." },
    ],
  }),
  component: AdminRouteComponent,
});

function AdminRouteComponent() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gsfc_admin_auth") === "true";
    }
    return false;
  });
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);

  function handleAdminPasscodeLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (
      passcode.trim() === "admin123" ||
      passcode.trim().toLowerCase() === "admin" ||
      passcode.trim() === "24BT04171" ||
      passcode.trim().toLowerCase() === "gsfcu"
    ) {
      localStorage.setItem("gsfc_admin_auth", "true");
      setIsAdminAuthenticated(true);
      toast.success("✓ Transport Admin HQ Authorized! Welcome Om Thakkar.");
      setLoading(false);
      return;
    }

    // Try Supabase authentication
    supabase.auth
      .signInWithPassword({
        email: passcode.includes("@") ? passcode : `${passcode}@gsfcuniversity.ac.in`,
        password: "password123",
      })
      .then(({ error }) => {
        setLoading(false);
        if (error) {
          toast.error("Invalid Admin Passcode. Use master code: admin123");
        } else {
          localStorage.setItem("gsfc_admin_auth", "true");
          setIsAdminAuthenticated(true);
          toast.success("✓ Admin Logged In Successfully!");
        }
      });
  }

  function handleInstantAdminAccess() {
    localStorage.setItem("gsfc_admin_auth", "true");
    setIsAdminAuthenticated(true);
    toast.success("✓ Transport Admin HQ Authorized!");
  }

  function handleSignOutAdmin() {
    localStorage.removeItem("gsfc_admin_auth");
    setIsAdminAuthenticated(false);
    toast.success("Signed out from Transport Admin HQ");
  }

  if (isAdminAuthenticated) {
    return (
      <div>
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-center text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          <span>Dedicated Transport Admin HQ Portal (/admin) — Session Active</span>
          <button
            onClick={handleSignOutAdmin}
            className="ml-3 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold hover:bg-amber-500/30 transition text-amber-700 dark:text-amber-300"
          >
            Lock Admin Portal
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
      {/* Header Banner */}
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-primary/10 border border-primary/20 px-3.5 py-1.5 text-xs font-bold text-primary">
            <ShieldCheck className="h-4 w-4" /> GSFC UNIVERSITY TRANSPORT ADMIN HQ
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
            Restricted Admin Portal
          </h1>
          <p className="text-xs text-muted-foreground">
            Enter Transport Admin Security Passcode or Master Key to access Fleet Command, Bus Passes, & Attendance CSVs.
          </p>
        </div>

        {/* Security Login Card */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-2xl space-y-5">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-sm">Admin HQ Passcode</div>
              <div className="text-xs text-muted-foreground">Author: Om Thakkar (Roll 24BT04171)</div>
            </div>
          </div>

          <form onSubmit={handleAdminPasscodeLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>Security Passcode / Master Key</span>
                <span className="font-mono text-[10px] text-primary">Master: admin123</span>
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode (admin123)…"
                  className="w-full rounded-2xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm font-mono outline-none focus:border-primary transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? "Authenticating Admin…" : "Authorize & Enter Admin HQ"} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="relative border-t border-border/60 pt-4 text-center">
            <span className="bg-card px-2 text-[10px] text-muted-foreground uppercase font-mono font-semibold">
              Evaluation & Faculty Demo Access
            </span>

            <button
              onClick={handleInstantAdminAccess}
              className="mt-3 w-full rounded-2xl border border-emerald-500/40 bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-4 w-4" /> 1-Click Instant Evaluation Admin Access
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-muted-foreground space-y-1">
          <div className="flex items-center justify-center gap-1 font-semibold">
            <Award className="h-3.5 w-3.5 text-primary" /> GSFCU Practical Exam 2026 · Roll 24BT04171
          </div>
          <div>Return to <a href="/" className="text-primary font-bold hover:underline">Home Landing Page</a> or <a href="/app" className="text-primary font-bold hover:underline">Student App Console</a></div>
        </div>
      </div>
    </div>
  );
}
