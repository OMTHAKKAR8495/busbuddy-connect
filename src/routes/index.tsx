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
  Download,
  Apple,
  Play,
  Route as RouteIcon,
  Sun,
  Moon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LiveMap, { type BusOnMap } from "@/components/live-map";

const ALL_13_ROUTES = [
  {
    id: "route-1",
    number: "Route R1",
    name: "Soma Talav (BPC Pump) → GSFC University",
    start: "Soma Talav (BPC Pump)",
    bus: "Bus #01 (GJ-16-AU-4788)",
    speed: "42 km/h",
    currentStopIdx: 1,
    stops: [
      { name: "Soma Talav (BPC Pump)", time: "07:30 AM" },
      { name: "Gurukul Char Rasta", time: "07:38 AM" },
      { name: "Bapod Police St", time: "07:46 AM" },
      { name: "Super Bakery", time: "07:54 AM" },
      { name: "GSFC University", time: "08:15 AM" },
    ],
  },
  {
    id: "route-2",
    number: "Route R2",
    name: "Parivar Char Rasta → GSFC University",
    start: "Parivar Char Rasta",
    bus: "Bus #02 (GJ-06-BX-3670)",
    speed: "38 km/h",
    currentStopIdx: 1,
    stops: [
      { name: "Parivar Char Rasta", time: "07:30 AM" },
      { name: "Vrundavan Circle", time: "07:38 AM" },
      { name: "Sardar Estate (ISS)", time: "07:46 AM" },
      { name: "Earth Icon", time: "07:54 AM" },
      { name: "Amit Nagar", time: "08:02 AM" },
      { name: "GSFC University", time: "08:15 AM" },
    ],
  },
  {
    id: "route-3",
    number: "Route R3",
    name: "Khodiyar Nagar → GSFC University",
    start: "Khodiyar Nagar",
    bus: "Bus #03 (GJ-06-BV-2875 - 50 Seater)",
    speed: "35 km/h",
    currentStopIdx: 1,
    stops: [
      { name: "Khodiyar Nagar", time: "07:30 AM" },
      { name: "Airport Circle", time: "07:38 AM" },
      { name: "Harni Gada Circle", time: "07:46 AM" },
      { name: "Golden Chokadi", time: "07:54 AM" },
      { name: "Dena Chokadi", time: "08:02 AM" },
      { name: "GSFC University", time: "08:15 AM" },
    ],
  },
  {
    id: "route-4",
    number: "Route R4",
    name: "Chankypuri → GSFC University",
    start: "Chankypuri",
    bus: "Bus #04 (GJ-06-AX-3348)",
    speed: "40 km/h",
    currentStopIdx: 1,
    stops: [
      { name: "Chankypuri", time: "07:40 AM" },
      { name: "Abhilasha Char Rasta", time: "07:48 AM" },
      { name: "Miletry Boys", time: "07:56 AM" },
      { name: "GSFC University", time: "08:15 AM" },
    ],
  },
  {
    id: "route-5",
    number: "Route R5",
    name: "Earth Icon → GSFC University",
    start: "Earth Icon",
    bus: "Bus #05 (GJ-16-AU-4890)",
    speed: "36 km/h",
    currentStopIdx: 1,
    stops: [
      { name: "Earth Icon", time: "07:35 AM" },
      { name: "Jagdish Farshan", time: "07:43 AM" },
      { name: "Amit Nagar", time: "07:51 AM" },
      { name: "L & T Circle", time: "07:59 AM" },
      { name: "GSFC University", time: "08:15 AM" },
    ],
  },
  {
    id: "route-6",
    number: "Route R6",
    name: "Voltamp Company → GSFC University",
    start: "Voltamp Company",
    bus: "Bus #06 (GJ-06-BV-7584)",
    speed: "34 km/h",
    currentStopIdx: 1,
    stops: [
      { name: "Voltamp Company", time: "07:25 AM" },
      { name: "Maneja Crossing", time: "07:33 AM" },
      { name: "Hanuman Temple (MAK)", time: "07:41 AM" },
      { name: "Novino", time: "07:49 AM" },
      { name: "Susen Circle", time: "07:57 AM" },
      { name: "GSFC University", time: "08:15 AM" },
    ],
  },
  {
    id: "route-7",
    number: "Route R7",
    name: "Ravi Park → GSFC University",
    start: "Ravi Park",
    bus: "Bus #07 (GJ-16-AU-1390)",
    speed: "39 km/h",
    currentStopIdx: 1,
    stops: [
      { name: "Ravi Park", time: "07:35 AM" },
      { name: "Gamgasagar", time: "07:43 AM" },
      { name: "Kabir Complex", time: "07:51 AM" },
      { name: "Polo Ground", time: "07:59 AM" },
      { name: "GSFC University", time: "08:15 AM" },
    ],
  },
  {
    id: "route-8",
    number: "Route R8",
    name: "Darbar Chowkdi → GSFC University",
    start: "Darbar Chowkdi",
    bus: "Bus #08 (GJ-06-BV-7989)",
    speed: "37 km/h",
    currentStopIdx: 1,
    stops: [
      { name: "Darbar Chowkdi", time: "07:25 AM" },
      { name: "Pramukh Prasad / Pramukh Darshan", time: "07:33 AM" },
      { name: "Avdhut Fatak / Lal Baug Fatak", time: "07:41 AM" },
      { name: "Kalaghoda", time: "07:49 AM" },
      { name: "Mahesana Nagar Circle", time: "07:57 AM" },
      { name: "GSFC University", time: "08:15 AM" },
    ],
  },
  {
    id: "route-9",
    number: "Route R9",
    name: "Sarswati Complex → GSFC University",
    start: "Sarswati Complex",
    bus: "Bus #09 (GJ-06-BV-2915)",
    speed: "41 km/h",
    currentStopIdx: 1,
    stops: [
      { name: "Sarswati Complex", time: "07:25 AM" },
      { name: "Tulsidham", time: "07:33 AM" },
      { name: "Raj Mahel Gate", time: "07:41 AM" },
      { name: "Fatehgunj- BOB", time: "07:49 AM" },
      { name: "Yogniketan", time: "07:57 AM" },
      { name: "Nizampura-Tasty Vadapav", time: "08:05 AM" },
      { name: "GSFC University", time: "08:15 AM" },
    ],
  },
  {
    id: "route-10",
    number: "Route R10",
    name: "Khishcoli Circle → GSFC University",
    start: "Khishcoli Circle",
    bus: "Bus #10 (GJ-16-AU-3840)",
    speed: "33 km/h",
    currentStopIdx: 1,
    stops: [
      { name: "Khishcoli Circle", time: "07:30 AM" },
      { name: "Atladra", time: "07:38 AM" },
      { name: "KIA Moter", time: "07:46 AM" },
      { name: "Sun Pharma Road", time: "07:54 AM" },
      { name: "Tandalja", time: "08:02 AM" },
      { name: "GSFC University", time: "08:15 AM" },
    ],
  },
  {
    id: "route-11",
    number: "Route R11",
    name: "Hari Nagar Char Rasta → GSFC University",
    start: "Hari Nagar Char Rasta",
    bus: "Bus #11 (GJ-06-AX-1826)",
    speed: "44 km/h",
    currentStopIdx: 1,
    stops: [
      { name: "Hari Nagar Char Rasta", time: "07:20 AM" },
      { name: "Nandalay Circle", time: "07:28 AM" },
      { name: "Zansi Ki Rani", time: "07:36 AM" },
      { name: "Jain Derasar", time: "07:44 AM" },
      { name: "Dashama Chokdi", time: "07:52 AM" },
      { name: "ITI Gorwa", time: "08:00 AM" },
      { name: "Panchwati Circle", time: "08:07 AM" },
      { name: "GSFC University", time: "08:15 AM" },
    ],
  },
  {
    id: "route-12",
    number: "Route R12",
    name: "Akshar Chowk → GSFC University",
    start: "Akshar Chowk",
    bus: "Bus #12 (GJ-06-BV-6129)",
    speed: "38 km/h",
    currentStopIdx: 1,
    stops: [
      { name: "Akshar Chowk", time: "07:15 AM" },
      { name: "Devdeep Nagar", time: "07:22 AM" },
      { name: "Vasna Circle-Kheteshwar", time: "07:30 AM" },
      { name: "Swaminarayan Mandir", time: "07:37 AM" },
      { name: "Time Circle", time: "07:45 AM" },
      { name: "Chhani Jakat Naka", time: "07:52 AM" },
      { name: "Chhani Canal", time: "08:00 AM" },
      { name: "Chhani Gurudwara", time: "08:07 AM" },
      { name: "GSFC University", time: "08:15 AM" },
    ],
  },
  {
    id: "route-13",
    number: "Route R13",
    name: "Nilamber Circle → GSFC University",
    start: "Nilamber Circle",
    bus: "Bus #13 (GJ-06-BV-6527)",
    speed: "30 km/h",
    currentStopIdx: 1,
    stops: [
      { name: "Nilamber Circle", time: "07:25 AM" },
      { name: "Yash Complex", time: "07:33 AM" },
      { name: "Natubhai Circle", time: "07:41 AM" },
      { name: "Chakli Circle", time: "07:49 AM" },
      { name: "Trident Circle", time: "07:57 AM" },
      { name: "Genda Circle", time: "08:05 AM" },
      { name: "GSFC University", time: "08:15 AM" },
    ],
  },
];

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
  const [showAllRoutesModal, setShowAllRoutesModal] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState("route-2");

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

  const toggleTheme = () => setIsDark((prev) => !prev);

  const activeRoute = ALL_13_ROUTES.find((r) => r.id === selectedRouteId) || ALL_13_ROUTES[1];

  const [liveBusesOnMap, setLiveBusesOnMap] = useState<BusOnMap[]>([
    { bus_id: "bus-01", label: "Bus BUS-01 (Active Shift)", lat: 22.3655, lng: 73.1815, speed: 38, heading: 90 },
  ]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    
    const timer = setInterval(() => {
      setLiveSimProgress((prev) => (prev >= 90 ? 15 : prev + 1.5));
    }, 1000);

    const handleTelemetry = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.lat) {
        setLiveBusesOnMap([
          {
            bus_id: detail.bus_id || "bus-01",
            label: detail.label || "Bus BUS-01 (Active Driver)",
            lat: detail.lat,
            lng: detail.lng,
            speed: detail.speed,
            heading: detail.heading,
          },
        ]);
      }
    };

    window.addEventListener("gsfc_live_telemetry_event", handleTelemetry);
    
    const stored = localStorage.getItem("gsfc_live_telemetry");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.lat) setLiveBusesOnMap([parsed]);
      } catch (err) {}
    }

    return () => {
      clearInterval(timer);
      window.removeEventListener("gsfc_live_telemetry_event", handleTelemetry);
    };
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
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = "/";
            }}
            className="flex items-center gap-3 group cursor-pointer"
            title="GSFCU Transit Home Page"
          >
            <img src="/gsfc-transit-app-logo.png" alt="GSFC Bus Transit System Logo" className="h-10 sm:h-12 w-auto object-contain rounded-xl shadow-md transition group-hover:scale-105" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-bold tracking-tight">GSFCU Transit</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">v2.4</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-semibold">GSFC University · Vadodara</p>
            </div>
          </a>

          <div className="flex items-center gap-3">
            {/* Light / Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground transition hover:bg-muted active:scale-95 min-h-[36px]"
              title="Toggle Light / Dark Mode Theme"
            >
              {isDark ? (
                <>
                  <Sun className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span className="hidden sm:inline font-semibold">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-indigo-500 fill-indigo-500" />
                  <span className="hidden sm:inline font-semibold">Dark Mode</span>
                </>
              )}
            </button>

            {/* Install Mobile App Button */}
            <button
              onClick={() => setShowInstallModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition"
            >
              <Smartphone className="h-4 w-4" /> Get Mobile App
            </button>

            {/* Dedicated Admin Portal Link */}
            <Link
              to="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition"
            >
              <ShieldCheck className="h-4 w-4" /> Admin Portal
            </Link>

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
                  <Smartphone className="h-5 w-5" /> Get Mobile App
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

            {/* Right Live Journey Simulation Widget & Route Selector */}
            <div className="lg:col-span-5 space-y-4">
              {/* Route Selector Dropdown Header */}
              <div className="rounded-2xl border border-primary/20 bg-muted/50 p-3 flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <RouteIcon className="h-4 w-4 text-primary shrink-0" />
                  <span>Select Route:</span>
                </div>
                <select
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-bold text-foreground outline-none focus:border-primary cursor-pointer max-w-[220px]"
                >
                  {ALL_13_ROUTES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.number} ({r.start})
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Route Card */}
              <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {activeRoute.bus}
                    </span>
                    <h3 className="font-display text-lg font-bold mt-1">{activeRoute.number}</h3>
                    <p className="text-xs text-muted-foreground">{activeRoute.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-emerald-500 font-bold">On Time</span>
                    <div className="text-xs text-muted-foreground font-mono">{activeRoute.speed}</div>
                  </div>
                </div>

                {/* Live Map Widget displaying Driver Bus moving live across all 3 departments */}
                <div className="rounded-2xl border border-primary/20 overflow-hidden shadow-md space-y-1 bg-card">
                  <div className="bg-primary/10 px-3 py-2 text-xs font-bold text-primary flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-500" /> Live Driver Telemetry Map Stream
                    </span>
                    <span className="font-mono text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">
                      Synced Across Students, Admin & Home
                    </span>
                  </div>
                  <LiveMap
                    buses={liveBusesOnMap}
                    routes={[
                      {
                        polyline: [
                          [22.3655, 73.1815],
                          [22.3712, 73.1865],
                          [22.3801, 73.1932],
                          [22.3910, 73.2015],
                          [22.3980, 73.2090],
                        ],
                        color: "#10b981",
                      },
                    ]}
                    center={[liveBusesOnMap[0]?.lat || 22.3655, liveBusesOnMap[0]?.lng || 73.1815]}
                    zoom={13}
                    height={210}
                  />
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

                {/* Dynamic Route Stops Timeline */}
                <div className="space-y-3 pt-2 text-xs">
                  {activeRoute.stops.map((stop, idx) => {
                    const isPassed = idx < activeRoute.currentStopIdx;
                    const isCurrent = idx === activeRoute.currentStopIdx;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between rounded-xl p-3 border transition ${
                          isCurrent
                            ? "bg-primary/10 border-primary/30 text-primary font-bold shadow-sm"
                            : isPassed
                            ? "bg-muted/30 border-border/40 text-muted-foreground"
                            : "bg-muted/30 border-border/40 text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isCurrent ? (
                            <Radio className="h-4 w-4 animate-pulse text-primary shrink-0" />
                          ) : isPassed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                          )}
                          <span>{stop.name}</span>
                        </div>
                        <span className="font-mono text-xs">
                          {isCurrent ? "Current Stop (ETA 2 min)" : stop.time}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* View All 13 Routes Modal Trigger */}
                <button
                  type="button"
                  onClick={() => setShowAllRoutesModal(true)}
                  className="w-full rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 py-2.5 text-xs font-bold text-primary transition flex items-center justify-center gap-2"
                >
                  <RouteIcon className="h-4 w-4" /> Explore All 13 Bus Routes Network
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Official Footer */}
      <footer className="border-t border-border/60 bg-muted/30 py-8 px-6 mt-12">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <img src="/gsfc-transit-app-logo.png" alt="GSFC Bus Transit Logo" className="h-8 w-auto rounded-lg" />
            <div>
              <div className="font-display font-bold text-sm text-foreground">GSFC BUS TRANSIT SYSTEM</div>
              <p className="text-xs text-muted-foreground">GSFC University · Vigyan Bhavan, Vadodara, Gujarat 391750</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            © 2026 GSFC Bus Transit System. All Rights Reserved.
          </div>
        </div>
      </footer>

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
              {/* App Store & Play Store Action Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Apple App Store */}
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

                {/* Google Play Store */}
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

              {/* Instant Web PWA Install Guide */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2 text-xs">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-500" /> Instant Mobile App (No App Store Login Needed)
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  You can also open <strong>https://busbuddy-connect.vercel.app</strong> on your phone and tap <strong>Add to Home Screen</strong> to install the full mobile app instantly!
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

      {/* Explore All 13 Bus Routes Modal */}
      {showAllRoutesModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <RouteIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-extrabold">Official GSFCU 13 Shuttle Routes Network</h3>
                  <p className="text-xs text-muted-foreground">Select any route to preview its live stop timeline & departure schedule</p>
                </div>
              </div>
              <button
                onClick={() => setShowAllRoutesModal(false)}
                className="rounded-full bg-muted p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-1">
              {ALL_13_ROUTES.map((r) => (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedRouteId(r.id);
                    setShowAllRoutesModal(false);
                  }}
                  className={`rounded-2xl border p-4 cursor-pointer transition hover:scale-[1.02] ${
                    selectedRouteId === r.id
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border/80 bg-muted/20 hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary">{r.number}</span>
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {r.bus}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-foreground mt-2">{r.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">Start: {r.start}</p>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-mono border-t border-border/40 pt-2">
                    <span className="text-muted-foreground">{r.stops.length} Stops</span>
                    <span className="text-primary font-bold">Select & Preview &rarr;</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right border-t border-border/60">
              <button
                onClick={() => setShowAllRoutesModal(false)}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-md min-h-[40px]"
              >
                Close Network View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
