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
  AlertTriangle
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    
    // Smooth progress bar animation for demo card
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
                <button
                  onClick={() => navigate({ to: "/auth", search: { mode: "signup" } as never })}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:opacity-90 active:scale-[0.98]"
                >
                  Get Started <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden mx-auto max-w-7xl px-6 pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
              <Activity className="h-3.5 w-3.5 animate-pulse" /> Real-time GPS Telemetry & Fleet Tracking
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
              Campus mobility, <br />
              <span className="bg-gradient-to-r from-primary via-indigo-600 to-amber-500 bg-clip-text text-transparent">
                handcrafted for precision.
              </span>
            </h1>

            <p className="max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Never wait in uncertainty again. Live GPS shuttle tracking, dynamic anti-fraud digital pass validation, and automated driver alerts for every GSFCU student and faculty member.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition hover:opacity-95 active:scale-[0.98]"
              >
                Access Transit Console <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={() => {
                  const el = document.getElementById("features");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                Explore Features
              </button>
            </div>

            <div className="pt-6 border-t border-border/60 grid grid-cols-3 gap-4 text-left">
              <div>
                <div className="text-2xl font-bold font-display text-foreground">13 Routes</div>
                <div className="text-xs text-muted-foreground">Vadodara Network</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-display text-foreground">&lt; 5 sec</div>
                <div className="text-xs text-muted-foreground">GPS Update Interval</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-display text-foreground">100%</div>
                <div className="text-xs text-muted-foreground">Anti-Fraud Pass Tech</div>
              </div>
            </div>
          </div>

          {/* Right Hero Column: Interactive Telemetry Mockup */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-2xl shadow-primary/10 glow-card">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-lg">Route R2</span>
                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Active Shuttle #04
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Sama Savli Road → GSFCU Main Campus</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">On Time</div>
                  <div className="text-[11px] text-muted-foreground font-mono">38 km/h</div>
                </div>
              </div>

              {/* Live Progress Bar */}
              <div className="my-5">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-1.5">
                  <span>Live Journey Progress</span>
                  <span className="font-mono text-primary font-semibold">{Math.round(liveSimProgress)}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${liveSimProgress}%` }}
                  />
                </div>
              </div>

              {/* Live Timeline Stops */}
              <div className="space-y-4 pt-1">
                {[
                  { stop: "Sama Cross Roads", time: "07:45 AM", status: "completed", statusText: "Passed" },
                  { stop: "Sama Savli Circle", time: "07:55 AM", status: "active", statusText: "Current Stop (ETA 2 min)" },
                  { stop: "Nizampura Junction", time: "08:05 AM", status: "upcoming", statusText: "Scheduled 08:05 AM" },
                  { stop: "GSFCU Main Campus Gate", time: "08:15 AM", status: "upcoming", statusText: "Final Stop" },
                ].map((s, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-1 flex flex-col items-center">
                      {s.status === "completed" && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                      )}
                      {s.status === "active" && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse">
                          <Navigation className="h-3 w-3" />
                        </div>
                      )}
                      {s.status === "upcoming" && (
                        <div className="h-5 w-5 rounded-full border-2 border-border bg-card" />
                      )}
                    </div>

                    <div className="flex-1 rounded-lg border border-border/50 bg-muted/20 p-2.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${s.status === "active" ? "text-primary" : s.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {s.stop}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">{s.time}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{s.statusText}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Occupancy Indicator */}
              <div className="mt-5 rounded-xl bg-card border border-border/80 p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Bus Capacity:</span>
                  <span className="font-semibold text-foreground">24 / 40 Passengers</span>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                  Seats Available
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="border-t border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Engineered Architecture</span>
            <h2 className="text-3xl font-extrabold sm:text-4xl">Everything required for campus mobility.</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Designed from scratch to solve real delays, pass sharing fraud, and driver communication barriers.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: MapPin,
                title: "Live GPS Fleet Radar",
                desc: "High-precision map telemetry with automatic vehicle direction, route path highlights, and dynamic stop markers.",
                badge: "Real-time Telemetry"
              },
              {
                icon: QrCode,
                title: "Anti-Fraud Pass Engine",
                desc: "Rotating security tokens embedded in student QR passes automatically expire to prevent screenshot sharing.",
                badge: "Cryptographic Security"
              },
              {
                icon: Radio,
                title: "Driver Emergency Broadcasts",
                desc: "One-tap alert dispatch for drivers to notify waiting students about traffic bottlenecks, delays, or emergency stops.",
                badge: "Instant Dispatches"
              },
            ].map((f, i) => (
              <div key={i} className="group rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition hover:shadow-md glow-card">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {f.badge}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-bold font-display">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Interactive Showcase Section */}
      <section className="py-20 mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Role-Based Experience</span>
          <h2 className="text-3xl font-extrabold sm:text-4xl">Tailored console for every stakeholder</h2>
        </div>

        {/* Role Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-xl bg-muted p-1.5 border border-border/60">
            {[
              { id: "student", label: "Student Console", icon: Smartphone },
              { id: "driver", label: "Driver Cockpit", icon: Bus },
              { id: "admin", label: "Fleet Admin HQ", icon: ShieldCheck },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveRoleTab(tab.id as never)}
                className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs sm:text-sm font-semibold transition ${
                  activeRoleTab === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Role Card Highlight */}
        <div className="rounded-2xl border border-border/80 bg-card p-8 shadow-xl max-w-4xl mx-auto">
          {activeRoleTab === "student" && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Student Experience
                </div>
                <h3 className="text-2xl font-bold font-display">Instant Pass & Live Radar</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Students carry an active digital bus pass directly on their phones. Real-time ETA tells them exactly when to step out for their shuttle.
                </p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Rotating anti-fraud QR validation</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Stop-by-stop live arrival predictions</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Push notifications for driver delays</li>
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="font-semibold text-foreground">GSFCU DIGITAL BUS PASS</span>
                  <span className="text-emerald-600 dark:text-emerald-400">● VALID</span>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Student Name: Alex Sharma</div>
                  <div className="text-muted-foreground">Roll No: 22CS045</div>
                  <div className="text-muted-foreground">Assigned Route: R2 (Sama Savli)</div>
                </div>
                <div className="flex justify-center py-2">
                  <div className="h-20 w-20 rounded bg-foreground/10 flex items-center justify-center font-bold text-foreground">
                    [QR CODE]
                  </div>
                </div>
                <div className="text-center text-[10px] text-muted-foreground">Token refreshes every 30s</div>
              </div>
            </div>
          )}

          {activeRoleTab === "driver" && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Driver Interface
                </div>
                <h3 className="text-2xl font-bold font-display">One-Tap Route Management</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Drivers activate GPS tracking with a single toggle, update passenger load counters, and send quick delay alerts to waiting passengers.
                </p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Automatic location broadcasting</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Live seat capacity switcher</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Quick emergency & delay broadcast buttons</li>
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="font-semibold text-foreground">DRIVER COCKPIT</span>
                  <span className="text-emerald-600 dark:text-emerald-400">GPS ONLINE</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center py-2">
                  <div className="rounded bg-card p-2 border border-border">
                    <div className="text-muted-foreground text-[10px]">ROUTE</div>
                    <div className="font-bold text-foreground text-sm">R2 Sama</div>
                  </div>
                  <div className="rounded bg-card p-2 border border-border">
                    <div className="text-muted-foreground text-[10px]">OCCUPANCY</div>
                    <div className="font-bold text-foreground text-sm">28 / 40</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 rounded bg-amber-500/20 py-2 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                    Broadcast Delay
                  </button>
                  <button className="flex-1 rounded bg-emerald-500/20 py-2 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                    Next Stop
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeRoleTab === "admin" && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  Admin Fleet Control
                </div>
                <h3 className="text-2xl font-bold font-display">Complete Network Command</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Transport managers monitor active buses, manage route schedules, approve student pass requests, and review fleet punctuality stats.
                </p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Full fleet overview map</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Student pass approval workflow</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Route & stop schedule creation</li>
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="font-semibold text-foreground">FLEET METRICS</span>
                  <span className="text-primary font-bold">GSFCU HQ</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center py-2">
                  <div className="rounded bg-card p-2 border border-border">
                    <div className="text-[10px] text-muted-foreground">Buses Active</div>
                    <div className="font-bold text-foreground">4 / 4</div>
                  </div>
                  <div className="rounded bg-card p-2 border border-border">
                    <div className="text-[10px] text-muted-foreground">Passes Issued</div>
                    <div className="font-bold text-foreground">342</div>
                  </div>
                  <div className="rounded bg-card p-2 border border-border">
                    <div className="text-[10px] text-muted-foreground">Punctuality</div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">98%</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Handcrafted Footer */}
      <footer className="border-t border-border/60 bg-card py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Bus className="h-5 w-5" />
              </div>
              <div>
                <span className="font-display font-bold text-base">GSFCU Transit</span>
                <p className="text-xs text-muted-foreground">Smart Campus Transportation Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-muted-foreground font-medium">
              <span>● Live Fleet Status</span>
              <span>4 Vadodara Routes</span>
              <span>Anti-Fraud Pass v2.4</span>
            </div>

            <div className="text-xs text-muted-foreground text-center md:text-right">
              © {new Date().getFullYear()} GSFCU Transit. Handcrafted for GSFC University.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
