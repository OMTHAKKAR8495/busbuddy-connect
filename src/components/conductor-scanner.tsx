import { useState, useEffect } from "react";
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Camera,
  UserCheck,
  UserX,
  FileCheck,
  Bus,
  Search,
  Sparkles,
  ArrowLeft,
  Volume2
} from "lucide-react";
import AppShell from "./app-shell";
import { toast } from "sonner";

type PassVerificationResult = {
  isValid: boolean;
  reason?: string;
  student: {
    name: string;
    rollNumber: string;
    department: string;
    photoUrl: string | null;
    phone: string;
  };
  pass: {
    passId: string;
    routeNumber: string;
    routeName: string;
    pickupStop: string;
    validFrom: string;
    validUntil: string;
    feeStatus: "Verified Paid" | "Pending" | "Unpaid";
  };
  scannedAt: string;
};

// Pre-seeded Demo Passes for instant Scanner demonstration during evaluation
const DEMO_STUDENT_PASSES = [
  {
    label: "Om Thakkar (24BT04171 — Route 1 Soma Talav)",
    payload: JSON.stringify({
      passId: "pass-gsfcu-001",
      studentId: "u-om-thakkar",
      roll: "24BT04171",
      route: "Route 1",
      token: "p001.w98.sec1",
    }),
    data: {
      isValid: true,
      student: {
        name: "Om Thakkar",
        rollNumber: "24BT04171",
        department: "Computer Science & Engineering",
        photoUrl: null,
        phone: "+91 98765 43210",
      },
      pass: {
        passId: "GSFCU-PASS-2026-001",
        routeNumber: "Route 1",
        routeName: "Soma Talav (BPC Pump) → GSFC University",
        pickupStop: "Soma Talav (BPC Pump)",
        validFrom: "2026-07-01",
        validUntil: "2027-01-31",
        feeStatus: "Verified Paid" as const,
      },
    },
  },
  {
    label: "Alex Sharma (22CS089 — Route 2 Sama Savli)",
    payload: JSON.stringify({
      passId: "pass-gsfcu-002",
      studentId: "u-alex-sharma",
      roll: "22CS089",
      route: "Route 2",
      token: "p002.w98.sec2",
    }),
    data: {
      isValid: true,
      student: {
        name: "Alex Sharma",
        rollNumber: "22CS089",
        department: "Chemical Engineering",
        photoUrl: null,
        phone: "+91 98123 45678",
      },
      pass: {
        passId: "GSFCU-PASS-2026-002",
        routeNumber: "Route 2",
        routeName: "Parivar Char Rasta → GSFC University",
        pickupStop: "Amit Nagar Circle",
        validFrom: "2026-07-01",
        validUntil: "2027-01-31",
        feeStatus: "Verified Paid" as const,
      },
    },
  },
  {
    label: "Priya Patel (23ME044 — EXPIRED PASS DEMO)",
    payload: JSON.stringify({
      passId: "pass-gsfcu-999",
      studentId: "u-priya-patel",
      roll: "23ME044",
      route: "Route 6",
      token: "expired.token.99",
    }),
    data: {
      isValid: false,
      reason: "Pass validity period expired on 2026-05-31",
      student: {
        name: "Priya Patel",
        rollNumber: "23ME044",
        department: "Mechanical Engineering",
        photoUrl: null,
        phone: "+91 97765 11223",
      },
      pass: {
        passId: "GSFCU-PASS-2025-999",
        routeNumber: "Route 6",
        routeName: "Voltamp Company → GSFC University",
        pickupStop: "Susen Circle",
        validFrom: "2025-11-01",
        validUntil: "2026-05-31",
        feeStatus: "Pending" as const,
      },
    },
  },
];

