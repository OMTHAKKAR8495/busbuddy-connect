import { useState, type ReactNode } from "react";
import { Bus, LogOut, ShieldCheck, Award, CheckCircle2, X, FileText, Code2, QrCode, Smartphone, Monitor, Printer, DollarSign, Calendar } from "lucide-react";
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

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  // Generate formal academic project report PDF
  function handlePrintPDFReport() {
    const printWin = window.open("", "_blank");
    if (!printWin) return toast.error("Pop-up blocked. Please allow pop-ups to print/save PDF.");

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GSFCU Transit — Academic Project Evaluation Report (Om Thakkar)</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            h1 { font-size: 26px; color: #0284c7; border-bottom: 3px solid #0284c7; padding-bottom: 8px; margin-bottom: 4px; }
            h2 { font-size: 18px; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 24px; }
            .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
            th { background: #f1f5f9; font-weight: bold; }
            .badge { display: inline-block; background: #0284c7; color: white; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; }
            .cost-tag { font-size: 16px; font-weight: bold; color: #059669; }
          </style>
        </head>
        <body>
          <span class="badge">GSFC UNIVERSITY FINAL PROJECT REPORT</span>
          <h1>GSFCU Transit & Smart Campus Mobility System</h1>
          
          <div class="meta-box">
            <p><strong>Author:</strong> Om Thakkar (Roll No: 24BT04171)</p>
            <p><strong>Department:</strong> Computer Science & Engineering</p>
            <p><strong>Institution:</strong> GSFC University, Vadodara, Gujarat</p>
            <p><strong>Development Period:</strong> 4 Weeks (Sprint Cycle)</p>
            <p><strong>Live Web Application:</strong> https://busbuddy-connect.vercel.app</p>
            <p><strong>Source Repository:</strong> https://github.com/OMTHAKKAR8495/busbuddy-connect.git</p>
          </div>

          <h2>1. Executive Summary & Innovation</h2>
          <p>GSFCU Transit is a cloud-native smart campus transit management platform built specifically for GSFC University's 13 official bus routes. It introduces live smartphone GPS bus telemetry, anti-fraud dynamic 15-second rotating QR passes, realtime conductor gate QR scanning via <code>jsQR</code>, and master admin HQ fleet management.</p>

          <h2>2. Technical Architecture & Stack</h2>
          <table>
            <tr><th>Layer</th><th>Technology</th><th>Purpose</th></tr>
            <tr><td>Frontend</td><td>React 19, TypeScript, Vite, Tailwind CSS v4</td><td>Responsive Client Single Page Application (375px-430px Mobile & Desktop)</td></tr>
            <tr><td>Routing & State</td><td>TanStack Router, TanStack Query v5</td><td>Type-safe routing and state caching</td></tr>
            <tr><td>Live Radar Maps</td><td>Leaflet.js, OpenStreetMap API</td><td>Interactive bus position tracking and route polyline overlays</td></tr>
            <tr><td>Database & Realtime</td><td>Supabase PostgreSQL (RLS), MongoDB Atlas</td><td>Row Level Security, WebSockets telemetry stream</td></tr>
            <tr><td>QR Scanner Engine</td><td><code>jsQR</code> + WebRTC MediaDevices API</td><td>High-speed phone rear camera QR frame decoding loop</td></tr>
          </table>

          <h2>3. Development Period & Timeline (4 Weeks)</h2>
          <table>
            <tr><th>Week</th><th>Sprint Scope</th><th>Key Deliverables</th></tr>
            <tr><td>Week 1</td><td>Requirements & Route Seeding</td><td>Seeded 13 official GSFCU bus routes, PostgreSQL & MongoDB database schemas.</td></tr>
            <tr><td>Week 2</td><td>Realtime Radar & Telemetry</td><td>Leaflet bus tracking radar map, Driver shift control cockpit, GPS broadcast.</td></tr>
            <tr><td>Week 3</td><td>Digital Pass & Admin HQ</td><td>15s TOTP rotating QR pass, Student photo avatar, Admin approval queue.</td></tr>
            <tr><td>Week 4</td><td>Conductor QR Scanner & Cloud Deploy</td><td><code>jsQR</code> realtime camera decoder, Mobile bottom bar, RBAC, Vercel deployment.</td></tr>
          </table>

          <h2>4. Project Cost Analysis & Budget Estimation</h2>
          <table>
            <tr><th>Cost Category</th><th>Description</th><th>Commercial Estimate</th></tr>
            <tr><td>UI/UX Design</td><td>Responsive Mobile Glassmorphism System</td><td>₹25,000 ($300 USD)</td></tr>
            <tr><td>Frontend Engineering</td><td>React 19, TypeScript, TanStack, Leaflet Maps</td><td>₹75,000 ($900 USD)</td></tr>
            <tr><td>Backend & Security</td><td>Supabase PostgreSQL RLS, WebSockets, MongoDB</td><td>₹50,000 ($600 USD)</td></tr>
            <tr><td>QR Scanner Engine</td><td><code>jsQR</code> Realtime Camera Frame Decoder</td><td>₹30,000 ($360 USD)</td></tr>
            <tr><td>QA & Cloud CI/CD</td><td>Vercel Deployment, Cross-browser QA</td><td>₹20,000 ($240 USD)</td></tr>
            <tr><th>Total Commercial Build Value</th><th>Full Production Fleet Platform</th><th class="cost-tag">₹2,00,000 ($2,400 USD)</th></tr>
          </table>

          <div class="meta-box" style="margin-top: 20px;">
            <p><strong>Cloud Infrastructure Cost:</strong> ₹0 / Month (Vercel + Supabase + MongoDB Free Tier)</p>
            <p><strong>Hardware Cost Savings:</strong> Saved ₹1,50,000 upfront hardware costs by using Driver Smartphone Telemetry instead of expensive GPS hardware units.</p>
          </div>

          <div style="margin-top: 40px; text-align: right;">
            <p>_______________________________</p>
            <p><strong>Om Thakkar (24BT04171)</strong><br/>Computer Science & Engineering</p>
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
    { id: "admin", label: "Admin HQ", emoji: "🛡️", allowed: isAdmin },
    { id: "scanner", label: "QR Scanner", emoji: "🔍", allowed: true },
  ].filter((t) => t.allowed);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Top Faculty Presentation Control Bar */}
      <div className="border-b border-primary/20 bg-gradient-to-r from-primary/10 via-indigo-500/10 to-primary/10 px-4 py-2 text-xs font-semibold">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary animate-bounce shrink-0" />
            <span className="font-bold text-foreground">GSFCU Presentation Control Bar:</span>
            <span className="text-muted-foreground hidden sm:inline">
              Author: Om Thakkar (24BT04171)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile View Simulator Toggle */}
            <button
              onClick={() => setMobileSimulated(!mobileSimulated)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold border transition ${
                mobileSimulated
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                  : "bg-card border-border text-foreground hover:bg-muted"
              }`}
            >
              {mobileSimulated ? <Monitor className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5 text-primary" />}
              <span>{mobileSimulated ? "Exit Mobile Mode" : "📱 Mobile View"}</span>
            </button>

            {/* Print PDF Report Button */}
            <button
              onClick={handlePrintPDFReport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              <Printer className="h-3.5 w-3.5" /> Download Report (PDF)
            </button>

            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-muted-foreground text-[11px] font-mono mr-0.5">Role:</span>
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
                className="ml-1 inline-flex items-center gap-1 rounded-lg bg-card border border-primary/40 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/5 transition"
              >
                <FileText className="h-3.5 w-3.5" /> Project Specs
              </button>
            </div>
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
            <button
              onClick={() => onOverrideRole?.(activeRoleLower.includes("scanner") ? null : "scanner")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 transition"
            >
              <QrCode className="h-3.5 w-3.5" /> QR Scanner
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
        <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 pb-24 sm:pb-8 flex-1 w-full">{children}</main>
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
              <div className="grid grid-cols-3 gap-2 font-mono">
                <div className="rounded-xl border border-border/80 bg-muted/30 p-2.5">
                  <div className="text-muted-foreground text-[10px] font-bold flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary" /> TIMELINE
                  </div>
                  <div className="font-bold text-foreground text-xs">4 Weeks Build</div>
                </div>
                <div className="rounded-xl border border-border/80 bg-muted/30 p-2.5">
                  <div className="text-muted-foreground text-[10px] font-bold flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-emerald-500" /> COMMERCIAL
                  </div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">₹2,00,000 ($2.4k)</div>
                </div>
                <div className="rounded-xl border border-border/80 bg-muted/30 p-2.5">
                  <div className="text-muted-foreground text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-primary" /> CLOUD COST
                  </div>
                  <div className="font-bold text-foreground text-xs">₹0 / Month</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5 mb-2">
                  <Code2 className="h-4 w-4 text-primary" /> Core Technical Features
                </h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-foreground">Realtime Conductor Gate QR Scanner (`jsQR`):</strong> High-speed phone camera frame decoding loop for identity verification.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
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
                  <Printer className="h-4 w-4" /> Download Printable Report (PDF)
                </button>
                <button
                  onClick={() => setShowSpecModal(false)}
                  className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-md min-h-[40px]"
                >
                  Close Spec Sheet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
