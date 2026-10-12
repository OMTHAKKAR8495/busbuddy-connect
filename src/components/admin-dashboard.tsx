import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "./app-shell";
import LiveMap from "./live-map";
import { toast } from "sonner";
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
            {/* Quick System Info in Sidebar Footer */}
            <div className="hidden lg:block pt-3 border-t border-border/60 px-2 text-[11px] text-muted-foreground space-y-1 font-mono">
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
  const qc = useQueryClient();
  const [overrides, setOverrides] = useState<Record<string, { status: "active" | "pending" | "expired" | "rejected"; fee_paid: boolean }>>(() => {
    try {
      return JSON.parse(localStorage.getItem("gsfcu_pass_overrides") || "{}");
    } catch (e) {
      return {};
    }
  });
  const [inspectingPass, setInspectingPass] = useState<any | null>(null);

  const { data: passes = [] } = useQuery({
    queryKey: ["admin-passes"],
    queryFn: async () => {
      const { data: rows } = await (supabase as any)
        .from("bus_pass_applications_master")
        .select("*")
        .order("applied_at", { ascending: false });

      if (!rows?.length) return [];

      return (rows as any[]).map((r: any) => ({
        id: r.id,
        pass_number: r.pass_number,
        student_id: r.roll_number,
        status: r.approval_status === "Approved Active" ? "active" : r.approval_status === "Pending Approval" ? "pending" : r.approval_status === "Expired" ? "expired" : "rejected",
        fee_paid: r.fee_payment_status === "Verified Paid",
        valid_from: r.valid_from,
        valid_until: r.valid_until,
        routes: { route_number: (r.route_number || "R1").replace("Route ", ""), name: r.pickup_stop || "GSFCU" },
        profiles: { full_name: r.student_name, roll_number: r.roll_number },
      }));
    },
  });

  async function update(
    passObj: any,
    patch: { status?: "active" | "pending" | "expired" | "rejected"; fee_paid?: boolean }
  ) {
    const nextStatus = patch.status ?? passObj.status;
    const nextFee = patch.fee_paid ?? passObj.fee_paid;
    const newOverride = { status: nextStatus, fee_paid: nextFee };

    // 1. Immediately update React State & LocalStorage Overrides
    setOverrides((prev) => {
      const updated = { ...prev, [passObj.id]: newOverride };
      try {
        localStorage.setItem("gsfcu_pass_overrides", JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });

    // 2. Update local student applications array in LocalStorage
    try {
      const currentLocal = JSON.parse(localStorage.getItem("gsfcu_student_applications") || "[]");
      const updatedLocal = currentLocal.map((item: any) => {
        if (item.id === passObj.id) {
          return { ...item, status: nextStatus, fee_paid: nextFee };
        }
        return item;
      });
      localStorage.setItem("gsfcu_student_applications", JSON.stringify(updatedLocal));
    } catch (e) { }

    // 3. Upsert into Supabase database so the record is permanently saved in the cloud DB
    const upsertPayload: any = {
      id: passObj.id,
      pass_number: passObj.pass_number || "GSFC-PASS-" + String(passObj.id).slice(0, 8),
      student_name: passObj.profiles?.full_name || "Student",
      roll_number: passObj.profiles?.roll_number || "24BT04171",
      route_number: "Route " + (passObj.routes?.route_number || "R1"),
      pickup_stop: passObj.routes?.name || "Soma Talav",
      valid_from: passObj.valid_from || "2026-07-28",
      valid_until: passObj.valid_until || "2027-01-28",
      fee_amount_inr: 4500,
      fee_payment_status: nextFee ? "Verified Paid" : "Pending Verification",
      approval_status: nextStatus === "active" ? "Approved Active" : nextStatus === "rejected" ? "Rejected" : nextStatus === "expired" ? "Expired" : "Pending Approval",
      applied_at: new Date().toISOString(),
    };

    try {
      await (supabase as any).from("bus_pass_applications_master").upsert(upsertPayload);
    } catch (err) {
      console.warn("Supabase pass upsert warning:", err);
    }

    if (nextStatus === "active") {
      try {
        const approvedMap = JSON.parse(localStorage.getItem("gsfcu_approved_passes") || "{}");
        approvedMap[passObj.id] = true;
        approvedMap["all"] = true;
        localStorage.setItem("gsfcu_approved_passes", JSON.stringify(approvedMap));
      } catch (e) {
        console.error(e);
      }
      toast.success(`Pass approved & entry QR token generated for ${passObj.profiles?.full_name ?? "Student"}`);
    } else if (nextStatus === "rejected" || nextStatus === "expired") {
      try {
        const approvedMap = JSON.parse(localStorage.getItem("gsfcu_approved_passes") || "{}");
        delete approvedMap[passObj.id];
        delete approvedMap["all"];
        localStorage.setItem("gsfcu_approved_passes", JSON.stringify(approvedMap));
      } catch (e) {
        console.error(e);
      }
      toast.error(`Pass revoked / suspended for ${passObj.profiles?.full_name ?? "Student"}`);
    } else {
      toast.info("Pass updated successfully");
    }

    qc.invalidateQueries({ queryKey: ["admin-passes"] });
    qc.invalidateQueries({ queryKey: ["my-passes"] });
    qc.invalidateQueries({ queryKey: ["passes-all"] });
  }

  // Load student applications submitted from Student Dashboard
  const localStudentApps = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("gsfcu_student_applications") || "[]");
    } catch (e) {
      return [];
    }
  }, [overrides]);

  const rawPassList = passes.length > 0 ? passes : [
    {
      id: "pass-demo-101",
      pass_number: "GSFC-PASS-101",
      student_id: "eval-om-thakkar",
      status: overrides["pass-demo-101"]?.status ?? "pending",
      fee_paid: overrides["pass-demo-101"]?.fee_paid ?? false,
      valid_from: "2026-07-28",
      valid_until: "2027-01-28",
      routes: { route_number: "R1", name: "Soma Talav → GSFCU" },
      profiles: { full_name: "Om Thakkar", roll_number: "24BT04171" },
    },
  ];

  const combinedAll = [...localStudentApps, ...rawPassList];
  const uniquePasses = Array.from(new Map(combinedAll.map((item) => [item.id, item])).values());

  const mergedPasses = uniquePasses.map((p) => {
    const o = overrides[p.id];
    return o ? { ...p, status: o.status, fee_paid: o.fee_paid } : p;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold">Student Bus Pass & Fee Approval Queue</h3>
          <p className="text-xs text-muted-foreground">Approve requests to issue dynamic QR entry passes</p>
        </div>
        <span className="text-xs font-semibold rounded-full bg-primary/10 px-3 py-1 text-primary border border-primary/20">
          {mergedPasses.length} Total Requests
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border/60">
            <tr>
              <th className="px-5 py-3.5 text-left">Student Profile</th>
              <th className="px-5 py-3.5 text-left">Assigned Route</th>
              <th className="px-5 py-3.5 text-left">Validity Period</th>
              <th className="px-5 py-3.5 text-left">Semester Fee</th>
              <th className="px-5 py-3.5 text-left">Pass Status</th>
              <th className="px-5 py-3.5 text-right">Actions / Actions Taken</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {mergedPasses.map((p) => {
              const isActive = p.status === "active";
              const isPending = p.status === "pending";

              return (
                <tr key={p.id} className="hover:bg-muted/20 transition">
                  <td className="px-5 py-4">
                    <div className="font-bold text-foreground flex items-center gap-1.5">
                      {p.profiles?.full_name ?? "omq"}
                      {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">
                      Roll: {p.profiles?.roll_number ?? "171"}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium">
                    Route {p.routes?.route_number ?? "R1"} · {p.routes?.name ?? "Soma Talav → GSFCU"}
                  </td>
                  <td className="px-5 py-4 text-xs font-mono text-muted-foreground">
                    {p.valid_from} → {p.valid_until}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => update(p, { fee_paid: !p.fee_paid })}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${p.fee_paid
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        }`}
                    >
                      {p.fee_paid ? "Verified Paid" : "Unpaid"}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Active & Generated
                      </span>
                    ) : isPending ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Clock className="h-3.5 w-3.5" /> Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:text-red-400 border border-red-500/20">
                        <Ban className="h-3.5 w-3.5" /> {p.status}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {isPending ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => update(p, { status: "active", fee_paid: true })}
                          className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-md active:scale-95"
                          title="Approve Pass & Issue QR"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => update(p, { status: "rejected" })}
                          className="flex items-center gap-1 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 shadow-sm active:scale-95"
                          title="Reject Pass"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    ) : isActive ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setInspectingPass(p)}
                          className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/20"
                        >
                          <QrCode className="h-3.5 w-3.5" /> Inspect Pass QR
                        </button>
                        <button
                          onClick={() => update(p, { status: "expired", fee_paid: false })}
                          className="flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-500/20 transition"
                          title="Revoke / Cut Pass"
                        >
                          <Ban className="h-3.5 w-3.5" /> Revoke
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => update(p, { status: "active", fee_paid: true })}
                        className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
                      >
                        Re-Approve
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {mergedPasses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No pass requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Admin QR Code Inspection Modal */}
      {inspectingPass && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <span className="inline-block rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ADMIN QR SCANNER VERIFIER
                </span>
                <h3 className="font-display font-extrabold text-lg text-foreground mt-0.5">
                  Generated Student Bus Entry Pass
                </h3>
              </div>
              <button
                onClick={() => setInspectingPass(null)}
                className="rounded-full bg-muted p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-primary via-indigo-950 to-slate-950 p-5 text-white space-y-4 shadow-xl border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-bold text-emerald-400">GSFCU VERIFIED ID</div>
                  <div className="text-lg font-bold font-display">{inspectingPass.profiles?.full_name ?? "omq"}</div>
                  <div className="text-xs font-mono opacity-80">Roll: {inspectingPass.profiles?.roll_number ?? "171"}</div>
                </div>
                <div className="rounded-2xl bg-white p-2.5 shadow-lg">
                  <QRCodeSVG
                    value={JSON.stringify({
                      passId: inspectingPass.id,
                      student: inspectingPass.profiles?.full_name ?? "omq",
                      roll: inspectingPass.profiles?.roll_number ?? "171",
                      route: inspectingPass.routes?.route_number ?? "R1",
                    })}
                    size={90}
                  />
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 text-xs space-y-1 font-mono">
                <div>Route: Route {inspectingPass.routes?.route_number ?? "R1"} ({inspectingPass.routes?.name ?? "Soma Talav"})</div>
                <div>Valid: {inspectingPass.valid_from} → {inspectingPass.valid_until}</div>
                <div className="text-emerald-400 font-bold">Status: Active & Valid for Campus Entry</div>
              </div>
            </div>

            <div className="text-right pt-1">
              <button
                onClick={() => setInspectingPass(null)}
                className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-md"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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

export type DriverPassRecord = {
  id: string;
  driver_name: string;
  employee_id: string;
  license_number: string;
  phone_number: string;
  blood_group: string;
  assigned_bus: string;
  assigned_route: string;
  route_name: string;
  photo_url?: string;
  valid_from: string;
  valid_until: string;
  emergency_contact: string;
  security_badge_code: string;
  status: "Active" | "Expired" | "Suspended";
  created_at: string;
};

const DEFAULT_DRIVERS_PASSES: DriverPassRecord[] = [
  {
    id: "drv-pass-101",
    driver_name: "Suresh Kumar",
    employee_id: "GSFC-DRV-101",
    license_number: "GJ06-2018-DL9871",
    phone_number: "+91 98250 11442",
    blood_group: "B+",
    assigned_bus: "BUS-01 (GJ-06-AX-1001)",
    assigned_route: "Route R1",
    route_name: "Soma Talav (BPC Pump) → GSFC University",
    valid_from: "2026-07-01",
    valid_until: "2027-06-30",
    emergency_contact: "+91 94280 55112 (Wife)",
    security_badge_code: "DRV-SEC-9841",
    status: "Active",
    created_at: "2026-07-01T08:00:00.000Z",
  },
  {
    id: "drv-pass-102",
    driver_name: "Ramesh Patel",
    employee_id: "GSFC-DRV-102",
    license_number: "GJ06-2016-DL3312",
    phone_number: "+91 97241 88910",
    blood_group: "O+",
    assigned_bus: "BUS-04 (GJ-06-AX-1004)",
    assigned_route: "Route R2",
    route_name: "Sama Savli Circle → GSFC University",
    valid_from: "2026-07-01",
    valid_until: "2027-06-30",
    emergency_contact: "+91 99099 22345 (Brother)",
    security_badge_code: "DRV-SEC-3329",
    status: "Active",
    created_at: "2026-07-01T08:00:00.000Z",
  },
  {
    id: "drv-pass-103",
    driver_name: "Mahesh Singh",
    employee_id: "GSFC-DRV-103",
    license_number: "GJ06-2019-DL7784",
    phone_number: "+91 98980 44321",
    blood_group: "A+",
    assigned_bus: "BUS-03 (GJ-06-AX-1003)",
    assigned_route: "Route R3",
    route_name: "Waghodia Road → GSFC University",
    valid_from: "2026-07-01",
    valid_until: "2027-06-30",
    emergency_contact: "+91 98240 66778 (Son)",
    security_badge_code: "DRV-SEC-7712",
    status: "Active",
    created_at: "2026-07-01T08:00:00.000Z",
  },
];

function DriverIdPassesTab() {
  const [driverPasses, setDriverPasses] = useState<DriverPassRecord[]>(() => {
    try {
      const stored = localStorage.getItem("gsfcu_driver_id_passes");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_DRIVERS_PASSES;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Expired" | "Suspended">("All");

  // Modal states
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [editingPass, setEditingPass] = useState<DriverPassRecord | null>(null);
  const [viewingPass, setViewingPass] = useState<DriverPassRecord | null>(null);

  // Form states for generating / updating driver pass
  const [driverName, setDriverName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bloodGroup, setBloodGroup] = useState("B+");
  const [assignedBus, setAssignedBus] = useState("BUS-01 (GJ-06-AX-1001)");
  const [assignedRoute, setAssignedRoute] = useState("Route R1");
  const [routeName, setRouteName] = useState("Soma Talav (BPC Pump) → GSFC University");
  const [validFrom, setValidFrom] = useState("2026-07-01");
  const [validUntil, setValidUntil] = useState("2027-06-30");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string>("");

  // Sync to localStorage
  const savePasses = (newList: DriverPassRecord[]) => {
    setDriverPasses(newList);
    try {
      localStorage.setItem("gsfcu_driver_id_passes", JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
  };

  // Open generator modal fresh
  const handleOpenNew = () => {
    setEditingPass(null);
    setDriverName("");
    setEmployeeId(`GSFC-DRV-${Math.floor(100 + Math.random() * 900)}`);
    setLicenseNumber("");
    setPhoneNumber("");
    setBloodGroup("B+");
    setAssignedBus("BUS-01 (GJ-06-AX-1001)");
    setAssignedRoute("Route R1");
    setRouteName("Soma Talav (BPC Pump) → GSFC University");
    setValidFrom(new Date().toISOString().split("T")[0]);
    setValidUntil("2027-06-30");
    setEmergencyContact("");
    setPhotoPreview("");
    setShowGenerateModal(true);
  };

  // Open edit / change pass modal
  const handleOpenEdit = (pass: DriverPassRecord) => {
    setEditingPass(pass);
    setDriverName(pass.driver_name);
    setEmployeeId(pass.employee_id);
    setLicenseNumber(pass.license_number);
    setPhoneNumber(pass.phone_number);
    setBloodGroup(pass.blood_group);
    setAssignedBus(pass.assigned_bus);
    setAssignedRoute(pass.assigned_route);
    setRouteName(pass.route_name);
    setValidFrom(pass.valid_from);
    setValidUntil(pass.valid_until);
    setEmergencyContact(pass.emergency_contact);
    setPhotoPreview(pass.photo_url || "");
    setShowGenerateModal(true);
  };

  // Handle Photo upload / file convert
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo size exceeds 2MB limit");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
      toast.success("Driver photo uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  // Submit generate or update pass
  const handleSaveDriverPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim()) {
      toast.error("Please enter the driver's full name");
      return;
    }

    if (editingPass) {
      // Modify existing driver pass
      const updatedList = driverPasses.map((p) => {
        if (p.id === editingPass.id) {
          return {
            ...p,
            driver_name: driverName.trim(),
            employee_id: employeeId.trim() || p.employee_id,
            license_number: licenseNumber.trim() || p.license_number,
            phone_number: phoneNumber.trim() || p.phone_number,
            blood_group: bloodGroup,
            assigned_bus: assignedBus,
            assigned_route: assignedRoute,
            route_name: routeName,
            valid_from: validFrom,
            valid_until: validUntil,
            emergency_contact: emergencyContact.trim() || p.emergency_contact,
            photo_url: photoPreview || p.photo_url,
          };
        }
        return p;
      });

      savePasses(updatedList);
      toast.success(`✓ Driver Pass for ${driverName} successfully updated and modified!`);
      setShowGenerateModal(false);
      setEditingPass(null);
    } else {
      // Generate Brand New Driver Pass
      const newPass: DriverPassRecord = {
        id: "drv-pass-" + Date.now(),
        driver_name: driverName.trim(),
        employee_id: employeeId.trim() || `GSFC-DRV-${Math.floor(100 + Math.random() * 900)}`,
        license_number: licenseNumber.trim() || `GJ06-${new Date().getFullYear()}-DL${Math.floor(1000 + Math.random() * 9000)}`,
        phone_number: phoneNumber.trim() || "+91 98765 00000",
        blood_group: bloodGroup,
        assigned_bus: assignedBus,
        assigned_route: assignedRoute,
        route_name: routeName,
        photo_url: photoPreview || undefined,
        valid_from: validFrom,
        valid_until: validUntil,
        emergency_contact: emergencyContact.trim() || "Transport Control Office",
        security_badge_code: `DRV-SEC-${Math.floor(1000 + Math.random() * 9000)}`,
        status: "Active",
        created_at: new Date().toISOString(),
      };

      const updatedList = [newPass, ...driverPasses];
      savePasses(updatedList);
      toast.success(`🎉 Official Driver ID Pass generated for ${driverName.trim()}!`);
      setShowGenerateModal(false);
      setViewingPass(newPass); // Immediately view new pass
    }
  };

  // Toggle Driver Pass Status (Active <-> Suspended / Expired)
  const toggleStatus = (id: string, newStatus: "Active" | "Expired" | "Suspended") => {
    const updated = driverPasses.map((p) => (p.id === id ? { ...p, status: newStatus } : p));
    savePasses(updated);
    toast.info(`Driver Pass status changed to ${newStatus}`);
  };

  // Print Driver Physical ID Card
  const printDriverIdCard = (pass: DriverPassRecord) => {
    const printWin = window.open("", "_blank");
    if (!printWin) {
      toast.error("Please allow popups to print driver ID card");
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GSFCU Transit — Driver ID Pass: ${pass.driver_name}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
            .card-container { display: flex; gap: 20px; justify-content: center; margin-top: 30px; }
            .id-card { width: 340px; height: 520px; border-radius: 20px; background: linear-gradient(135deg, #091e3a 0%, #102a4e 50%, #030b15 100%); color: #fff; padding: 24px; box-sizing: border-box; position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.3); border: 2px solid rgba(255,255,255,0.15); page-break-inside: avoid; }
            .header { text-align: center; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 14px; margin-bottom: 16px; }
            .badge-title { font-size: 11px; letter-spacing: 2px; color: #10b981; font-weight: 800; text-transform: uppercase; }
            .org-title { font-size: 16px; font-weight: 900; letter-spacing: 0.5px; margin-top: 3px; }
            .photo-box { width: 90px; height: 100px; border-radius: 14px; background: #1e293b; border: 2px solid #10b981; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; font-size: 36px; }
            .photo-img { width: 100%; height: 100%; object-fit: cover; }
            .driver-name { font-size: 19px; font-weight: 800; text-align: center; margin: 0; color: #ffffff; }
            .emp-id { font-size: 12px; font-family: monospace; color: #38bdf8; text-align: center; font-weight: 700; margin-top: 2px; }
            .info-grid { margin-top: 18px; font-size: 11px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 14px; }
            .label { color: #94a3b8; font-size: 9px; text-transform: uppercase; font-weight: 600; }
            .val { font-weight: 700; color: #f1f5f9; }
            .footer-strip { margin-top: 18px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 12px; }
            .qr-box { background: #fff; padding: 5px; border-radius: 8px; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; }
            .status-badge { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 3px 8px; border-radius: 999px; font-size: 9px; font-weight: 800; }
          </style>
        </head>
        <body>
          <h2 style="text-align:center; color:#0f172a; margin-bottom: 5px;">GSFC UNIVERSITY TRANSPORT AUTHORITY</h2>
          <p style="text-align:center; color:#64748b; font-size: 12px; margin-top:0;">Official Driver Accreditation Card & Campus Transit Authorization</p>
          
          <div class="card-container">
            <div class="id-card">
              <div class="header">
                <div class="badge-title">OFFICIAL TRANSPORT ID PASS</div>
                <div class="org-title">GSFC UNIVERSITY</div>
                <div style="font-size: 9px; opacity:0.8;">Vigyan Bhavan, Fertilizernagar, Vadodara</div>
              </div>

              <div class="photo-box">
                ${pass.photo_url ? `<img src="${pass.photo_url}" class="photo-img" />` : `👨‍✈️`}
              </div>

              <div class="driver-name">${pass.driver_name}</div>
              <div class="emp-id">${pass.employee_id} · DRIVER PASS</div>

              <div class="info-grid">
                <div>
                  <div class="label">Assigned Shuttle</div>
                  <div class="val">${pass.assigned_bus.split(' ')[0]}</div>
                </div>
                <div>
                  <div class="label">Route Line</div>
                  <div class="val">${pass.assigned_route}</div>
                </div>
                <div>
                  <div class="label">Driving License</div>
                  <div class="val">${pass.license_number}</div>
                </div>
                <div>
                  <div class="label">Blood Group</div>
                  <div class="val">${pass.blood_group}</div>
                </div>
                <div>
                  <div class="label">Validity Period</div>
                  <div class="val">${pass.valid_from} → ${pass.valid_until}</div>
                </div>
                <div>
                  <div class="label">Emergency Call</div>
                  <div class="val">${pass.emergency_contact || pass.phone_number}</div>
                </div>
              </div>

              <div class="footer-strip">
                <div>
                  <span class="status-badge">AUTHORIZED PASS</span>
                  <div style="font-size: 8px; color: #94a3b8; margin-top: 4px; font-family: monospace;">CODE: ${pass.security_badge_code}</div>
                </div>
                <div style="font-size: 10px; font-family: monospace; text-align: right; color:#38bdf8;">
                  Scan & Verify<br/>On Campus Gate
                </div>
              </div>
            </div>
          </div>

          <div style="text-align:center; margin-top: 25px; color:#64748b; font-size: 11px;">
            Issued by Office of Dean of Student Affairs & Transport Division · GSFC University Vadodara
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const filteredList = driverPasses.filter((p) => {
    const matchesSearch =
      p.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.assigned_bus.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.assigned_route.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "All" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-indigo-500/10 to-primary/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary font-mono border border-primary/20">
              OFFICIAL DRIVER PASS & ID ISSUANCE DESK
            </span>
            <h2 className="font-display text-2xl font-extrabold mt-1 flex items-center gap-2">
              <IdCard className="h-6 w-6 text-primary" /> Driver ID Pass Generator & Credentials
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generate official smart ID passes with photo, license, assigned route & bus. Admin can modify passes or change credentials anytime.
            </p>
          </div>

          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:opacity-95 transition active:scale-95"
          >
            <Plus className="h-4 w-4" /> Generate Driver ID Pass
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search driver by name, Emp ID (GSFC-DRV-101), bus plate, or route..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(["All", "Active", "Expired", "Suspended"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filterStatus === st
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
            >
              {st} {st !== "All" && `(${driverPasses.filter((d) => d.status === st).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Driver Pass Grid Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredList.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-border/80 bg-card p-12 text-center text-muted-foreground">
            <IdCard className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <div className="font-bold text-foreground">No Driver ID Passes Found</div>
            <p className="text-xs text-muted-foreground mt-1">
              Click &quot;Generate Driver ID Pass&quot; above to create and issue the first driver credential.
            </p>
          </div>
        ) : (
          filteredList.map((pass) => (
            <div
              key={pass.id}
              className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header Profile Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 rounded-xl bg-muted border border-border/80 flex items-center justify-center overflow-hidden font-bold text-lg text-primary shadow-inner">
                      {pass.photo_url ? (
                        <img src={pass.photo_url} alt={pass.driver_name} className="h-full w-full object-cover" />
                      ) : (
                        <span>👨‍✈️</span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-foreground leading-tight">{pass.driver_name}</h3>
                      <div className="text-xs font-mono font-bold text-primary mt-0.5">{pass.employee_id}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">Blood: {pass.blood_group}</div>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${pass.status === "Active"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : pass.status === "Suspended"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20"
                      }`}
                  >
                    {pass.status}
                  </span>
                </div>

                {/* Info Card Details */}
                <div className="mt-4 space-y-2 rounded-xl bg-muted/40 p-3 text-xs border border-border/50">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Assigned Shuttle:</span>
                    <span className="font-semibold text-foreground">{pass.assigned_bus.split(" ")[0]}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Assigned Route:</span>
                    <span className="font-bold text-primary font-mono">{pass.assigned_route}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Driving License:</span>
                    <span className="font-mono text-[11px] font-semibold">{pass.license_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pass Validity:</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {pass.valid_from} → {pass.valid_until}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                <button
                  onClick={() => setViewingPass(pass)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition"
                  title="View Smart Digital ID Card"
                >
                  <Eye className="h-3.5 w-3.5" /> View Pass
                </button>

                <button
                  onClick={() => handleOpenEdit(pass)}
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
                  title="Modify / Change Driver Pass Details"
                >
                  <Edit className="h-3.5 w-3.5 text-amber-500" /> Change Pass
                </button>

                <button
                  onClick={() => printDriverIdCard(pass)}
                  className="inline-flex items-center justify-center rounded-xl border border-border bg-card p-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
                  title="Print / Save Physical ID Card PDF"
                >
                  <Printer className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL 1: GENERATE / MODIFY DRIVER ID PASS FORM       */}
      {/* ==================================================== */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary font-mono">
                  {editingPass ? "MODIFY EXISTING PASS" : "NEW DRIVER ONBOARDING"}
                </span>
                <h3 className="font-display font-extrabold text-lg text-foreground mt-0.5 flex items-center gap-2">
                  <IdCard className="h-5 w-5 text-primary" />
                  {editingPass ? `Change Pass Details: ${editingPass.driver_name}` : "Generate Official Driver ID Pass"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  setEditingPass(null);
                }}
                className="rounded-full bg-muted p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDriverPass} className="space-y-4">
              {/* Photo Upload Area */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Driver Photo (Optional — Click to Upload)
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0 rounded-2xl bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl">👨‍✈️</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="block w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      PNG, JPG or WEBP up to 2MB. Appears on both digital and printable ID badges.
                    </p>
                  </div>
                </div>
              </div>

              {/* Driver Full Name & Employee ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Driver Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Staff / Employee ID
                  </label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. GSFC-DRV-109"
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Driving License & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Commercial Driving License (DL)
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. GJ06-2021-DL5542"
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Mobile Phone Number
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Blood Group & Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Emergency Contact (Relative/Dept)
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="e.g. +91 98250 99881 (Wife)"
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Assigned Bus & Route Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Assigned GSFCU Shuttle Bus
                  </label>
                  <select
                    value={assignedBus}
                    onChange={(e) => setAssignedBus(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="BUS-01 (GJ-06-AX-1001)">BUS-01 (GJ-06-AX-1001)</option>
                    <option value="BUS-02 (GJ-06-AX-1002)">BUS-02 (GJ-06-AX-1002)</option>
                    <option value="BUS-03 (GJ-06-AX-1003)">BUS-03 (GJ-06-AX-1003)</option>
                    <option value="BUS-04 (GJ-06-AX-1004)">BUS-04 (GJ-06-AX-1004)</option>
                    <option value="BUS-05 (GJ-06-AX-1005)">BUS-05 (GJ-06-AX-1005)</option>
                    <option value="BUS-06 (GJ-06-AX-1006)">BUS-06 (GJ-06-AX-1006)</option>
                    <option value="BUS-07 (GJ-06-AX-1007)">BUS-07 (GJ-06-AX-1007)</option>
                    <option value="BUS-08 (GJ-06-AX-1008)">BUS-08 (GJ-06-AX-1008)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Assigned Route Number
                  </label>
                  <select
                    value={assignedRoute}
                    onChange={(e) => {
                      setAssignedRoute(e.target.value);
                      if (e.target.value === "Route R1") setRouteName("Soma Talav (BPC Pump) → GSFC University");
                      else if (e.target.value === "Route R2") setRouteName("Sama Savli Circle → GSFC University");
                      else if (e.target.value === "Route R3") setRouteName("Waghodia Road → GSFC University");
                      else if (e.target.value === "Route R4") setRouteName("Maneja → Makarpura → GSFC University");
                      else if (e.target.value === "Route R5") setRouteName("Gorwa Workshop → GSFC University");
                      else setRouteName("Vadodara City Transit Line");
                    }}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {Array.from({ length: 13 }, (_, i) => `Route R${i + 1}`).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pass Validity From & To */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Pass Valid From
                  </label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Pass Valid Until (Expiry Date)
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowGenerateModal(false);
                    setEditingPass(null);
                  }}
                  className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:opacity-90 transition active:scale-95"
                >
                  {editingPass ? "Save Modified Pass" : "✓ Generate Driver ID Pass"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: INSPECT / VIEW DIGITAL DRIVER ID PASS       */}
      {/* ==================================================== */}
      {viewingPass && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <span className="inline-block rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  VERIFIED TRANSPORT CREDENTIAL
                </span>
                <h3 className="font-display font-extrabold text-base text-foreground mt-0.5">
                  Official Driver Smart Pass
                </h3>
              </div>
              <button
                onClick={() => setViewingPass(null)}
                className="rounded-full bg-muted p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Premium Smart Card Preview */}
            <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-primary to-indigo-950 p-5 text-white space-y-4 shadow-xl border border-white/10 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <img src="/gsfc-transit-app-logo.png" alt="GSFCU" className="h-8 w-auto rounded-lg" />
                  <div>
                    <div className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                      GSFC UNIVERSITY TRANSIT
                    </div>
                    <div className="text-xs font-extrabold">DRIVER ID PASS</div>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-1.5 shadow-md">
                  <QRCodeSVG
                    value={JSON.stringify({
                      type: "DRIVER_PASS",
                      id: viewingPass.id,
                      name: viewingPass.driver_name,
                      empId: viewingPass.employee_id,
                      route: viewingPass.assigned_route,
                      bus: viewingPass.assigned_bus,
                      validUntil: viewingPass.valid_until,
                      code: viewingPass.security_badge_code,
                    })}
                    size={52}
                  />
                </div>
              </div>

              {/* Photo & Name */}
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 shrink-0 rounded-2xl bg-white/10 border-2 border-emerald-400/80 overflow-hidden flex items-center justify-center text-3xl shadow-md">
                  {viewingPass.photo_url ? (
                    <img src={viewingPass.photo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span>👨‍✈️</span>
                  )}
                </div>

                <div>
                  <div className="text-lg font-bold leading-tight">{viewingPass.driver_name}</div>
                  <div className="text-xs font-mono text-sky-300 font-bold mt-0.5">{viewingPass.employee_id}</div>
                  <div className="text-[10px] opacity-80 font-mono">Blood Group: {viewingPass.blood_group}</div>
                </div>
              </div>

              {/* Details table */}
              <div className="border-t border-white/10 pt-3 text-[11px] font-mono space-y-1.5 opacity-90">
                <div className="flex justify-between">
                  <span className="opacity-70">Assigned Bus:</span>
                  <span className="font-bold">{viewingPass.assigned_bus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Route:</span>
                  <span className="font-bold text-emerald-300">{viewingPass.assigned_route}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">License:</span>
                  <span>{viewingPass.license_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Pass Expiry:</span>
                  <span className="text-amber-300">{viewingPass.valid_until}</span>
                </div>
              </div>

              <div className="rounded-xl bg-white/10 p-2 text-center text-[10px] font-mono font-bold tracking-widest text-emerald-400">
                AUTHENTICATED & ACTIVE SHIFT PASS
              </div>
            </div>

            {/* Quick Actions inside preview */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  const passToEdit = viewingPass;
                  setViewingPass(null);
                  handleOpenEdit(passToEdit);
                }}
                className="flex-1 rounded-xl border border-border bg-card py-2 text-xs font-bold text-foreground hover:bg-muted transition flex items-center justify-center gap-1.5"
              >
                <Edit className="h-3.5 w-3.5 text-amber-500" /> Change Pass
              </button>

              <button
                onClick={() => printDriverIdCard(viewingPass)}
                className="flex-1 rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition flex items-center justify-center gap-1.5 shadow-md"
              >
                <Printer className="h-3.5 w-3.5" /> Print Physical ID
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


