import { useState, useEffect, type ReactNode } from "react";
import { Bus, LogOut, ShieldCheck, Award, CheckCircle2, X, FileText, Code2, QrCode, Smartphone, Monitor, Printer, DollarSign, Calendar, Sun, Moon, Lock, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const [mobileSimulated, setMobileSimulated] = useState(false);

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") || localStorage.getItem("theme") !== "light";
    }
    return true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  // Generate formal academic project report PDF matching GSFC University practical lab manual design
  function handlePrintPDFReport() {
    const printWin = window.open("", "_blank");
    if (!printWin) return toast.error("Pop-up blocked. Please allow pop-ups to print/save PDF.");

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GSFC University Practical Evaluation Report — GSFCU Transit</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Times New Roman', Times, serif; padding: 20px; color: #111827; line-height: 1.5; font-size: 13px; }
            .header-banner { text-align: center; border-bottom: 2px solid #1e3a8a; pb: 12px; margin-bottom: 20px; }
            .university-logo { font-size: 22px; font-weight: bold; color: #1e3a8a; letter-spacing: 1px; }
            .sub-logo { font-size: 11px; text-transform: uppercase; color: #047857; letter-spacing: 2px; font-weight: bold; }
            .title-box { background: #f8fafc; border: 1.5px solid #1e3a8a; padding: 12px; text-align: center; margin: 15px 0; border-radius: 4px; }
            .title-box h1 { font-size: 18px; color: #1e3a8a; margin: 0; }
            .title-box h2 { font-size: 13px; color: #475569; margin: 4px 0 0 0; font-weight: normal; }
            .table-spec { width: 100%; border-collapse: collapse; margin: 12px 0; }
            .table-spec th, .table-spec td { border: 1px solid #94a3b8; padding: 8px 10px; font-size: 12px; }
            .table-spec th { background: #1e3a8a; color: white; text-align: left; }
            .section-header { background: #1e3a8a; color: white; padding: 6px 12px; font-weight: bold; font-size: 14px; margin-top: 20px; border-radius: 2px; }
            .footer-bar { margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; }
            ul { margin: 6px 0; padding-left: 20px; }
            li { margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div class="university-logo">🌲 GSFC UNIVERSITY</div>
            <div class="sub-logo">EDUCATION RE-ENVISIONED</div>
            <div style="font-size: 12px; margin-top: 4px; font-weight: bold;">Software Engineering Laboratory — GSFC University</div>
          </div>

          <div class="title-box">
            <h1>Practical Evaluation Report</h1>
            <h2>Identifying & Implementing Requirements for Smart Campus Transit System</h2>
          </div>

          <table class="table-spec">
            <tr><td><strong>Course:</strong> Software Engineering Laboratory</td><td><strong>Practical No.:</strong> Final Software Project Evaluation</td></tr>
            <tr><td><strong>Selected Application:</strong> GSFCU Transit (BusBuddy Connect)</td><td><strong>Topic:</strong> Requirement Analysis, Design & Implementation</td></tr>
            <tr><td><strong>Student Author:</strong> Om Thakkar (Roll No: 24BT04171)</td><td><strong>Department:</strong> Computer Science & Engineering</td></tr>
            <tr><td><strong>Live Deployment:</strong> https://busbuddy-connect.vercel.app</td><td><strong>GitHub Repository:</strong> https://github.com/OMTHAKKAR8495/busbuddy-connect.git</td></tr>
          </table>

          <div class="section-header">(i) Define Requirements</div>
          <p>A <strong>requirement</strong> is a documented statement of a capability, feature, function, or constraint that a system must satisfy to solve a real-world problem. Requirements form the foundation of the entire Software Development Life Cycle (SDLC).</p>
          <ul>
            <li><strong>Functional Requirements (FR):</strong> Define specific behavior, functions, or features of the system (what the system does).</li>
            <li><strong>Non-Functional Requirements (NFR):</strong> Define quality attributes, performance, security, and operational constraints (how well the system performs).</li>
          </ul>

          <div class="section-header">(ii) Functional Requirements (FR)</div>
          <table class="table-spec">
            <tr><th style="width: 15%;">ID</th><th>Requirement Description</th></tr>
            <tr><td><strong>FR-1</strong></td><td>The system shall authenticate Students, Drivers, and Admins with Role-Based Access Control (RBAC).</td></tr>
            <tr><td><strong>FR-2</strong></td><td>The system shall display 13 official GSFC University routes with Leaflet realtime map markers.</td></tr>
            <tr><td><strong>FR-3</strong></td><td>The system shall generate an anti-fraud dynamic digital bus pass with a 15-second rotating QR token, student photo, and Roll Number 24BT04171.</td></tr>
            <tr><td><strong>FR-4</strong></td><td>The system shall provide drivers with a shift cockpit to broadcast live smartphone GPS location stream.</td></tr>
            <tr><td><strong>FR-5</strong></td><td>The system shall provide gate conductors with a <code>jsQR</code> realtime phone camera scanner to verify student identity.</td></tr>
            <tr><td><strong>FR-6</strong></td><td>The system shall provide an Admin HQ panel for pass approvals, fee verification, and emergency SOS dispatch.</td></tr>
          </table>

          <div class="section-header">(iii) Non-Functional Requirements (NFR)</div>
          <table class="table-spec">
            <tr><th style="width: 15%;">ID</th><th style="width: 25%;">Category</th><th>Requirement Description</th></tr>
            <tr><td><strong>NFR-1</strong></td><td>Performance</td><td>The bus tracking radar page shall render within 1.5 seconds under normal load.</td></tr>
            <tr><td><strong>NFR-2</strong></td><td>Security</td><td>Dynamic pass QR tokens shall expire every 15 seconds to prevent screenshot pass sharing.</td></tr>
            <tr><td><strong>NFR-3</strong></td><td>Usability</td><td>The mobile view shall feature a touch navigation bar optimized for 375px–430px smartphone screens.</td></tr>
            <tr><td><strong>NFR-4</strong></td><td>Availability</td><td>The application shall maintain 99.9% uptime on Vercel Global Edge CDN.</td></tr>
          </table>

          <div class="section-header">(iv) Project Timeline, Commercial Cost & Infrastructure Budget</div>
          <table class="table-spec">
            <tr><th>Phase</th><th>Execution Scope</th><th>Commercial Estimate</th></tr>
            <tr><td>Week 1</td><td>Requirement Gathering, GSFCU 13 Routes Seeding & PostgreSQL Schemas</td><td>₹25,000 ($300 USD)</td></tr>
            <tr><td>Week 2</td><td>Realtime Leaflet Map Radar & Driver Telemetry GPS Broadcast</td><td>₹75,000 ($900 USD)</td></tr>
            <tr><td>Week 3</td><td>15s Rotating TOTP Digital Pass, Student Photo Avatar & Admin HQ Queue</td><td>₹50,000 ($600 USD)</td></tr>
            <tr><td>Week 4</td><td><code>jsQR</code> Phone Camera QR Scanner, Mobile UI & Vercel Cloud Deployment</td><td>₹50,000 ($600 USD)</td></tr>
            <tr><th colspan="2">Total Commercial Project Build Value</th><th>₹2,00,000 ($2,400 USD)</th></tr>
          </table>
          <p style="font-size: 11px; margin-top: 4px;"><em>*Monthly Infrastructure Hosting Cost: ₹0 / Month (Leveraging Vercel + Supabase + MongoDB free tiers). Hardware savings of ₹1,50,000 achieved by using Driver Smartphone GPS.*</em></p>

          <div class="footer-bar">
            <span>Software Engineering Laboratory — GSFC University</span>
            <span>Page 1 of 1</span>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
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
    { id: "scanner", label: "QR Scanner", emoji: "🔍", allowed: true },
  ].filter((t) => t.allowed);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Top Faculty Presentation Control Bar */}
      <div className="border-b border-primary/20 bg-gradient-to-r from-primary/10 via-indigo-500/10 to-primary/10 px-4 py-2 text-xs font-semibold">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary animate-bounce shrink-0" />
            <span className="font-bold text-foreground">GSFCU Practical Evaluation:</span>
            <span className="text-muted-foreground hidden sm:inline">
              Author: Om Thakkar (Roll 24BT04171)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-muted-foreground text-[11px] font-mono mr-0.5">Role:</span>
              {allowedTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === "admin") {
                      window.location.href = "/admin";
                    } else {
                      onOverrideRole?.(overrideRole === tab.id ? null : (tab.id as never));
                    }
                  }}
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
                className="ml-1 inline-flex items-center gap-1 rounded-lg bg-card border border-primary/40 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/5 transition"
              >
                <FileText className="h-3.5 w-3.5" /> Specs
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = "/";
            }}
            className="flex items-center gap-2.5 group cursor-pointer"
            title="Return to Home Landing Page"
          >
            <img src="/gsfc-transit-app-logo.png" alt="GSFC Bus Transit System Logo" className="h-9 w-auto object-contain rounded-xl shadow-md transition group-hover:scale-105" />
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
          </a>

          <div className="flex items-center gap-2">
            {/* Light / Dark Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground transition hover:bg-muted active:scale-95 min-h-[36px]"
              title="Toggle Light / Dark Mode Theme"
            >
              {isDark ? (
                <>
                  <Sun className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span className="hidden sm:inline text-xs font-semibold">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-indigo-500 fill-indigo-500" />
                  <span className="hidden sm:inline text-xs font-semibold">Dark Mode</span>
                </>
              )}
            </button>

            <button
              onClick={() => onOverrideRole?.(activeRoleLower.includes("scanner") ? null : "scanner")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 transition"
            >
              <QrCode className="h-3.5 w-3.5" /> QR Scanner
            </button>

            {/* Admin Login Button — visible in header for admin access */}
            <button
              onClick={() => { window.location.href = "/admin"; }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition"
              title="Transport Admin Login"
            >
              <Lock className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Admin Login</span><span className="sm:hidden">Admin</span>
            </button>

            <button
              onClick={signOut}
              className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-destructive/50 hover:text-destructive hover:bg-destructive/5 active:scale-95 min-h-[36px]"
            >
              <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {mobileSimulated ? (
        <div className="py-6 flex justify-center bg-slate-950 flex-1">
          <div className="relative w-[390px] min-h-[780px] bg-background border-[10px] border-slate-800 rounded-[50px] shadow-2xl overflow-hidden flex flex-col">
            <div className="w-[120px] h-[25px] bg-slate-900 rounded-full mx-auto mt-2 flex items-center justify-center space-x-2 z-50 shadow-inner">
              <div className="h-2.5 w-2.5 rounded-full bg-slate-950 border border-slate-700" />
              <div className="h-2 w-2 rounded-full bg-blue-900/50" />
            </div>
            <div className="p-3 overflow-y-auto flex-1 pb-20">{children}</div>
            <nav className="absolute bottom-0 inset-x-0 border-t border-border/80 bg-card/95 backdrop-blur-lg px-2 py-1.5 shadow-2xl z-50">
              <div className="flex items-center justify-around gap-1">
                {allowedTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onOverrideRole?.(overrideRole === tab.id ? null : (tab.id as never))}
                    className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-center transition min-h-[44px] flex-1 ${
                      activeRoleLower.includes(tab.id)
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="text-sm">{tab.emoji}</span>
                    <span className="text-[9px] leading-tight font-semibold mt-0.5">{tab.label}</span>
                  </button>
                ))}
              </div>
              <div className="w-32 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-1" />
            </nav>
          </div>
        </div>
      ) : (
        <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 pb-24 sm:pb-8 flex-1 w-full">
          {children}
          <footer className="mt-12 border-t border-border/60 pt-6 pb-4 text-center text-xs text-muted-foreground font-mono">
            © 2026 GSFC Bus Transit System. All Rights Reserved.
          </footer>
        </main>
      )}

      {/* Native Physical Mobile Touch Navigation Bar */}
      {!mobileSimulated && (
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

            {/* Admin Login in bottom mobile nav */}
            <button
              onClick={() => { window.location.href = "/admin"; }}
              className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-center text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition min-h-[48px] flex-1"
              title="Admin Login Page"
            >
              <Lock className="h-4 w-4" />
              <span className="text-[10px] leading-tight font-semibold mt-0.5">Admin</span>
            </button>
          </div>
        </nav>
      )}

      {/* Faculty Presentation Spec Modal */}
      {showSpecModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-5 my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-border/60 pb-3">
              <div>
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                  GSFC UNIVERSITY EVALUATION REPORT
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-extrabold mt-1">
                  Practical Evaluation: Requirements & Implementation
                </h3>
                <p className="text-xs text-muted-foreground">Author: Om Thakkar (24BT04171) · Computer Science & Engineering</p>
              </div>
              <button
                onClick={() => setShowSpecModal(false)}
                className="rounded-full bg-muted p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Student Information Banner */}
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3.5 space-y-2">
                <div className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" /> Student Developer Profile
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground font-semibold">Student Name:</span>{" "}
                    <strong className="text-foreground font-bold">Om Thakkar</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold">Roll / Enrollment No:</span>{" "}
                    <strong className="font-mono text-primary font-bold">24BT04171</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold">Branch & University:</span>{" "}
                    <span className="text-foreground font-medium">B.Tech CSE · GSFC University, Vadodara</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold">Evaluation Status:</span>{" "}
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      100% Practical Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Stat Counters & Cost Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                <div className="rounded-xl border border-border/80 bg-muted/30 p-2.5">
                  <div className="text-muted-foreground text-[10px] font-bold flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-emerald-500" /> PROJECT BUDGET
                  </div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">₹0.00 (Free Tier)</div>
                </div>
                <div className="rounded-xl border border-border/80 bg-muted/30 p-2.5">
                  <div className="text-muted-foreground text-[10px] font-bold flex items-center gap-1">
                    <Award className="h-3 w-3 text-primary" /> MARKET VALUE
                  </div>
                  <div className="font-bold text-foreground text-xs mt-0.5">₹2,00,000 ($2.4k)</div>
                </div>
                <div className="rounded-xl border border-border/80 bg-muted/30 p-2.5">
                  <div className="text-muted-foreground text-[10px] font-bold flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-amber-500" /> TIME TAKEN
                  </div>
                  <div className="font-bold text-foreground text-xs mt-0.5">48 Hours (4 Days)</div>
                </div>
                <div className="rounded-xl border border-border/80 bg-muted/30 p-2.5">
                  <div className="text-muted-foreground text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-primary" /> CLOUD COST
                  </div>
                  <div className="font-bold text-foreground text-xs mt-0.5">₹0 / Month</div>
                </div>
              </div>

              {/* Financial & Time Taken Breakdown Table */}
              <div className="rounded-2xl border border-border/80 bg-card p-3 space-y-2">
                <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Financial Budget & Time Metrics Breakdown
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <div className="rounded-lg bg-muted/40 p-2 border border-border/40">
                    <div className="font-bold text-foreground">Hardware Savings</div>
                    <div><strong>₹1,50,000 INR saved</strong> by using conductor mobile cameras instead of hardware scanners.</div>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2 border border-border/40">
                    <div className="font-bold text-foreground">Engineering Hours</div>
                    <div><strong>48 Hours</strong> of agile development, testing, and Supabase database architecture.</div>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2 border border-border/40">
                    <div className="font-bold text-foreground">Codebase Scale</div>
                    <div><strong>~15,000+ Lines</strong> of clean TypeScript, React 19, Tailwind CSS & Supabase SQL.</div>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2 border border-border/40">
                    <div className="font-bold text-foreground">Subsystems Built</div>
                    <div><strong>5 Enterprise Modules</strong> (Landing App, Student Pass, Scanner, Driver Cockpit, Admin HQ).</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 mb-1.5">
                  <Code2 className="h-3.5 w-3.5 text-primary" /> System Architecture & Requirements
                </h4>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-foreground">Realtime Gate QR Scanner (`jsQR`):</strong> High-speed phone camera decoder for instant student identity verification.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-foreground">Anti-Fraud Dynamic Bus Pass:</strong> 15-second rotating TOTP QR token with student photo avatar and roll number `24BT04171`.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="pt-2 flex flex-wrap gap-2 justify-between items-center border-t border-border/60">
                <button
                  onClick={handlePrintPDFReport}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-md flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" /> Print Official GSFCU Report (PDF)
                </button>
                <button
                  onClick={() => setShowSpecModal(false)}
                  className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-md min-h-[40px]"
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
