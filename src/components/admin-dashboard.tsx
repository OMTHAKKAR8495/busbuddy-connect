import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { signOutAndClearAppStorage, supabase } from "@/integrations/supabase/client";
import AppShell from "./app-shell";
import LiveMap from "./live-map";
import { toast } from "sonner";
import { inviteStaff, reviewPassApplication } from "@/lib/admin.functions";
import { QRCodeSVG } from "qrcode.react";
import {
  Check,
  X,
  Users,
  Route as RouteIcon,
  Bus as BusIcon,
  Activity,
  ShieldCheck,
  BarChart3,
  Plus,
  Clock,
  Gauge,
  AlertTriangle,
  FileCheck,
  QrCode,
  Eye,
  Ban,
  Sparkles,
  CheckCircle2,
  IdCard,
  KeyRound,
  Edit,
  Printer,
  Download,
  RefreshCw,
  Search,
  Filter,
  MapPin,
  Navigation,
  Compass,
  ExternalLink,
  Map as MapIcon,
  Layers,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Smartphone,
  Apple,
  Play,
  Zap,
  LogOut,
} from "lucide-react";

type User = { userId: string; role: "admin"; profile: { full_name: string } };

export default function AdminDashboard({
  user,
  onOverrideRole,
  overrideRole,
}: {
  user: User;
  onOverrideRole?: (r: "student" | "driver" | "admin" | "scanner" | null) => void;
  overrideRole?: "student" | "driver" | "admin" | "scanner" | null;
}) {
  const [tab, setTab] = useState<"fleet" | "passes" | "driver-id-passes" | "routes" | "analytics" | "attendance" | "driver-shifts">("fleet");
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") || localStorage.getItem("theme") !== "light";
    }
    return true;
  });

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSignOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("gsfc_admin_auth_session");
      localStorage.removeItem("gsfc_admin_auth");
    }
    try {
      await signOutAndClearAppStorage();
    } catch (e) {}
    toast.success("🔒 Admin session ended. Portal locked.");
    window.location.href = "/auth";
  };

  return (
    <AppShell
      title="Transport Admin HQ"
      role={`Admin · ${user.profile.full_name}`}
      onOverrideRole={onOverrideRole}
      overrideRole={overrideRole}
    >
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Left Sidebar Navigation - Expanded & Professional */}
        <aside className="w-full lg:w-72 lg:shrink-0 lg:sticky lg:top-20 z-10">
          <div className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-md backdrop-blur-md space-y-3">
            <div className="hidden lg:flex items-center justify-between px-2 pt-1 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-foreground">HQ Modules</div>
                  <div className="text-[9px] text-muted-foreground font-mono">13 Campus Routes Live</div>
                </div>
              </div>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 scrollbar-none">
              {[
                { k: "fleet", l: "Fleet Command Map", i: Activity, desc: "Realtime GPS & buses" },
                { k: "driver-id-passes", l: "Driver ID & Pass Manager", i: IdCard, desc: "Credentials & licenses" },
                { k: "passes", l: "Student Pass Management", i: Users, desc: "Verifications & fees" },
                { k: "routes", l: "Route & Stop Manager", i: RouteIcon, desc: "All 13 campus routes" },
                { k: "driver-shifts", l: "Driver Shift Logs", i: Clock, desc: "Shift times & audits" },
                { k: "attendance", l: "Student Attendance & CSV", i: FileCheck, desc: "Boarding & scan history" },
                { k: "analytics", l: "Fleet Analytics", i: BarChart3, desc: "Fleet telemetry metrics" },
              ].map((t) => {
                const isActive = tab === t.k;
                return (
                  <button
                    key={t.k}
                    onClick={() => setTab(t.k as never)}
                    className={`group flex shrink-0 lg:w-full items-center gap-3 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-semibold transition-all text-left ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 translate-x-0.5"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                        isActive
                          ? "bg-primary-foreground/15 text-primary-foreground"
                          : "bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary"
                      }`}
                    >
                      <t.i className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold tracking-tight">{t.l}</div>
                      <div
                        className={`hidden lg:block text-[10px] font-normal truncate mt-0.5 ${
                          isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                        }`}
                      >
                        {t.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
            {/* Quick Actions in HQ Modules Sidebar */}
            <div className="pt-2 border-t border-border/60 flex flex-col gap-2">
              <button
                onClick={toggleTheme}
                className="flex w-full items-center justify-between rounded-xl border border-border/80 bg-background/70 px-3.5 py-2.5 text-xs font-bold text-foreground shadow-sm transition hover:bg-muted active:scale-[0.98]"
                title="Toggle Light / Dark Mode"
              >
                <div className="flex items-center gap-2.5">
                  {isDark ? (
                    <Sun className="h-4 w-4 text-amber-400 fill-amber-400 shrink-0" />
                  ) : (
                    <Moon className="h-4 w-4 text-indigo-500 fill-indigo-500 shrink-0" />
                  )}
                  <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">Theme</span>
              </button>

              <button
                onClick={() => setShowInstallModal(true)}
                className="flex w-full items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 shadow-sm transition hover:bg-emerald-500/20 active:scale-[0.98]"
                title="Download GSFCU Mobile App"
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Get Mobile App</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Install</span>
              </button>

              <button
                onClick={handleSignOut}
                className="flex w-full items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 shadow-sm transition hover:bg-rose-500/20 active:scale-[0.98]"
                title="Sign out of Transport Admin HQ"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>Sign Out</span>
                </div>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-mono">Exit</span>
              </button>
            </div>

            {/* Quick System Info in Sidebar Footer */}
            <div className="hidden lg:block pt-2 border-t border-border/60 px-2 text-[11px] text-muted-foreground space-y-1 font-mono">
              <div className="flex items-center justify-between text-[10px]">
                <span>System Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Online 100%</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span>Active Terminal</span>
                <span className="font-bold text-foreground">Vadodara HQ</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 w-full min-w-0">
          {tab === "fleet" && <FleetTab />}
          {tab === "driver-id-passes" && <DriverIdPassesTab />}
          {tab === "passes" && <PassesTab />}
          {tab === "routes" && <RoutesTab />}
          {tab === "driver-shifts" && <DriverShiftLogsTab />}
          {tab === "attendance" && <AttendancePanel />}
          {tab === "analytics" && <AnalyticsTab />}
        </section>
      </div>

      {/* App Store & Play Store Download Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6 my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-extrabold">Download GSFCU Mobile App</h3>
                  <p className="text-xs text-muted-foreground">Official App Store & Google Play Store Links</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="rounded-full bg-muted p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="https://apps.apple.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-3.5 text-white shadow-md hover:bg-slate-800 transition group"
                >
                  <Apple className="h-7 w-7 shrink-0 text-white group-hover:scale-110 transition" />
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Download on the</div>
                    <div className="text-sm font-extrabold leading-tight">Apple App Store</div>
                  </div>
                </a>

                <a
                  href="https://play.google.com/store"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-emerald-600/40 bg-slate-900 p-3.5 text-white shadow-md hover:bg-slate-800 transition group"
                >
                  <Play className="h-7 w-7 shrink-0 text-emerald-400 fill-emerald-400 group-hover:scale-110 transition" />
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">GET IT ON</div>
                    <div className="text-sm font-extrabold leading-tight">Google Play Store</div>
                  </div>
                </a>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2 text-xs">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-500" /> Instant Mobile App (No App Store Login Needed)
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Open <strong>https://busbuddy-connect.vercel.app</strong> on your phone and tap <strong>Add to Home Screen</strong> to install the full mobile app instantly!
                </p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowInstallModal(false)}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-md min-h-[40px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function FleetTab() {
  const { data: buses = [] } = useQuery({
    queryKey: ["all-buses"],
    queryFn: async () =>
      (await supabase.from("buses").select("id, bus_number, route_id, routes(route_number, polyline)")).data ?? [],
  });
  const { data: activeTrips = [] } = useQuery({
    queryKey: ["active-trips"],
    queryFn: async () => (await supabase.from("trips").select("id, bus_id").eq("active", true)).data ?? [],
  });
  const [locs, setLocs] = useState<Record<string, { lat: number; lng: number; speed?: number | null; heading?: number | null }>>({});

  useEffect(() => {
    supabase.from("latest_bus_locations").select("*").then(({ data }) => {
      if (!data) return;
      const map: typeof locs = {};
      data.forEach((r) => {
        map[r.bus_id as string] = { lat: r.lat as number, lng: r.lng as number, speed: r.speed, heading: r.heading };
      });
      setLocs(map);
    });

    const ch = supabase
      .channel("admin-locs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bus_locations" }, (payload) => {
        const r = payload.new as { bus_id: string; lat: number; lng: number; speed?: number; heading?: number };
        setLocs((p) => ({ ...p, [r.bus_id]: { lat: r.lat, lng: r.lng, speed: r.speed, heading: r.heading } }));
      })
      .subscribe();

    const handleTelemetry = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.lat) {
        setLocs((p) => ({
          ...p,
          [detail.bus_id || "bus-01"]: { lat: detail.lat, lng: detail.lng, speed: detail.speed, heading: detail.heading },
        }));
      }
    };
    window.addEventListener("gsfc_live_telemetry_event", handleTelemetry);
    const stored = localStorage.getItem("gsfc_live_telemetry");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.lat) {
          setLocs((p) => ({
            ...p,
            [parsed.bus_id || "bus-01"]: { lat: parsed.lat, lng: parsed.lng, speed: parsed.speed, heading: parsed.heading },
          }));
        }
      } catch (err) { }
    }

    return () => {
      supabase.removeChannel(ch);
      window.removeEventListener("gsfc_live_telemetry_event", handleTelemetry);
    };
  }, []);

  const activeBusIds = new Set(activeTrips.map((t) => t.bus_id));
  const points = buses
    .filter((b) => locs[b.id])
    .map((b) => ({ bus_id: b.id, label: `Bus ${b.bus_number}`, ...locs[b.id] }));

  const routes = Array.from(
    new Map(buses.filter((b) => b.routes?.polyline).map((b) => [b.route_id, b.routes])).values()
  );

  const [showMap, setShowMap] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Fleet Stat Widgets */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total Registered Fleet" value={`${buses.length} Buses`} />
        <Stat label="Active Shifts in Transit" value={`${activeTrips.length} Active`} />
        <Stat label="GPS Telemetry Streaming" value={`${points.length} Live`} />
        <Stat label="Fleet Punctuality Rate" value="98.5%" />
      </div>

      {/* Fleet Command Radar Map - Optional Expandable View */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm transition-all">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <MapIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-foreground">
                  Fleet Command Radar Map
                </h3>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {points.length > 0 ? `${points.length} Live Satellites` : "13 Routes Ready"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Interactive real-time GPS telemetry radar across Vadodara & GSFC University campus corridor.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showMap && (
              <button
                onClick={() => setMapExpanded(!mapExpanded)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition"
                title={mapExpanded ? "Reset Map Height" : "Expand Map Height"}
              >
                {mapExpanded ? (
                  <>
                    <Minimize2 className="h-3.5 w-3.5" /> Compact
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3.5 w-3.5" /> Expand
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => setShowMap(!showMap)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm ${
                showMap
                  ? "bg-muted text-foreground border border-border hover:bg-muted/80"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
              }`}
            >
              {showMap ? (
                <>
                  <ChevronUp className="h-4 w-4" /> Hide Live Map
                </>
              ) : (
                <>
                  <MapIcon className="h-4 w-4" /> View Live GPS Map
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collapsed State Quick Preview Bar */}
        {!showMap ? (
          <div className="mt-4 rounded-xl border border-dashed border-border/80 bg-muted/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Navigation className="h-4 w-4 animate-spin-slow" />
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">Map rendering is currently on-demand</div>
                <div className="text-[11px] text-muted-foreground">
                  Click &ldquo;View Live GPS Map&rdquo; to launch full Leaflet GPS radar with live speed, direction & stop nodes.
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowMap(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              Launch Live Map Radar <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-xl overflow-hidden border border-border/80 animate-in fade-in zoom-in-95 duration-200">
            <LiveMap
              buses={points}
              routes={routes.map((r) => ({ polyline: (r?.polyline as [number, number][]) ?? [], color: "#3b82f6" }))}
              height={mapExpanded ? 720 : 480}
            />
          </div>
        )}
      </div>

      {/* All Route Buses & Master Fleet Matrix */}
      <AllRouteBusesFleetMatrix />

      {/* Driver Shift Start & Stop Time Audit Table */}
      <DriverShiftAuditLogsSection />
    </div>
  );
}

// === ALL 13 OFFICIAL GSFCU ROUTE BUSES MASTER FLEET MATRIX ===
const OFFICIAL_13_ROUTE_BUSES = [
  {
    routeNumber: "Route R1",
    routeName: "Soma Talav (BPC Pump) → GSFC University",
    busNumber: "Bus #01",
    busPlate: "GJ-16-AU-4788",
    departureTime: "07:30 AM",
    depotStop: "Soma Talav (BPC Pump)",
    defaultDriver: "Om Thakkar",
    stopsCount: 5,
    speed: "42 km/h",
    status: "Active 🟢",
    via: "Gurukul, Bapod Police St, Super Bakery",
  },
  {
    routeNumber: "Route R2",
    routeName: "Parivar Char Rasta → GSFC University",
    busNumber: "Bus #02",
    busPlate: "GJ-06-BX-3670",
    departureTime: "07:35 AM",
    depotStop: "Parivar Char Rasta",
    defaultDriver: "Ramesh Patel",
    stopsCount: 6,
    speed: "38 km/h",
    status: "Active 🟢",
    via: "Vrundavan Circle, Sardar Estate, Earth Icon, Amit Nagar",
  },
  {
    routeNumber: "Route R3",
    routeName: "Khodiyar Nagar (50 Seater) → GSFC University",
    busNumber: "Bus #03",
    busPlate: "GJ-06-BV-2875",
    departureTime: "07:25 AM",
    depotStop: "Khodiyar Nagar",
    defaultDriver: "Mahesh Singh",
    stopsCount: 6,
    speed: "35 km/h",
    status: "Active 🟢",
    via: "Airport Circle, Harni Gada, Golden Chokadi, Dena",
  },
  {
    routeNumber: "Route R4",
    routeName: "Chankypuri → GSFC University",
    busNumber: "Bus #04",
    busPlate: "GJ-06-AX-3348",
    departureTime: "07:40 AM",
    depotStop: "Chankypuri",
    defaultDriver: "Suresh Kumar",
    stopsCount: 4,
    speed: "40 km/h",
    status: "Active 🟢",
    via: "Abhilasha Char Rasta, Military Boys",
  },
  {
    routeNumber: "Route R5",
    routeName: "Earth Icon → GSFC University",
    busNumber: "Bus #05",
    busPlate: "GJ-16-AU-4890",
    departureTime: "07:45 AM",
    depotStop: "Earth Icon",
    defaultDriver: "Vikram Parmar",
    stopsCount: 5,
    speed: "36 km/h",
    status: "Active 🟢",
    via: "Jagdish Farshan, Amit Nagar, L & T Circle",
  },
  {
    routeNumber: "Route R6",
    routeName: "Voltamp Company → GSFC University",
    busNumber: "Bus #06",
    busPlate: "GJ-06-BV-7584",
    departureTime: "07:15 AM",
    depotStop: "Voltamp Company",
    defaultDriver: "Ketan Solanki",
    stopsCount: 6,
    speed: "34 km/h",
    status: "Active 🟢",
    via: "Maneja Crossing, Hanuman Temple, Novino, Susen Circle",
  },
  {
    routeNumber: "Route R7",
    routeName: "Ravi Park → GSFC University",
    busNumber: "Bus #07",
    busPlate: "GJ-16-AU-1390",
    departureTime: "07:30 AM",
    depotStop: "Ravi Park",
    defaultDriver: "Dinesh Varma",
    stopsCount: 5,
    speed: "39 km/h",
    status: "Active 🟢",
    via: "Gangasagar, Kabir Complex, Polo Ground",
  },
  {
    routeNumber: "Route R8",
    routeName: "Darbar Chowkdi → GSFC University",
    busNumber: "Bus #08",
    busPlate: "GJ-06-BV-7989",
    departureTime: "07:20 AM",
    depotStop: "Darbar Chowkdi",
    defaultDriver: "Prakash Jha",
    stopsCount: 6,
    speed: "37 km/h",
    status: "Active 🟢",
    via: "Pramukh Prasad, Avdhut Fatak, Kalaghoda, Mahesana Nagar",
  },
  {
    routeNumber: "Route R9",
    routeName: "Sarswati Complex → GSFC University",
    busNumber: "Bus #09",
    busPlate: "GJ-06-BV-2915",
    departureTime: "07:25 AM",
    depotStop: "Sarswati Complex",
    defaultDriver: "Bharat Thakor",
    stopsCount: 7,
    speed: "41 km/h",
    status: "Active 🟢",
    via: "Tulsidham, Raj Mahal Gate, Fatehgunj, Yogniketan, Nizampura",
  },
  {
    routeNumber: "Route R10",
    routeName: "Khishcoli Circle → GSFC University",
    busNumber: "Bus #10",
    busPlate: "GJ-16-AU-3840",
    departureTime: "07:15 AM",
    depotStop: "Khishcoli Circle",
    defaultDriver: "Jayesh Rathod",
    stopsCount: 6,
    speed: "33 km/h",
    status: "Active 🟢",
    via: "Atladra, KIA Motors, Sun Pharma Road, Tandalja",
  },
  {
    routeNumber: "Route R11",
    routeName: "Hari Nagar Char Rasta → GSFC University",
    busNumber: "Bus #11",
    busPlate: "GJ-06-AX-1826",
    departureTime: "07:20 AM",
    depotStop: "Hari Nagar Char Rasta",
    defaultDriver: "Naresh Gohil",
    stopsCount: 8,
    speed: "44 km/h",
    status: "Active 🟢",
    via: "Nandalay Circle, Zansi Ki Rani, Jain Derasar, Dashama Chokdi, ITI Gorwa, Panchwati",
  },
  {
    routeNumber: "Route R12",
    routeName: "Akshar Chowk → GSFC University",
    busNumber: "Bus #12",
    busPlate: "GJ-06-BV-6129",
    departureTime: "07:10 AM",
    depotStop: "Akshar Chowk",
    defaultDriver: "Alpesh Vaghela",
    stopsCount: 9,
    speed: "38 km/h",
    status: "Active 🟢",
    via: "Devdeep Nagar, Vasna Circle, Swaminarayan Mandir, Time Circle, Chhani Jakat Naka, Canal",
  },
  {
    routeNumber: "Route R13",
    routeName: "Nilamber Circle → GSFC University",
    busNumber: "Bus #13",
    busPlate: "GJ-06-BV-6527",
    departureTime: "07:25 AM",
    depotStop: "Nilamber Circle",
    defaultDriver: "Hitesh Joshi",
    stopsCount: 7,
    speed: "30 km/h",
    status: "Active 🟢",
    via: "Yash Complex, Natubhai Circle, Chakli Circle, Trident Circle, Genda Circle",
  },
];

function AllRouteBusesFleetMatrix() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepot, setFilterDepot] = useState("all");

  const filteredBuses = useMemo(() => {
    return OFFICIAL_13_ROUTE_BUSES.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.routeNumber.toLowerCase().includes(q) ||
        item.routeName.toLowerCase().includes(q) ||
        item.busNumber.toLowerCase().includes(q) ||
        item.busPlate.toLowerCase().includes(q) ||
        item.defaultDriver.toLowerCase().includes(q) ||
        item.depotStop.toLowerCase().includes(q);
      return matchesSearch;
    });
  }, [searchQuery]);

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary font-mono">
              ALL 13 OFFICIAL SHUTTLE ROUTES
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              100% FLEET OPERATIONAL
            </span>
          </div>
          <h3 className="font-display font-extrabold text-xl text-foreground mt-1.5 flex items-center gap-2">
            <BusIcon className="h-5 w-5 text-primary" /> Master Route Buses & Vehicle Assignment Matrix
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complete overview of all 13 official GSFC University routes (R1 to R13), assigned bus registration plates, departure depots, stop sequences, and speed compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search route, bus plate, driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-border/80 bg-muted/40 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-56 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
          <div className="text-[10px] font-bold uppercase text-muted-foreground">Total Official Routes</div>
          <div className="mt-1 font-display text-2xl font-black text-foreground">13 Lines</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">R1 through R13 Network</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
          <div className="text-[10px] font-bold uppercase text-muted-foreground">Assigned Fleet</div>
          <div className="mt-1 font-display text-2xl font-black text-primary">13 Buses</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Bus #01 to Bus #13</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
          <div className="text-[10px] font-bold uppercase text-muted-foreground">Total Transit Stops</div>
          <div className="mt-1 font-display text-2xl font-black text-emerald-600 dark:text-emerald-400">78 Stops</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Across Greater Vadodara</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
          <div className="text-[10px] font-bold uppercase text-muted-foreground">Earliest Departure</div>
          <div className="mt-1 font-display text-2xl font-black text-foreground">07:10 AM</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Route 12 (Akshar Chowk)</div>
        </div>
      </div>

      {/* Table of all Route Buses */}
      <div className="overflow-hidden rounded-xl border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-muted/50 font-bold text-muted-foreground border-b border-border/60">
                <th className="p-3.5">Route</th>
                <th className="p-3.5">Route Corridor & Destination</th>
                <th className="p-3.5">Assigned Bus</th>
                <th className="p-3.5">Vehicle Plate No.</th>
                <th className="p-3.5">Departure Depot</th>
                <th className="p-3.5">Scheduled Departure</th>
                <th className="p-3.5">Assigned Driver</th>
                <th className="p-3.5">Stops</th>
                <th className="p-3.5">Fleet Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {filteredBuses.map((item, idx) => (
                <tr key={item.routeNumber} className="hover:bg-muted/20 transition">
                  <td className="p-3.5 font-bold font-mono">
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary font-bold">
                      {item.routeNumber}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-foreground">{item.routeName}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 opacity-80">
                      Via: {item.via}
                    </div>
                  </td>
                  <td className="p-3.5 font-bold text-foreground">
                    <div className="flex items-center gap-1.5">
                      <BusIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{item.busNumber}</span>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-[11px] text-foreground">
                    <span className="rounded-md border border-border/80 bg-muted/60 px-2 py-0.5">
                      {item.busPlate}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-1 text-foreground font-semibold">
                      <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                      <span>{item.depotStop}</span>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span>{item.departureTime}</span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-1 text-foreground font-semibold">
                      <Users className="h-3 w-3 text-primary shrink-0" />
                      <span>{item.defaultDriver}</span>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-muted-foreground">
                    {item.stopsCount} Stops
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DriverShiftAuditLogsSection() {
  const [shifts, setShifts] = useState<any[]>([]);

  useEffect(() => {
    const loadShifts = async () => {
      let localShifts: any[] = [];
      try {
        localShifts = JSON.parse(localStorage.getItem("gsfcu_driver_shifts") || "[]");
      } catch (e) {
        localShifts = [];
      }

      const seedShifts = [
        {
          id: "shift-demo-01",
          driver_name: "Om Thakkar",
          bus_number: "Bus #01",
          bus_plate: "GJ-06-AX-1001",
          route_number: "Route R1",
          route_name: "Soma Talav → GSFC Campus",
          start_location: "Soma Talav Depot",
          punch_in_coords: "22.28910, 73.23820",
          shift_start_time: "07:30 AM",
          shift_stop_time: "In Transit 🟢",
          shift_day: "Tuesday",
          shift_date: "July 28, 2026",
        },
        {
          id: "shift-demo-02",
          driver_name: "Ramesh Patel",
          bus_number: "Bus #04",
          bus_plate: "GJ-06-AX-1004",
          route_number: "Route R2",
          route_name: "Sama Savli Road → GSFC Campus",
          start_location: "Parivar Char Rasta",
          punch_in_coords: "22.30200, 73.22600",
          shift_start_time: "07:45 AM",
          shift_stop_time: "In Transit 🟢",
          shift_day: "Tuesday",
          shift_date: "July 28, 2026",
        },
        {
          id: "shift-demo-03",
          driver_name: "Suresh Kumar",
          bus_number: "Bus #02",
          bus_plate: "GJ-06-AX-1002",
          route_number: "Route R4",
          route_name: "Maneja → Makarpura → GSFC",
          start_location: "Voltamp / Maneja Depot",
          punch_in_coords: "22.24100, 73.19400",
          punch_out_coords: "22.38000, 73.19300",
          shift_start_time: "07:15 AM",
          shift_stop_time: "05:15 PM 🛑 (Completed)",
          shift_day: "Monday",
          shift_date: "July 27, 2026",
        },
      ];

      try {
        const { data } = await (supabase as any).from("driver_shift_logs_july_2026").select("*").order("created_at", { ascending: false });
        const dbShifts = data ?? [];
        const combined = [...localShifts, ...dbShifts, ...seedShifts];
        const unique = Array.from(new Map(combined.map((s) => [s.driver_name + (s.shift_start_time || "") + (s.shift_date || ""), s])).values());
        setShifts(unique);
      } catch (e) {
        const combined = [...localShifts, ...seedShifts];
        const unique = Array.from(new Map(combined.map((s) => [s.driver_name + (s.shift_start_time || ""), s])).values());
        setShifts(unique);
      }
    };

    loadShifts();
    const timer = setInterval(loadShifts, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            LIVE DRIVER SHIFT & TELEMETRY AUDIT LOGS
          </span>
          <h3 className="font-display font-extrabold text-lg text-foreground mt-1 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Driver Shift Start & Stop Time Records
          </h3>
          <p className="text-xs text-muted-foreground">
            Master records of which driver logged in where (GPS coordinates / depot stop) and exact time shift was started.
          </p>
        </div>
        <span className="text-xs font-bold font-mono rounded-xl bg-muted px-3 py-1.5 border border-border/60">
          {shifts.length} Total Driver Shifts
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-muted/50 font-bold text-muted-foreground border-b border-border/60">
                <th className="p-3.5">Driver Name</th>
                <th className="p-3.5">Bus & Plate</th>
                <th className="p-3.5">Assigned Route</th>
                <th className="p-3.5">Login Location & GPS</th>
                <th className="p-3.5">Shift Start Time</th>
                <th className="p-3.5">Shift Stop Time</th>
                <th className="p-3.5">Shift Day & Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {shifts.map((s, idx) => {
                const isActive = s.shift_stop_time?.includes("In Transit") || s.shift_stop_time?.includes("🟢");
                const punchCoords = s.punch_in_coords || (s.punch_in_lat && s.punch_in_lng ? `${s.punch_in_lat}, ${s.punch_in_lng}` : "22.36550, 73.18150");
                return (
                  <tr key={s.id || idx} className="hover:bg-muted/20 transition">
                    <td className="p-3.5 font-bold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-primary shrink-0" /> {s.driver_name}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-muted-foreground">
                      {s.bus_number} <span className="text-[10px] text-muted-foreground">({s.bus_plate})</span>
                    </td>
                    <td className="p-3.5 font-semibold text-foreground">
                      {s.route_number}: {s.route_name}
                    </td>
                    <td className="p-3.5 font-mono text-[11px]">
                      <div className="flex items-center gap-1 text-foreground font-semibold">
                        <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                        <span>{s.start_location || "Origin Depot Stop"}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Navigation className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                        <span>{punchCoords}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {s.shift_start_time}
                    </td>
                    <td className="p-3.5 font-mono">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <span className="beacon-dot"></span> In Transit
                        </span>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground border border-border/60">
                            {s.shift_stop_time}
                          </span>
                          {s.punch_out_coords && (
                            <div className="text-[9px] text-muted-foreground mt-0.5 font-mono">
                              Stop: {s.punch_out_coords}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-xs text-muted-foreground font-mono">
                      {s.shift_day}, {s.shift_date || "July 28, 2026"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm glow-card">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-extrabold text-foreground">{value}</div>
    </div>
  );
}

// === DEDICATED DRIVER SHIFT LOGS TAB ===
function DriverShiftLogsTab() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadShifts = async () => {
      let localShifts: any[] = [];
      try {
        localShifts = JSON.parse(localStorage.getItem("gsfcu_driver_shifts") || "[]");
      } catch (e) {
        localShifts = [];
      }

      const seedShifts = [
        {
          id: "shift-demo-01",
          driver_name: "Om Thakkar",
          bus_number: "Bus #01",
          bus_plate: "GJ-06-AX-1001",
          route_number: "Route R1",
          route_name: "Soma Talav → GSFC Campus",
          start_location: "Soma Talav Depot",
          punch_in_coords: "22.28910, 73.23820",
          shift_start_time: "07:30 AM",
          shift_stop_time: "In Transit 🟢",
          shift_day: "Tuesday",
          shift_date: "July 28, 2026",
        },
        {
          id: "shift-demo-02",
          driver_name: "Ramesh Patel",
          bus_number: "Bus #04",
          bus_plate: "GJ-06-AX-1004",
          route_number: "Route R2",
          route_name: "Sama Savli Road → GSFC Campus",
          start_location: "Parivar Char Rasta",
          punch_in_coords: "22.30200, 73.22600",
          shift_start_time: "07:45 AM",
          shift_stop_time: "In Transit 🟢",
          shift_day: "Tuesday",
          shift_date: "July 28, 2026",
        },
        {
          id: "shift-demo-03",
          driver_name: "Suresh Kumar",
          bus_number: "Bus #02",
          bus_plate: "GJ-06-AX-1002",
          route_number: "Route R4",
          route_name: "Maneja → Makarpura → GSFC",
          start_location: "Voltamp / Maneja Depot",
          punch_in_coords: "22.24100, 73.19400",
          punch_out_coords: "22.38000, 73.19300",
          shift_start_time: "07:15 AM",
          shift_stop_time: "05:15 PM 🛑 (Completed)",
          shift_day: "Monday",
          shift_date: "July 27, 2026",
        },
        {
          id: "shift-demo-04",
          driver_name: "Mahesh Singh",
          bus_number: "Bus #03",
          bus_plate: "GJ-06-AX-1003",
          route_number: "Route R3",
          route_name: "Waghodia → GSFC Campus",
          start_location: "Khodiyar Nagar Depot",
          punch_in_coords: "22.33100, 73.22100",
          punch_out_coords: "22.38000, 73.19300",
          shift_start_time: "07:00 AM",
          shift_stop_time: "04:45 PM 🛑 (Completed)",
          shift_day: "Monday",
          shift_date: "July 27, 2026",
        },
      ];

      try {
        const { data } = await (supabase as any)
          .from("driver_shift_logs_july_2026")
          .select("*")
          .order("created_at", { ascending: false });
        const dbShifts = data ?? [];
        const combined = [...localShifts, ...dbShifts, ...seedShifts];
        const unique = Array.from(
          new Map(combined.map((s) => [s.driver_name + (s.shift_start_time || "") + (s.shift_date || ""), s])).values()
        );
        setShifts(unique);
      } catch (e) {
        const combined = [...localShifts, ...seedShifts];
        const unique = Array.from(
          new Map(combined.map((s) => [s.driver_name + (s.shift_start_time || ""), s])).values()
        );
        setShifts(unique);
      }
    };

    loadShifts();
    const timer = setInterval(loadShifts, 3000);
    return () => clearInterval(timer);
  }, [refreshKey]);

  const activeShifts = shifts.filter(
    (s) => s.shift_stop_time?.includes("In Transit") || s.shift_stop_time?.includes("🟢")
  );
  const completedShifts = shifts.filter(
    (s) => !s.shift_stop_time?.includes("In Transit") && !s.shift_stop_time?.includes("🟢")
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-emerald-500/10 via-primary/10 to-emerald-500/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              LIVE DRIVER SHIFT & TELEMETRY AUDIT
            </span>
            <h2 className="font-display text-2xl font-extrabold mt-1 flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" /> Driver Shift Start & Stop Time Logs
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Master audit of driver login locations (GPS / Depot), exact shift start times, and departure timestamps recorded from Driver Cockpit.
            </p>
          </div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:opacity-90 transition"
          >
            <Activity className="h-4 w-4" /> Refresh Logs
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="text-[10px] font-bold uppercase text-muted-foreground">Active Shifts</div>
          <div className="mt-1 font-display text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{activeShifts.length}</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">🟢 In Transit Now</p>
        </div>
        <div className="rounded-2xl border border-border/80 bg-card p-4">
          <div className="text-[10px] font-bold uppercase text-muted-foreground">Completed Shifts</div>
          <div className="mt-1 font-display text-3xl font-extrabold">{completedShifts.length}</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">🛑 Shifts Ended Today</p>
        </div>
        <div className="rounded-2xl border border-border/80 bg-card p-4">
          <div className="text-[10px] font-bold uppercase text-muted-foreground">Total Logged</div>
          <div className="mt-1 font-display text-3xl font-extrabold">{shifts.length}</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">All Drivers This Month</p>
        </div>
        <div className="rounded-2xl border border-border/80 bg-card p-4">
          <div className="text-[10px] font-bold uppercase text-muted-foreground">Fleet Coverage</div>
          <div className="mt-1 font-display text-3xl font-extrabold text-primary">
            {shifts.length > 0 ? Math.min(100, Math.round((activeShifts.length / Math.max(1, shifts.length)) * 100) + 67) : 0}%
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Route Coverage Rate</p>
        </div>
      </div>

      {/* Active Shifts Highlight */}
      {activeShifts.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3">
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            {activeShifts.length} Driver(s) Currently In Transit
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {activeShifts.map((s, idx) => (
              <div key={s.id || idx} className="rounded-xl border border-emerald-500/20 bg-card p-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <BusIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm">{s.driver_name}</div>
                  <div className="text-xs text-muted-foreground">{s.bus_number} · {s.route_number}</div>
                  <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Started: {s.shift_start_time} · 📍 {s.punch_in_coords || s.start_location || "Origin Stop"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-muted/50 font-bold text-muted-foreground border-b border-border/60">
                <th className="p-3.5">#</th>
                <th className="p-3.5">Driver Name</th>
                <th className="p-3.5">Bus & Plate No.</th>
                <th className="p-3.5">Assigned Route</th>
                <th className="p-3.5">Login Location & GPS</th>
                <th className="p-3.5">Shift Start Time</th>
                <th className="p-3.5">Shift Stop Time</th>
                <th className="p-3.5">Day & Date</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    No driver shift records found. Shifts will appear here as drivers start their routes.
                  </td>
                </tr>
              ) : (
                shifts.map((s, idx) => {
                  const isActive =
                    s.shift_stop_time?.includes("In Transit") || s.shift_stop_time?.includes("🟢");
                  const punchCoords = s.punch_in_coords || (s.punch_in_lat && s.punch_in_lng ? `${s.punch_in_lat}, ${s.punch_in_lng}` : "22.36550, 73.18150");
                  return (
                    <tr key={s.id || idx} className="hover:bg-muted/20 transition">
                      <td className="p-3.5 font-mono text-muted-foreground">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-primary shrink-0" /> {s.driver_name}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-muted-foreground text-[11px]">
                        <div>{s.bus_number}</div>
                        <div className="text-[10px] opacity-70">{s.bus_plate || "—"}</div>
                      </td>
                      <td className="p-3.5 font-semibold text-foreground text-[11px]">
                        <div className="font-bold">{s.route_number}</div>
                        <div className="text-muted-foreground font-normal">{s.route_name}</div>
                      </td>
                      <td className="p-3.5 font-mono text-[11px]">
                        <div className="flex items-center gap-1 text-foreground font-semibold">
                          <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                          <span>{s.start_location || "Origin Depot Stop"}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Navigation className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                          <span>{punchCoords}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {s.shift_start_time}
                      </td>
                      <td className="p-3.5 font-mono font-bold">
                        {isActive ? (
                          <span className="text-emerald-600 dark:text-emerald-400">—</span>
                        ) : (
                          <div>
                            <span className="text-muted-foreground">{s.shift_stop_time?.replace(" 🛑 (Completed)", "")}</span>
                            {s.punch_out_coords && (
                              <div className="text-[9px] text-muted-foreground font-mono mt-0.5">
                                Stop: {s.punch_out_coords}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-xs text-muted-foreground font-mono">
                        <div>{s.shift_day || "—"}</div>
                        <div className="text-[10px] opacity-70">{s.shift_date || "July 28, 2026"}</div>
                      </td>
                      <td className="p-3.5">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                            In Transit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground border border-border/60">
                            ✅ Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PassesTab() {
  const queryClient = useQueryClient();
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["admin-pass-applications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pass_applications").select("id, student_id, route_id, status, created_at, routes(route_number,name)").order("created_at", { ascending: false });
      if (error) throw new Error("Unable to load pass applications");
      return data ?? [];
    },
  });
  async function review(applicationId: string, decision: "approve" | "reject") {
    try {
      await reviewPassApplication({ data: { applicationId, decision } });
      await queryClient.invalidateQueries({ queryKey: ["admin-pass-applications"] });
      await queryClient.invalidateQueries({ queryKey: ["my-passes"] });
      toast.success(decision === "approve" ? "Application approved; pass is pending fee verification." : "Application rejected.");
    } catch {
      toast.error("Unable to review this pass application.");
    }
  }
  return <section className="rounded-2xl border bg-card p-5">
    <h2 className="text-xl font-bold">Student pass applications</h2>
    <p className="my-2 text-sm text-muted-foreground">Approval creates an unpaid pass. QR verification remains disabled until payment is verified through the protected payment workflow.</p>
    {isLoading ? <p className="py-6">Loading applications…</p> : applications.length === 0 ? <p className="py-6 text-sm text-muted-foreground">No applications.</p> : <ul className="divide-y">{applications.map((application) => <li key={application.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
      <div><div className="font-semibold">{application.routes?.route_number}: {application.routes?.name}</div><div className="text-xs text-muted-foreground">{application.created_at} · {application.status}</div></div>
      {application.status === "pending" && <div className="flex gap-2"><button className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={() => review(application.id, "approve")}>Approve</button><button className="rounded border px-3 py-2 text-sm" onClick={() => review(application.id, "reject")}>Reject</button></div>}
    </li>)}</ul>}
  </section>;
}

function RoutesTab() {
  const qc = useQueryClient();
  const { data: routes = [] } = useQuery({
    queryKey: ["admin-routes"],
    queryFn: async () =>
      (
        await supabase
          .from("routes")
          .select("*, stops(*), buses(id,bus_number,driver_id)")
          .order("route_number")
      ).data ?? [],
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id, profiles!user_roles_user_id_fkey1(full_name)")
        .eq("role", "driver");
      if (!data) {
        const { data: d2 } = await supabase.from("user_roles").select("user_id").eq("role", "driver");
        return d2 ?? [];
      }
      return data;
    },
  });

  const [showAddRoute, setShowAddRoute] = useState(false);
  const [newRouteNum, setNewRouteNum] = useState("");
  const [newRouteName, setNewRouteName] = useState("");
  const [newDeptTime, setNewDeptTime] = useState("07:30");

  async function assignDriver(busId: string, driverId: string) {
    const { error } = await supabase.from("buses").update({ driver_id: driverId || null }).eq("id", busId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-routes"] });
    toast.success("Driver assigned to bus");
  }

  async function createRoute() {
    if (!newRouteNum || !newRouteName) return toast.error("Fill in route details");
    const { error } = await supabase.from("routes").insert({
      route_number: newRouteNum,
      name: newRouteName,
      departure_time: newDeptTime,
      active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("New route created successfully");
    setShowAddRoute(false);
    setNewRouteNum("");
    setNewRouteName("");
    qc.invalidateQueries({ queryKey: ["admin-routes"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold">Route & Bus Driver Manager</h3>
          <p className="text-xs text-muted-foreground">Manage campus shuttle lines, stops, and driver assignments</p>
        </div>
        <button
          onClick={() => setShowAddRoute(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md"
        >
          <Plus className="h-4 w-4" /> Add New Route
        </button>
      </div>

      {showAddRoute && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-lg space-y-4">
          <h4 className="font-bold text-sm">Create New GSFCU Route</h4>
          <div className="grid sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Route Number (e.g. R5)"
              value={newRouteNum}
              onChange={(e) => setNewRouteNum(e.target.value)}
              className="rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none"
            />
            <input
              type="text"
              placeholder="Route Name (e.g. Gotri to GSFCU)"
              value={newRouteName}
              onChange={(e) => setNewRouteName(e.target.value)}
              className="rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none"
            />
            <input
              type="text"
              placeholder="Departure Time (e.g. 07:30 AM)"
              value={newDeptTime}
              onChange={(e) => setNewDeptTime(e.target.value)}
              className="rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={createRoute} className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
              Save Route
            </button>
            <button onClick={() => setShowAddRoute(false)} className="rounded-xl border border-border px-4 py-2 text-xs font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quick Access Matrix to All Route Buses */}
      <AllRouteBusesFleetMatrix />

      <div className="space-y-4">
        {routes.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between border-b border-border/60 pb-4">
              <div>
                <span className="inline-block rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  Route {r.route_number}
                </span>
                <h4 className="font-display text-xl font-bold mt-1">{r.name}</h4>
              </div>
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Departure: {r.departure_time ?? "07:30 AM"}
              </div>
            </div>

            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Stop Sequence
                </div>
                <ol className="space-y-2">
                  {(r.stops ?? [])
                    .slice()
                    .sort((a: { stop_order: number }, b: { stop_order: number }) => a.stop_order - b.stop_order)
                    .map((s: { id: string; name: string; scheduled_time: string | null }) => (
                      <li key={s.id} className="flex justify-between rounded-xl bg-muted/30 px-3.5 py-2 text-xs border border-border/40">
                        <span className="font-medium">{s.name}</span>
                        <span className="font-mono text-muted-foreground">{s.scheduled_time ?? "—"}</span>
                      </li>
                    ))}
                </ol>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Buses & Assigned Driver
                </div>
                <ul className="space-y-2">
                  {(r.buses ?? []).map((b: { id: string; bus_number: string; driver_id: string | null }) => (
                    <li key={b.id} className="flex items-center justify-between rounded-xl bg-muted/30 px-3.5 py-2 text-xs border border-border/40">
                      <div className="flex items-center gap-2 font-medium">
                        <BusIcon className="h-4 w-4 text-primary" /> Bus {b.bus_number}
                      </div>
                      <select
                        value={b.driver_id ?? ""}
                        onChange={(e) => assignDriver(b.id, e.target.value)}
                        className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs outline-none"
                      >
                        <option value="">Unassigned Driver</option>
                        {drivers.map((d) => (
                          <option key={d.user_id} value={d.user_id}>
                            {(d as { profiles?: { full_name?: string } | null }).profiles?.full_name ??
                              d.user_id.slice(0, 8)}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
            <Gauge className="h-4 w-4 text-primary" /> Speed Compliance
          </div>
          <div className="mt-2 font-display text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">99.2%</div>
          <p className="text-xs text-muted-foreground mt-1">Zero overspeeding instances (&gt;50 km/h) today</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
            <Clock className="h-4 w-4 text-primary" /> Average Stop Delay
          </div>
          <div className="mt-2 font-display text-3xl font-extrabold text-foreground">1.4 mins</div>
          <p className="text-xs text-muted-foreground mt-1">Within optimal 3-minute tolerance</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
            <FileCheck className="h-4 w-4 text-primary" /> Active Digital Passes
          </div>
          <div className="mt-2 font-display text-3xl font-extrabold text-foreground">342 Passes</div>
          <p className="text-xs text-muted-foreground mt-1">Issued for Vadodara Shuttle Network</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
        <h3 className="font-display font-bold text-base mb-4">Fleet Safety & Driver Speed Logs</h3>
        <div className="space-y-3 font-mono text-xs">
          {[
            { bus: "Bus 04 (Route R2)", driver: "Ramesh Patel", speed: "38 km/h", status: "Compliant", time: "Just now" },
            { bus: "Bus 01 (Route R1)", driver: "Suresh Kumar", speed: "42 km/h", status: "Compliant", time: "2 min ago" },
            { bus: "Bus 03 (Route R3)", driver: "Mahesh Singh", speed: "34 km/h", status: "Compliant", time: "5 min ago" },
          ].map((log, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-muted/20 p-3 border border-border/40">
              <div>
                <span className="font-bold text-foreground">{log.bus}</span>
                <span className="text-muted-foreground ml-2">Driver: {log.driver}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-foreground">{log.speed}</span>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-600 dark:text-emerald-400 font-sans font-semibold">
                  {log.status}
                </span>
                <span className="text-muted-foreground">{log.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Student Bus Attendance & Parent CSV Report Export Center
function AttendancePanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterRoute, setFilterRoute] = useState("");
  const [filterDestination, setFilterDestination] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("July 2026");

  // Load audit logs from localStorage or seed initial realistic July 2026 attendance data
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("gsfcu_scan_audit_logs") || "[]");
      if (stored.length > 0) {
        setLogs(stored);
      } else {
        // Pre-seeded Date-to-Date & Day-to-Day realistic logs for demonstration
        const seedLogs = [
          {
            id: "scan-101",
            student_name: "Om Thakkar",
            roll_number: "24BT04171",
            department: "Computer Science & Engineering",
            route_number: "Route 1",
            pickup_stop: "Soma Talav (BPC Pump)",
            fee_status: "Verified Paid",
            status: "Boarded (Valid Pass)",
            scanned_at: "2026-07-28T08:14:22.000Z",
            scan_date: "2026-07-28",
            scan_time: "08:14 AM",
            scan_day: "Tuesday",
            month_year: "July 2026",
          },
          {
            id: "scan-102",
            student_name: "Om Thakkar",
            roll_number: "24BT04171",
            department: "Computer Science & Engineering",
            route_number: "Route 1",
            pickup_stop: "Soma Talav (BPC Pump)",
            fee_status: "Verified Paid",
            status: "Boarded (Valid Pass)",
            scanned_at: "2026-07-27T08:12:05.000Z",
            scan_date: "2026-07-27",
            scan_time: "08:12 AM",
            scan_day: "Monday",
            month_year: "July 2026",
          },
          {
            id: "scan-103",
            student_name: "Alex Sharma",
            roll_number: "22CS089",
            department: "Mechanical Engineering",
            route_number: "Route 2",
            pickup_stop: "Sama Savli Circle",
            fee_status: "Verified Paid",
            status: "Boarded (Valid Pass)",
            scanned_at: "2026-07-28T07:55:10.000Z",
            scan_date: "2026-07-28",
            scan_time: "07:55 AM",
            scan_day: "Tuesday",
            month_year: "July 2026",
          },
          {
            id: "scan-104",
            student_name: "Priya Patel",
            roll_number: "23EC102",
            department: "Electrical Engineering",
            route_number: "Route 3",
            pickup_stop: "Waghodia Road",
            fee_status: "Verified Paid",
            status: "Boarded (Valid Pass)",
            scanned_at: "2026-07-28T08:02:18.000Z",
            scan_date: "2026-07-28",
            scan_time: "08:02 AM",
            scan_day: "Tuesday",
            month_year: "July 2026",
          },
          {
            id: "scan-105",
            student_name: "Om Thakkar",
            roll_number: "24BT04171",
            department: "Computer Science & Engineering",
            route_number: "Route 1",
            pickup_stop: "Soma Talav (BPC Pump)",
            fee_status: "Verified Paid",
            status: "Boarded (Valid Pass)",
            scanned_at: "2026-07-24T08:15:00.000Z",
            scan_date: "2026-07-24",
            scan_time: "08:15 AM",
            scan_day: "Friday",
            month_year: "July 2026",
          },
          {
            id: "scan-106",
            student_name: "Rohan Varma",
            roll_number: "24ME055",
            department: "Civil Engineering",
            route_number: "Route 6",
            pickup_stop: "Subhanpura",
            fee_status: "Verified Paid",
            status: "Boarded (Valid Pass)",
            scanned_at: "2026-07-27T08:20:00.000Z",
            scan_date: "2026-07-27",
            scan_time: "08:20 AM",
            scan_day: "Monday",
            month_year: "July 2026",
          },
        ];
        setLogs(seedLogs);
        localStorage.setItem("gsfcu_scan_audit_logs", JSON.stringify(seedLogs));
      }
    } catch (e) {
      console.error("Failed to load audit logs:", e);
    }
  }, []);

  const filtered = logs.filter((item) => {
    const matchesSearch =
      !search ||
      item.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.roll_number?.toLowerCase().includes(search.toLowerCase());

    const matchesRoute =
      !filterRoute ||
      item.route_number?.toLowerCase().includes(filterRoute.toLowerCase());

    const matchesDestination =
      !filterDestination ||
      item.pickup_stop?.toLowerCase().includes(filterDestination.toLowerCase()) ||
      item.department?.toLowerCase().includes(filterDestination.toLowerCase());

    const matchesDate = !filterDate || item.scan_date === filterDate;
    return matchesSearch && matchesRoute && matchesDestination && matchesDate;
  });

  // Export CSV Report for Parent Groups
  function exportParentCSV() {
    if (filtered.length === 0) return toast.error("No scan records found to export.");

    const headers = [
      "Student Name",
      "Roll Number",
      "Department",
      "Route Number",
      "Pickup Stop",
      "Scan Date (YYYY-MM-DD)",
      "Day of Week",
      "Scan Time",
      "Boarding Status",
      "Fee Verification Status",
    ];

    const rows = filtered.map((l) => [
      `"${l.student_name}"`,
      `"${l.roll_number}"`,
      `"${l.department}"`,
      `"${l.route_number}"`,
      `"${l.pickup_stop}"`,
      `"${l.scan_date}"`,
      `"${l.scan_day}"`,
      `"${l.scan_time}"`,
      `"${l.status}"`,
      `"${l.fee_status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `GSFCU_Student_Bus_Attendance_Report_${filterMonth.replace(" ", "_")}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("✓ Parent CSV Attendance Report exported successfully!");
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-indigo-500/10 to-primary/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
              GATE CONDUCTOR SCAN AUDIT & PARENT NOTIFICATIONS
            </span>
            <h2 className="font-display text-2xl font-extrabold mt-1">Student Bus Boarding Attendance Logs</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Date-to-Date & Day-to-Day boarding history logged at campus gate terminals for parent verification.
            </p>
          </div>
          <button
            onClick={exportParentCSV}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-3 text-xs font-bold text-white shadow-lg transition active:scale-95"
          >
            <FileCheck className="h-4 w-4" /> Export CSV for Parents
          </button>
        </div>
      </div>

      {/* Search & Route / Destination Filter Bar */}
      <div className="space-y-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search student name, roll 24BT04171..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[200px] flex-1 rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-medium outline-none focus:border-primary"
          />

          {/* Select Bus Route Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Select Route:</span>
            <select
              value={filterRoute}
              onChange={(e) => setFilterRoute(e.target.value)}
              className="rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary cursor-pointer max-w-[180px]"
            >
              <option value="">All 13 Routes</option>
              <option value="Route 1">Route 1 (Soma Talav)</option>
              <option value="Route 2">Route 2 (Sama Savli)</option>
              <option value="Route 3">Route 3 (Waghodia)</option>
              <option value="Route 4">Route 4 (Maneja)</option>
              <option value="Route 5">Route 5 (Gotri)</option>
              <option value="Route 6">Route 6 (Subhanpura)</option>
              <option value="Route 7">Route 7 (Alkapuri)</option>
              <option value="Route 8">Route 8 (Old Padra)</option>
              <option value="Route 9">Route 9 (Fatehgunj)</option>
              <option value="Route 10">Route 10 (Manjalpur)</option>
              <option value="Route 11">Route 11 (Karelibaug)</option>
              <option value="Route 12">Route 12 (Gorwa)</option>
              <option value="Route 13">Route 13 (Bajwa)</option>
            </select>
          </div>

          {/* Destination / Stop Search Input */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[220px]">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Destination / Stop:</span>
            <input
              type="text"
              placeholder="Write destination / stop (e.g. GSFC Campus, Soma Talav)…"
              value={filterDestination}
              onChange={(e) => setFilterDestination(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-medium outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Date:</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs outline-none"
            />
            {(filterDate || filterRoute || filterDestination || search) && (
              <button
                onClick={() => {
                  setFilterDate("");
                  setFilterRoute("");
                  setFilterDestination("");
                  setSearch("");
                }}
                className="text-xs font-bold text-destructive hover:underline whitespace-nowrap"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        <div className="text-right text-xs font-bold text-muted-foreground font-mono border-t border-border/40 pt-2">
          Showing {filtered.length} Scan Log Entries
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 font-bold text-muted-foreground">
                <th className="p-3.5">Scan Date & Day</th>
                <th className="p-3.5">Student Name</th>
                <th className="p-3.5">Roll Number</th>
                <th className="p-3.5">Route</th>
                <th className="p-3.5">Pickup Stop</th>
                <th className="p-3.5">Scan Time</th>
                <th className="p-3.5">Boarding Status</th>
                <th className="p-3.5">Fee Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No scan attendance logs found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition font-mono">
                    <td className="p-3.5">
                      <div className="font-bold text-foreground">{log.scan_date}</div>
                      <div className="text-[10px] text-primary font-semibold">{log.scan_day}</div>
                    </td>
                    <td className="p-3.5 font-bold font-sans text-foreground text-sm">{log.student_name}</td>
                    <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">{log.roll_number}</td>
                    <td className="p-3.5 font-bold">{log.route_number}</td>
                    <td className="p-3.5 text-muted-foreground">{log.pickup_stop}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300 font-semibold">{log.scan_time}</td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${log.status.includes("Boarded")
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                          }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        {log.fee_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// DRIVER ID & PASS GENERATOR & MANAGEMENT TAB
// ==========================================

function DriverIdPassesTab() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"driver" | "scanner" | "admin">("driver");
  const [busy, setBusy] = useState(false);

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await inviteStaff({ data: { fullName, email, role } });
      toast.success("Invitation sent. The recipient must set a new password by email.");
      setFullName("");
      setEmail("");
    } catch {
      toast.error("Unable to invite this staff account.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="mx-auto max-w-2xl rounded-2xl border bg-card p-6">
    <h2 className="text-xl font-bold">Invite staff account</h2>
    <p className="my-2 text-sm text-muted-foreground">Staff sign in with their invited university email and a password they set themselves. Credentials are never generated or printed here.</p>
    <form className="mt-5 space-y-4" onSubmit={invite}>
      <label className="block text-sm">Full name<input className="mt-1 w-full rounded border p-3" value={fullName} maxLength={120} onChange={(e) => setFullName(e.target.value)} required /></label>
      <label className="block text-sm">Email<input className="mt-1 w-full rounded border p-3" type="email" value={email} maxLength={254} onChange={(e) => setEmail(e.target.value)} required /></label>
      <label className="block text-sm">Role<select className="mt-1 w-full rounded border p-3" value={role} onChange={(e) => setRole(e.target.value as typeof role)}><option value="driver">Driver</option><option value="scanner">Scanner</option><option value="admin">Administrator</option></select></label>
      <button className="rounded bg-primary px-4 py-3 text-primary-foreground" disabled={busy}>{busy ? "Sending invitation…" : "Send invitation"}</button>
    </form>
  </section>;
}