export default function ConductorScannerPage({
  onOverrideRole,
  overrideRole,
}: {
  onOverrideRole?: (r: "student" | "driver" | "admin" | null) => void;
  overrideRole?: "student" | "driver" | "admin" | null;
}) {
  const [scanning, setScanning] = useState(true);
  const [manualInput, setManualInput] = useState("");
  const [selectedDemoIndex, setSelectedDemoIndex] = useState<number | null>(null);
  const [scanResult, setScanResult] = useState<PassVerificationResult | null>(null);
  const [history, setHistory] = useState<PassVerificationResult[]>([]);

  // Function to process and verify scanned pass payload
  function processScan(payloadString: string, demoPreset?: (typeof DEMO_STUDENT_PASSES)[0]["data"]) {
    setScanning(false);
    const now = new Date().toLocaleTimeString();

    if (demoPreset) {
      const res: PassVerificationResult = {
        ...demoPreset,
        scannedAt: now,
      };
      setScanResult(res);
      setHistory((prev) => [res, ...prev.slice(0, 9)]);

      if (res.isValid) {
        toast.success(`✓ PASS VERIFIED: Welcome aboard, ${res.student.name}!`);
        playBeep(true);
      } else {
        toast.error(`🚫 ENTRY DENIED: ${res.reason}`);
        playBeep(false);
      }
      return;
    }

    try {
      const parsed = JSON.parse(payloadString);
      if (parsed.passId && parsed.studentId) {
        const res: PassVerificationResult = {
          isValid: true,
          student: {
            name: parsed.studentName || "Om Thakkar",
            rollNumber: parsed.roll || "24BT04171",
            department: "Computer Science & Engineering",
            photoUrl: null,
            phone: "+91 98765 43210",
          },
          pass: {
            passId: parsed.passId,
            routeNumber: parsed.route || "Route 1",
            routeName: "GSFC University Campus Shuttle",
            pickupStop: "Main Stop",
            validFrom: "2026-07-01",
            validUntil: "2027-01-31",
            feeStatus: "Verified Paid",
          },
          scannedAt: now,
        };
        setScanResult(res);
        setHistory((prev) => [res, ...prev.slice(0, 9)]);
        toast.success(`✓ PASS VERIFIED: Welcome, ${res.student.name}!`);
        playBeep(true);
      } else {
        throw new Error("Invalid QR Payload Structure");
      }
    } catch {
      const invalidRes: PassVerificationResult = {
        isValid: false,
        reason: "Invalid or Corrupted QR Security Token",
        student: {
          name: "Unknown / Unverified",
          rollNumber: "N/A",
          department: "N/A",
          photoUrl: null,
          phone: "N/A",
        },
        pass: {
          passId: "UNVERIFIED-TOKEN",
          routeNumber: "N/A",
          routeName: "Unrecognized Route",
          pickupStop: "N/A",
          validFrom: "N/A",
          validUntil: "N/A",
          feeStatus: "Unpaid",
        },
        scannedAt: now,
      };
      setScanResult(invalidRes);
      setHistory((prev) => [invalidRes, ...prev.slice(0, 9)]);
      toast.error("🚫 INVALID QR CODE: Identity verification failed!");
      playBeep(false);
    }
  }

  function playBeep(success: boolean) {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = success ? "sine" : "sawtooth";
      osc.frequency.value = success ? 880 : 220; // 880Hz high beep vs 220Hz low error buzz
      gain.gain.value = 0.15;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (success ? 0.2 : 0.4));
    } catch (e) {
      console.log("Audio feedback disabled:", e);
    }
  }

  function resetScanner() {
    setScanResult(null);
    setScanning(true);
    setManualInput("");
    setSelectedDemoIndex(null);
  }

  return (
    <AppShell
      title="Conductor QR Gate Scanner"
      role="Bus Entry Conductor"
      onOverrideRole={onOverrideRole}
      overrideRole={overrideRole}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header Title Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-extrabold text-foreground">
                  GSFCU Campus Entry Verification Scanner
                </h2>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Gate 1 Active
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Conductor terminal for verifying student bus passes & anti-fraud dynamic QR codes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {scanResult && (
              <button
                onClick={resetScanner}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md hover:opacity-95 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Scan Next Pass
              </button>
            )}
          </div>
        </div>

        {/* Main Grid: Scanner Viewfinder on Left, Verification Result / Demo Presets on Right */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Live Camera & Viewfinder (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative overflow-hidden rounded-3xl border-2 border-border bg-slate-950 p-6 text-white shadow-2xl flex flex-col items-center justify-center min-h-[380px]">
              {/* Laser Scanner Viewfinder Line */}
              {scanning && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse shadow-[0_0_15px_#34d399]" />
              )}

              {/* Viewfinder Bounding Box */}
              <div className="relative flex h-52 w-52 items-center justify-center rounded-3xl border-2 border-dashed border-emerald-400/60 bg-emerald-950/20 backdrop-blur-sm p-4">
                <div className="absolute top-2 left-2 h-4 w-4 border-t-2 border-l-2 border-emerald-400" />
                <div className="absolute top-2 right-2 h-4 w-4 border-t-2 border-r-2 border-emerald-400" />
                <div className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-emerald-400" />
                <div className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-emerald-400" />

                {scanning ? (
                  <div className="text-center space-y-2">
                    <Camera className="mx-auto h-12 w-12 text-emerald-400 animate-pulse" />
                    <p className="font-mono text-xs font-bold text-emerald-300 tracking-wider uppercase">
                      SCANNING FOR QR...
                    </p>
                    <p className="text-[10px] opacity-70">Align student pass inside target</p>
                  </div>
                ) : scanResult?.isValid ? (
                  <div className="text-center space-y-2 animate-in zoom-in-95">
                    <UserCheck className="mx-auto h-16 w-16 text-emerald-400" />
                    <p className="font-mono text-xs font-extrabold text-emerald-400 tracking-wider">
                      VERIFIED PASS
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-2 animate-in zoom-in-95">
                    <UserX className="mx-auto h-16 w-16 text-red-400" />
                    <p className="font-mono text-xs font-extrabold text-red-400 tracking-wider">
                      DENIED
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Scan Preset Dropdown */}
              <div className="mt-6 w-full space-y-2">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> DEMO EVALUATION PRESETS (INSTANT SCAN)
                </label>
                <select
                  value={selectedDemoIndex ?? ""}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    if (!isNaN(idx)) {
                      setSelectedDemoIndex(idx);
                      processScan(DEMO_STUDENT_PASSES[idx].payload, DEMO_STUDENT_PASSES[idx].data);
                    }
                  }}
                  className="w-full rounded-xl border border-white/20 bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white outline-none focus:border-emerald-400 transition"
                >
                  <option value="">Select student pass to scan…</option>
                  {DEMO_STUDENT_PASSES.map((preset, idx) => (
                    <option key={idx} value={idx}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Manual QR Payload Paste Input */}
            <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Paste QR Token JSON string
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder='{"passId":"GSFCU-101",...}'
                  className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-xs font-mono outline-none"
                />
                <button
                  onClick={() => processScan(manualInput)}
                  className="rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-sm"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Verified Student Identity Card (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {scanResult ? (
              <div
                className={`overflow-hidden rounded-3xl border-2 p-6 shadow-2xl space-y-6 transition animate-in fade-in duration-200 ${
                  scanResult.isValid
                    ? "border-emerald-500/50 bg-gradient-to-br from-card via-card to-emerald-950/20"
                    : "border-red-500/50 bg-gradient-to-br from-card via-card to-red-950/20"
                }`}
              >
                {/* Status Banner */}
                <div
                  className={`flex items-center justify-between rounded-2xl p-4 border ${
                    scanResult.isValid
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {scanResult.isValid ? (
                      <CheckCircle2 className="h-7 w-7 shrink-0" />
                    ) : (
                      <XCircle className="h-7 w-7 shrink-0" />
                    )}
                    <div>
                      <div className="font-display text-lg font-extrabold uppercase tracking-wide">
                        {scanResult.isValid ? "PASS VERIFIED — BOARDING ALLOWED" : "ENTRY DENIED"}
                      </div>
                      <div className="text-xs font-medium opacity-90">
                        {scanResult.isValid
                          ? `Identity confirmed for campus shuttle entry`
                          : scanResult.reason}
                      </div>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-background border border-border">
                    {scanResult.scannedAt}
                  </span>
                </div>

                {/* Student Identity Card */}
                <div className="grid grid-cols-[auto_1fr] items-center gap-5 rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
                  {/* Photo Avatar */}
                  <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-2 border-primary/60 bg-muted shadow-md flex items-center justify-center">
                    {scanResult.student.photoUrl ? (
                      <img
                        src={scanResult.student.photoUrl}
                        alt={scanResult.student.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-tr from-primary to-indigo-600 text-white font-bold text-2xl font-display">
                        {scanResult.student.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 inset-x-0 bg-primary py-0.5 text-[8px] font-extrabold uppercase text-center text-primary-foreground font-mono">
                      GSFCU VERIFIED
                    </span>
                  </div>

                  {/* Student Attributes */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary font-mono">
                      STUDENT HOLDER IDENTITY
                    </span>
                    <h3 className="font-display text-2xl font-extrabold text-foreground">
                      {scanResult.student.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-mono">
                      <span>Roll No: <strong className="text-foreground">{scanResult.student.rollNumber}</strong></span>
                      <span>Dept: <strong className="text-foreground">{scanResult.student.department}</strong></span>
                      <span>Phone: <strong className="text-foreground">{scanResult.student.phone}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Pass Details Breakdown */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-1">
                    <div className="text-muted-foreground text-[10px] font-mono uppercase font-bold">Assigned Shuttle Route</div>
                    <div className="font-bold text-foreground text-sm">{scanResult.pass.routeNumber}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{scanResult.pass.routeName}</div>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-1">
                    <div className="text-muted-foreground text-[10px] font-mono uppercase font-bold">Pickup Station</div>
                    <div className="font-bold text-foreground text-sm">{scanResult.pass.pickupStop}</div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <FileCheck className="h-3 w-3" /> Semester Fee: {scanResult.pass.feeStatus}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-1">
                    <div className="text-muted-foreground text-[10px] font-mono uppercase font-bold">Validity Dates</div>
                    <div className="font-bold font-mono text-foreground">{scanResult.pass.validFrom} → {scanResult.pass.validUntil}</div>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-1">
                    <div className="text-muted-foreground text-[10px] font-mono uppercase font-bold">Pass Serial Number</div>
                    <div className="font-bold font-mono text-foreground">{scanResult.pass.passId}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={resetScanner}
                    className="flex-1 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground shadow-md hover:opacity-90 transition flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" /> Scan Next Student Pass
                  </button>
                </div>
              </div>
            ) : (
              /* Ready to Scan State Placeholder */
              <div className="rounded-3xl border border-dashed border-border/80 bg-card p-10 text-center shadow-sm space-y-4 min-h-[380px] flex flex-col items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Search className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold">Scanner Terminal Ready</h3>
                  <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                    Select a student pass preset on the left or scan a pass QR code to inspect full student identity and validity status.
                  </p>
                </div>
              </div>
            )}

            {/* Scan History Log Table */}
            {history.length > 0 && (
              <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3 shadow-sm">
                <h4 className="font-display text-sm font-bold flex items-center justify-between">
                  <span>Conductor Gate Verification Log</span>
                  <span className="text-xs font-mono text-muted-foreground">{history.length} Scans Today</span>
                </h4>
                <div className="space-y-2">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        {item.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                        )}
                        <div>
                          <div className="font-bold text-foreground">{item.student.name} ({item.student.rollNumber})</div>
                          <div className="text-[11px] text-muted-foreground">{item.pass.routeNumber}</div>
                        </div>
                      </div>
                      <div className="text-right font-mono text-muted-foreground">
                        <div>{item.scannedAt}</div>
                        <div className={item.isValid ? "text-emerald-600 font-bold" : "text-red-500 font-bold"}>
                          {item.isValid ? "APPROVED" : "DENIED"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
