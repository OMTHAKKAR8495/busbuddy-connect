import { useState, type ReactNode } from "react";
import { Bus, LogOut, ShieldCheck, Award, CheckCircle2, X, FileText, Code2, QrCode } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export default function AppShell({
  title,
  role,
  onOverrideRole,
  overrideRole,
  children,
}: {
  title: string;
  role: string;
  onOverrideRole?: (r: "student" | "driver" | "admin" | "scanner" | null) => void;
  overrideRole?: "student" | "driver" | "admin" | "scanner" | null;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showSpecModal, setShowSpecModal] = useState(false);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  // Derive current active role type
  const activeRoleLower = (overrideRole ?? role).toLowerCase();

  // Role Access Matrix
  const isStudent = activeRoleLower.includes("student");
  const isDriver = activeRoleLower.includes("driver");
  const isAdmin = activeRoleLower.includes("admin") || activeRoleLower.includes("teacher");

  const allowedTabs = [
    { id: "student", label: "Student", emoji: "🎓", allowed: true },
    { id: "driver", label: "Driver", emoji: "🚌", allowed: isDriver || isAdmin },
    { id: "admin", label: "Admin HQ", emoji: "🛡️", allowed: isAdmin },
    { id: "scanner", label: "QR Scanner", emoji: "🔍", allowed: isDriver || isAdmin },
  ].filter((t) => t.allowed);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Top Presentation Bar (Desktop / Tablet) */}
      <div className="border-b border-primary/20 bg-gradient-to-r from-primary/10 via-indigo-500/10 to-primary/10 px-4 py-2 text-xs font-semibold">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary animate-bounce shrink-0" />
            <span className="font-bold text-foreground">GSFCU Access Control:</span>
            <span className="text-muted-foreground hidden sm:inline">
              {isStudent && "Student Profile (Student Pass & Bus Radar Only)"}
              {isDriver && "Driver Profile (Driver Telemetry + Gate QR Scanner)"}
              {isAdmin && "Admin / Teacher Profile (Full Access & HQ Controls)"}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-muted-foreground text-[11px] font-mono mr-1">Switch View:</span>
            {allowedTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onOverrideRole?.(overrideRole === tab.id ? null : (tab.id as never))}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  activeRoleLower.includes(tab.id)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card border border-border/80 text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.emoji} {tab.label}
              </button>
            ))}

            <button
              onClick={() => setShowSpecModal(true)}
              className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-card border border-primary/40 px-3 py-1 text-[11px] font-bold text-primary hover:bg-primary/5 transition"
            >
              <FileText className="h-3.5 w-3.5" /> Specs
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
          <Link to="/app" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition group-hover:scale-105">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-sm sm:text-base font-bold leading-tight flex items-center gap-1.5">
                {title}
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="beacon-dot"></span> Live
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                <ShieldCheck className="h-3 w-3 text-primary" /> {overrideRole ? `Demo ${overrideRole}` : role} Console
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {(isDriver || isAdmin) && (
              <button
                onClick={() => onOverrideRole?.("scanner")}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary/50 transition"
              >
                <QrCode className="h-3.5 w-3.5 text-primary" /> QR Scanner
              </button>
            )}

            <button
              onClick={signOut}
              className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-destructive/50 hover:text-destructive hover:bg-destructive/5 active:scale-95 min-h-[36px]"
            >
              <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area (extra bottom padding on mobile for touch bar) */}
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 pb-24 sm:pb-8 flex-1 w-full">{children}</main>

      {/* Mobile Bottom Navigation Touch Bar (Smartphone 375px–430px Resolution Optimized) */}
      <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border/80 bg-card/95 backdrop-blur-lg sm:hidden px-2 py-2 shadow-2xl">
        <div className="flex items-center justify-around gap-1">
          {allowedTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onOverrideRole?.(overrideRole === tab.id ? null : (tab.id as never))}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-center transition min-h-[48px] flex-1 ${
                activeRoleLower.includes(tab.id)
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-base">{tab.emoji}</span>
              <span className="text-[10px] leading-tight font-semibold mt-0.5">{tab.label}</span>
            </button>
          ))}

          <button
            onClick={() => setShowSpecModal(true)}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-center text-muted-foreground hover:text-foreground transition min-h-[48px] flex-1"
          >
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-[10px] leading-tight font-semibold mt-0.5">Specs</span>
          </button>
        </div>
      </nav>

      {/* Faculty Presentation Project Spec Sheet Modal */}
      {showSpecModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-5 my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-border/60 pb-3">
              <div>
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                  GSFC UNIVERSITY EVALUATION SPEC SHEET
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-extrabold mt-1">
                  Smart Campus Transit & Fleet System (2026-27)
                </h3>
                <p className="text-xs text-muted-foreground">Author: Om Thakkar · Computer Science & Engineering</p>
              </div>
              <button
                onClick={() => setShowSpecModal(false)}
                className="rounded-full bg-muted p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 sm:gap-3 font-mono">
                <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
                  <div className="text-muted-foreground text-[10px]">MOBILE OPTIMIZED</div>
                  <div className="font-bold text-foreground text-xs sm:text-sm">Responsive Viewport (375-430px)</div>
                </div>
                <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
                  <div className="text-muted-foreground text-[10px]">QR SCANNER ACCESS</div>
                  <div className="font-bold text-foreground text-xs sm:text-sm">Driver & Admin Only</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5 mb-2">
                  <Code2 className="h-4 w-4 text-primary" /> Mobile Operations & Controls
                </h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-foreground">Touch-Optimized Bottom Nav Bar:</strong> Instant role switching between Student, Driver, Admin, and Scanner with touch targets &ge; 48px.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-foreground">Live Mobile Leaflet Bus Map:</strong> Gesture drag, pinch zoom, and touch marker popups for real-time bus tracking.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-foreground">Mobile Camera & Verification Beep:</strong> Interactive camera viewfinder & audio chime for conductors scanning student passes.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="rounded-xl bg-primary/5 p-3 border border-primary/20 flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-primary">Tech Stack: React 19 · Vite · TypeScript · Tailwind CSS v4 · Supabase RLS</span>
                <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Mobile Ready</span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowSpecModal(false)}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-md min-h-[40px]"
              >
                Close Spec Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
