import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bus,
  MapPin,
  QrCode,
  Radio,
  Shield,
  Users,
  Navigation,
  Clock,
  Zap,
  CheckCircle2,
  ChevronRight,
  Activity,
  ArrowRight,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  Share,
  MoreVertical,
  X,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GSFCU Transit — Smart Campus Mobility & Live Tracking" },
      { name: "description", content: "Real-time GSFCU shuttle tracking, smart ETAs, anti-fraud digital pass, and fleet intelligence." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState<"student" | "driver" | "admin">("student");
  const [liveSimProgress, setLiveSimProgress] = useState(45);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    
    const timer = setInterval(() => {
      setLiveSimProgress((prev) => (prev >= 90 ? 15 : prev + 1.5));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Top Banner Status Bar */}
      <div className="border-b border-border/60 bg-muted/30 px-4 py-1.5 text-center text-xs font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="beacon-dot"></span>
          <span className="font-semibold text-foreground">GSFC University Routes 2026-27:</span> All 13 Student Shuttle Routes Operating Normally (Vadodara Region)
        </span>
      </div>

      {/* Main Navigation Header */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-bold tracking-tight">GSFCU Transit</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">v2.4</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Smart Campus Mobility System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Install Mobile App Button */}
            <button
              onClick={() => setShowInstallModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition"
            >
              <Smartphone className="h-4 w-4" /> Install Mobile App
            </button>

            {signedIn ? (
              <Link
                to="/app"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90 active:scale-[0.98]"
              >
                Launch App Platform <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90 active:scale-[0.98]"
                >
                  Get Started <ChevronRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Content */}
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary">
                <Radio className="h-3.5 w-3.5 animate-pulse" /> Real-time GPS Telemetry & Fleet Tracking
              </div>

              <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
                Campus mobility, <br />
                <span className="bg-gradient-to-r from-primary via-indigo-500 to-amber-500 bg-clip-text text-transparent">
                  handcrafted for precision.
                </span>
              </h1>

              <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
                Never wait in uncertainty again. Live GPS shuttle tracking, dynamic anti-fraud digital pass validation, and automated driver alerts for every GSFCU student and faculty member.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground shadow-xl shadow-primary/25 transition hover:opacity-90 active:scale-95"
                >
                  Access Transit Console <ArrowRight className="h-5 w-5" />
                </Link>

                <button
                  onClick={() => setShowInstallModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-6 py-3.5 text-base font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition active:scale-95"
                >
                  <Smartphone className="h-5 w-5" /> Install Mobile App
                </button>
              </div>

              {/* Stat Counters */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border/60">
                <div>
                  <div className="font-display text-2xl font-extrabold text-foreground">13 Routes</div>
                  <div className="text-xs text-muted-foreground">Vadodara Network</div>
                </div>
                <div>
                  <div className="font-display text-2xl font-extrabold text-foreground">&lt; 5 sec</div>
                  <div className="text-xs text-muted-foreground">GPS Update Interval</div>
                </div>
                <div>
                  <div className="font-display text-2xl font-extrabold text-foreground">100%</div>
                  <div className="text-xs text-muted-foreground">Anti-Fraud Pass Tech</div>
                </div>
              </div>
            </div>

            {/* Right Live Journey Simulation Widget */}
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Active Shuttle #04
                    </span>
                    <h3 className="font-display text-lg font-bold mt-1">Route R2</h3>
                    <p className="text-xs text-muted-foreground">Sama Savli Road → GSFCU Main Campus</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-emerald-500 font-bold">On Time</span>
                    <div className="text-xs text-muted-foreground font-mono">38 km/h</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Live Journey Progress</span>
                    <span className="font-mono text-primary">{Math.round(liveSimProgress)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-1000"
                      style={{ width: `${liveSimProgress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3 border border-border/40">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span>Sama Cross Roads</span>
                    </div>
                    <span className="font-mono text-muted-foreground">07:45 AM</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-primary/10 p-3 border border-primary/30 text-primary font-bold">
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4 animate-pulse" />
                      <span>Sama Savli Circle</span>
                    </div>
                    <span className="font-mono text-xs">Current Stop (ETA 2 min)</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3 border border-border/40">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40" />
                      <span>Nizampura Junction</span>
                    </div>
                    <span className="font-mono text-muted-foreground">08:05 AM</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3 border border-border/40">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40" />
                      <span>GSFCU Main Campus Gate</span>
                    </div>
                    <span className="font-mono text-muted-foreground">08:15 AM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Mobile App Installation Instructions Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-extrabold">Install GSFCU Transit App</h3>
                  <p className="text-xs text-muted-foreground">Run as a full-screen mobile app on your phone</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="rounded-full bg-muted p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Safari / iPhone Instructions */}
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center justify-between font-bold text-primary text-sm">
                  <span className="flex items-center gap-2">
                    <Share className="h-4 w-4 text-primary" /> On iPhone / iPad (Safari Browser)
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-primary/10 px-2 py-0.5 rounded-full">iOS</span>
                </div>
                <ol className="list-decimal pl-5 space-y-1.5 text-muted-foreground leading-relaxed">
                  <li>
                    Look at the bottom (or top) of your Safari screen and tap the <strong className="text-foreground">Share Icon <Share className="inline h-3.5 w-3.5 text-primary" /></strong> (square with arrow pointing up).
                  </li>
                  <li>Scroll down the menu list and tap <strong className="text-foreground">Add to Home Screen</strong>.</li>
                  <li>Tap <strong className="text-foreground">Add</strong> at the top right. GSFCU Transit is now installed on your iPhone home screen!</li>
                </ol>
              </div>

              {/* Android / Chrome Instructions */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                <div className="flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  <span className="flex items-center gap-2">
                    <MoreVertical className="h-4 w-4 text-emerald-500" /> On Android Phone (Chrome Browser)
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full">Android</span>
                </div>
                <ol className="list-decimal pl-5 space-y-1.5 text-muted-foreground leading-relaxed">
                  <li>
                    Tap the <strong className="text-foreground">3 Dots Menu <MoreVertical className="inline h-3.5 w-3.5 text-emerald-500" /></strong> at the top right corner of Chrome.
                  </li>
                  <li>Tap <strong className="text-foreground">Install app</strong> or <strong className="text-foreground">Add to Home screen</strong>.</li>
                  <li>Confirm installation. The app will launch in standalone mode!</li>
                </ol>
              </div>

              {/* Safari / Chrome Mac Instructions */}
              <div className="rounded-2xl border border-border bg-muted/20 p-3.5 space-y-1 text-muted-foreground">
                <div className="font-bold text-foreground text-xs">On Mac (Safari or Chrome):</div>
                <p>Click <strong>File</strong> in the top Mac menu bar &rarr; click <strong>Add to Dock</strong> to launch GSFCU Transit like a Mac app!</p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowInstallModal(false)}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-md min-h-[40px]"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
