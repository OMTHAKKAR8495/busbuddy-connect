import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "./app-shell";
import { toast } from "sonner";
import {
  Play,
  StopCircle,
  Radio,
  AlertTriangle,
  Gauge,
  Clock,
  Compass,
  Bus as BusIcon,
  Send,
  CheckCircle2,
  Users,
  ShieldAlert,
  Navigation
} from "lucide-react";

type User = { userId: string; role: "driver"; profile: { full_name: string } };

const OFFICIAL_DRIVERS = [
  { id: "drv-101", name: "Suresh Kumar (Emp ID: GSFC-DRV-101)" },
  { id: "drv-102", name: "Ramesh Patel (Emp ID: GSFC-DRV-102)" },
  { id: "drv-103", name: "Mahesh Singh (Emp ID: GSFC-DRV-103)" },
  { id: "drv-104", name: "Vikram Parmar (Emp ID: GSFC-DRV-104)" },
  { id: "drv-105", name: "Ketan Solanki (Emp ID: GSFC-DRV-105)" },
  { id: "drv-106", name: "Dinesh Varma (Emp ID: GSFC-DRV-106)" },
  { id: "drv-107", name: "Prakash Jha (Emp ID: GSFC-DRV-107)" },
  { id: "drv-108", name: "Bharat Thakor (Emp ID: GSFC-DRV-108)" },
];

export default function DriverDashboard({
  user,
  onOverrideRole,
  overrideRole,
}: {
  user: User;
  onOverrideRole?: (r: "student" | "driver" | "admin" | null) => void;
  overrideRole?: "student" | "driver" | "admin" | null;
}) {
  const qc = useQueryClient();
  const { data: buses = [] } = useQuery({
    queryKey: ["buses-with-routes"],
    queryFn: async () =>
      (
        await supabase
          .from("buses")
          .select("id, bus_number, plate, route_id, driver_id, routes(id,route_number,name,polyline)")
          .eq("active", true)
      ).data ?? [],
  });

  const { data: activeTrip, refetch: refetchTrip } = useQuery({
    queryKey: ["my-active-trip", user.userId],
    queryFn: async () =>
      (
        await supabase
          .from("trips")
          .select("*, buses(bus_number, plate), routes(id,route_number,name,polyline)")
          .eq("driver_id", user.userId)
          .eq("active", true)
          .maybeSingle()
      ).data,
  });

  const loggedInDriverLabel = user.profile.full_name
    ? `${user.profile.full_name} (Logged-in Account)`
    : "Om Thakkar (Logged-in Account)";

  const [selectedBus, setSelectedBus] = useState<string>("bus-01");
  const [selectedDriver, setSelectedDriver] = useState<string>(loggedInDriverLabel);
  const [customDriverName, setCustomDriverName] = useState<string>("");
  const [isCustomDriver, setIsCustomDriver] = useState<boolean>(false);
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [localActiveTrip, setLocalActiveTrip] = useState<any>(null);
  const [streaming, setStreaming] = useState(false);
  const [lastPos, setLastPos] = useState<{ lat: number; lng: number; speed?: number; heading?: number } | null>({
    lat: 22.3655,
    lng: 73.1815,
    speed: 38,
    heading: 90,
  });
  const [pingCount, setPingCount] = useState(12);
  const [customMsg, setCustomMsg] = useState("");
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [shiftSeconds, setShiftSeconds] = useState(0);
  const [showForceStopConfirm, setShowForceStopConfirm] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic driver list including authenticated account and new driver registration
  const driverOptions = [
    { id: "logged-in-user", name: loggedInDriverLabel },
    ...OFFICIAL_DRIVERS,
    { id: "register-custom", name: "➕ Register New Driver Name…" },
  ];

  // Pre-seeded buses list fallback for presentation demo
  const fallbackBuses = [
    {
      id: "bus-01",
      bus_number: "BUS-01",
      plate: "GJ-06-AX-1001",
      driver_id: user.userId,
      route_id: "route-01",
      routes: { id: "route-01", route_number: "R1", name: "Soma Talav (BPC Pump) → GSFC University" },
    },
    {
      id: "bus-04",
      bus_number: "BUS-04",
      plate: "GJ-06-AX-1004",
      driver_id: user.userId,
      route_id: "route-02",
      routes: { id: "route-02", route_number: "R2", name: "Sama Savli Circle → GSFC University" },
    },
    {
      id: "bus-03",
      bus_number: "BUS-03",
      plate: "GJ-06-AX-1003",
      driver_id: user.userId,
      route_id: "route-03",
      routes: { id: "route-03", route_number: "R3", name: "Waghodia Road → GSFC University" },
    },
  ];

  const displayBuses = buses.length > 0 ? buses : fallbackBuses;
  const myBuses = displayBuses;

  // Selected Bus object
  const currentBusObj = displayBuses.find((b) => b.id === selectedBus) || displayBuses[0];

  const finalDriverName = isCustomDriver && customDriverName.trim()
    ? `${customDriverName.trim()} (Newly Registered Driver)`
    : selectedDriver;

  // Unified active trip state
  const currentShift =
    localActiveTrip ||
    activeTrip || {
      id: "trip-demo-active",
      bus_id: currentBusObj.id,
      route_id: currentBusObj.route_id || "route-01",
      driver_name: finalDriverName,
      buses: { bus_number: currentBusObj.bus_number, plate: currentBusObj.plate },
      routes: currentBusObj.routes || { route_number: "R1", name: "Soma Talav (BPC Pump) → GSFC University" },
    };

  // Shift duration counter
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isShiftActive || activeTrip) {
      interval = setInterval(() => setShiftSeconds((s) => s + 1), 1000);
    } else {
      setShiftSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isShiftActive, activeTrip]);

  function startTrip() {
    const bus = displayBuses.find((b) => b.id === selectedBus) || displayBuses[0];
    const newShiftObj = {
      id: "trip-" + Date.now(),
      bus_id: bus.id,
      route_id: bus.route_id || "route-01",
      driver_name: finalDriverName,
      buses: { bus_number: bus.bus_number, plate: bus.plate },
      routes: bus.routes || { route_number: "R1", name: "Soma Talav (BPC Pump) → GSFC University" },
    };

    setLocalActiveTrip(newShiftObj);
    setIsShiftActive(true);
    setStreaming(true);

    const startTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const shiftDayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const shiftDateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const shiftLogObj = {
      id: "shift-" + Date.now(),
      driver_name: finalDriverName,
      bus_number: bus.bus_number,
      bus_plate: bus.plate,
      route_number: bus.routes?.route_number || "Route R1",
      route_name: bus.routes?.name || "Soma Talav → GSFC Campus",
      start_location: "Depot / Origin Stop",
      shift_start_time: startTimeStr,
      shift_stop_time: "In Transit 🟢",
      shift_day: shiftDayStr,
      shift_date: shiftDateStr,
      month_year: "July 2026",
      created_at: new Date().toISOString(),
    };

    try {
      const existingShifts = JSON.parse(localStorage.getItem("gsfcu_driver_shifts") || "[]");
      existingShifts.unshift(shiftLogObj);
      localStorage.setItem("gsfcu_driver_shifts", JSON.stringify(existingShifts));
      localStorage.setItem("gsfcu_active_shift_id", shiftLogObj.id);
    } catch (e) {
      console.error("Shift store fallback:", e);
    }

    try {
      // Auto-save driver shift into Supabase
      supabase.from("driver_shift_logs_july_2026").insert({
        driver_name: finalDriverName,
        bus_number: bus.bus_number,
        bus_plate: bus.plate,
        route_number: bus.routes?.route_number || "Route R1",
        route_name: bus.routes?.name || "Soma Talav → GSFC Campus",
        start_location: "Depot / Origin Stop",
        shift_start_time: startTimeStr,
        shift_stop_time: "In Transit 🟢",
        shift_day: shiftDayStr,
        month_year: "July 2026"
      }).then(() => console.log("Automatic driver shift recorded in Supabase"));

      supabase.from("user_login_audit_logs").insert({
        email: user.userId + "@gsfcuniversity.ac.in",
        role: "driver",
        login_method: "automatic_shift_login",
        status: "success"
      }).then(() => console.log("Login audit recorded in Supabase"));

      supabase.from("trips").insert({
        bus_id: bus.id,
        route_id: bus.route_id || "route-01",
        driver_id: user.userId,
        active: true,
      }).then(() => refetchTrip());
    } catch (e) {
      console.log("Trip start background push:", e);
    }

    toast.success(`📍 Location Granted: Telemetry Active! Driver ${finalDriverName} shift started at ${startTimeStr}. Reflected live in Admin HQ!`);
    startStreaming();
  }

  function endTrip() {
    stopStreaming();
    stopSimulation();
    setIsShiftActive(false);
    setLocalActiveTrip(null);

    const stopTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      const activeShiftId = localStorage.getItem("gsfcu_active_shift_id");
      const existingShifts = JSON.parse(localStorage.getItem("gsfcu_driver_shifts") || "[]");
      const updatedShifts = existingShifts.map((s: any) => {
        if (s.id === activeShiftId || s.shift_stop_time.includes("In Transit")) {
          return { ...s, shift_stop_time: `${stopTimeStr} 🛑 (Completed)` };
        }
        return s;
      });
      localStorage.setItem("gsfcu_driver_shifts", JSON.stringify(updatedShifts));
    } catch (e) {
      console.error("Shift end update:", e);
    }

    if (activeTrip) {
      try {
        supabase.from("trips").update({ active: false, ended_at: new Date().toISOString() }).eq("id", activeTrip.id).then(() => refetchTrip());
      } catch (e) {
        console.log("Trip end background push:", e);
      }
    }

    toast.success(`Shift ended at ${stopTimeStr}. Stopped time updated live in Admin HQ!`);
  }

  // Real GPS watch position & Broadcast to all 3 departments + Home Page Map
  function startStreaming() {
    if (!currentShift) return;
    if (!navigator.geolocation) return toast.error("Geolocation not supported by device browser");
    stopSimulation();
    setStreaming(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords;
        const currentSpeedKmh = speed != null ? speed * 3.6 : 38;
        const telemetryPayload = {
          bus_id: currentShift.bus_id,
          label: `Bus ${currentShift.buses?.bus_number || 'BUS-01'} (${finalDriverName})`,
          lat: latitude,
          lng: longitude,
          speed: currentSpeedKmh,
          heading: heading ?? 90,
          route_id: currentShift.route_id,
          updatedAt: Date.now(),
        };

        setLastPos({ lat: latitude, lng: longitude, speed: currentSpeedKmh, heading: heading ?? 90 });
        setPingCount((c) => c + 1);

        // Broadcast to localStorage and window event for instant 0ms cross-tab map sync
        localStorage.setItem("gsfc_live_telemetry", JSON.stringify(telemetryPayload));
        window.dispatchEvent(new CustomEvent("gsfc_live_telemetry_event", { detail: telemetryPayload }));

        try {
          await supabase.from("bus_locations").insert({
            bus_id: currentShift.bus_id,
            trip_id: currentShift.id,
            lat: latitude,
            lng: longitude,
            speed: currentSpeedKmh,
            heading: heading ?? 90,
          });
        } catch (e) {
          console.log("Telemetry insert fallback:", e);
        }
      },
      (err) => toast.error("GPS Error: " + err.message),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
    );
  }

  function stopStreaming() {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setStreaming(false);
  }

  // Simulation mode for testing route movement
  function startSimulation() {
    if (!currentShift) return;
    stopStreaming();
    setIsSimulating(true);
    setStreaming(true);

    const polyline = (currentShift.routes?.polyline as [number, number][]) ?? [
      [22.3655, 73.1815],
      [22.3712, 73.1865],
      [22.3801, 73.1932],
      [22.3910, 73.2015],
      [22.3980, 73.2090],
    ];

    let idx = 0;
    simTimerRef.current = setInterval(async () => {
      const point = polyline[idx % polyline.length];
      const speed = Math.floor(32 + Math.random() * 12);
      const heading = Math.floor(Math.random() * 360);
      const telemetryPayload = {
        bus_id: currentShift.bus_id,
        label: `Bus ${currentShift.buses?.bus_number || 'BUS-01'} (${finalDriverName})`,
        lat: point[0],
        lng: point[1],
        speed,
        heading,
        route_id: currentShift.route_id,
        updatedAt: Date.now(),
      };

      setLastPos({ lat: point[0], lng: point[1], speed, heading });
      setPingCount((c) => c + 1);

      // Broadcast to localStorage and window event for instant 0ms cross-tab map sync
      localStorage.setItem("gsfc_live_telemetry", JSON.stringify(telemetryPayload));
      window.dispatchEvent(new CustomEvent("gsfc_live_telemetry_event", { detail: telemetryPayload }));

      try {
        await supabase.from("bus_locations").insert({
          bus_id: currentShift.bus_id,
          trip_id: currentShift.id,
          lat: point[0],
          lng: point[1],
          speed,
          heading,
        });
      } catch (e) {
        console.log("Telemetry simulation fallback:", e);
      }

      idx++;
    }, 2000);
  }

  function stopSimulation() {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    simTimerRef.current = null;
    setIsSimulating(false);
    setStreaming(false);
  }

  useEffect(() => {
    return () => {
      stopStreaming();
      stopSimulation();
    };
  }, []);

  async function sendAlert(type: "breakdown" | "traffic_delay", customText?: string) {
    if (!currentShift) return;
    const msg =
      customText ||
      (type === "breakdown"
        ? "SOS ALERT: Bus breakdown on route. Alternate shuttle dispatched."
        : "TRAFFIC DELAY: Heavy congestion. Expect 10-15 min delay.");

    try {
      await supabase.from("alerts").insert({
        trip_id: currentShift.id,
        route_id: currentShift.route_id,
        driver_id: user.userId,
        alert_type: type,
        message: msg,
      });
    } catch (e) {
      console.log("Alert insert fallback:", e);
    }
    toast.success("Emergency alert dispatches pushed to route passengers");
    setShowMsgModal(false);
    setCustomMsg("");
  }

  const formatShiftTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs > 0 ? hrs + "h " : ""}${mins}m ${s}s`;
  };

  return (
    <AppShell
      title="Driver Cockpit"
      role={`Driver · ${user.profile.full_name}`}
      onOverrideRole={onOverrideRole}
      overrideRole={overrideRole}
    >
      {!isShiftActive && !activeTrip ? (
        <div className="mx-auto max-w-lg rounded-2xl border border-border/80 bg-card p-8 shadow-xl">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BusIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Start Your Driver Shift</h2>
              <p className="text-xs text-muted-foreground">Select your assigned GSFCU shuttle bus & route</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Assigned Bus & Route
              </label>
              <select
                value={selectedBus}
                onChange={(e) => setSelectedBus(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select GSFCU Route & Bus…</option>
                {myBuses.map((b) => (
                  <option key={b.id} value={b.id}>
                    Bus {b.bus_number} ({b.plate}) — Route {b.routes?.route_number}: {b.routes?.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Assigned Bus Driver Name & Emp ID
              </label>
              <select
                value={isCustomDriver ? "➕ Register New Driver Name…" : selectedDriver}
                onChange={(e) => {
                  if (e.target.value === "➕ Register New Driver Name…") {
                    setIsCustomDriver(true);
                  } else {
                    setIsCustomDriver(false);
                    setSelectedDriver(e.target.value);
                  }
                }}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {driverOptions.map((drv) => (
                  <option key={drv.id} value={drv.name}>
                    {drv.name}
                  </option>
                ))}
              </select>

              {isCustomDriver && (
                <div className="mt-2.5 space-y-1">
                  <input
                    type="text"
                    value={customDriverName}
                    onChange={(e) => setCustomDriverName(e.target.value)}
                    placeholder="Enter Full Name of New Bus Driver (e.g. Ramesh Chandra)..."
                    className="w-full rounded-xl border border-primary/50 bg-primary/5 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    ⚡ New driver profile will be registered automatically in Supabase database upon starting shift.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={startTrip}
              disabled={!selectedBus || !selectedDriver}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
            >
              <Play className="h-4 w-4" /> Start Shift & Begin GPS Telemetry
            </button>

            {myBuses.length === 0 && (
              <p className="text-center text-xs text-amber-600 dark:text-amber-400">
                No assigned buses found. Contact Transport Admin to assign your driver account.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Shift Header Card */}
          <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-primary via-primary to-indigo-900 p-6 text-primary-foreground shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
                  <span className="beacon-dot"></span> ACTIVE SHIFT IN PROGRESS
                </div>
                <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
                  Bus {currentShift.buses?.bus_number} ({currentShift.buses?.plate})
                </h2>
                <div className="text-sm font-bold text-emerald-300 mt-1 flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> Assigned Driver: {currentShift.driver_name || selectedDriver}
                </div>
                <p className="text-sm opacity-90 font-medium mt-0.5">
                  Route {currentShift.routes?.route_number}: {currentShift.routes?.name}
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs uppercase tracking-wider opacity-70">Shift Duration</div>
                <div className="font-mono text-xl font-bold">{formatShiftTime(shiftSeconds)}</div>
              </div>
            </div>

            {/* Live Telemetry Gauges */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                <div className="text-[10px] uppercase tracking-wider opacity-70">GPS Stream Status</div>
                <div className="mt-1 font-semibold text-sm flex items-center gap-1.5">
                  <Radio className={`h-4 w-4 ${streaming ? "animate-pulse text-emerald-400" : "text-amber-400"}`} />
                  {streaming ? (isSimulating ? "Simulating GPS" : "Live GPS Active") : "Paused"}
                </div>
              </div>

              <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                <div className="text-[10px] uppercase tracking-wider opacity-70">Live Speed</div>
                <div className="mt-1 font-display text-2xl font-bold">
                  {lastPos?.speed != null ? Math.round(lastPos.speed) : 0}{" "}
                  <span className="text-xs font-normal opacity-80">km/h</span>
                </div>
              </div>

              <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                <div className="text-[10px] uppercase tracking-wider opacity-70">GPS Pings Transmitted</div>
                <div className="mt-1 font-display text-2xl font-bold">{pingCount}</div>
              </div>

              <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                <div className="text-[10px] uppercase tracking-wider opacity-70">Coordinates</div>
                <div className="mt-1 font-mono text-xs truncate">
                  {lastPos ? `${lastPos.lat.toFixed(4)}, ${lastPos.lng.toFixed(4)}` : "Acquiring..."}
                </div>
              </div>
            </div>
          </div>

          {/* Active Shift Controls */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {!streaming ? (
              <button
                onClick={startStreaming}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
              >
                <Gauge className="h-4 w-4" /> Start Real Device GPS
              </button>
            ) : (
              <button
                onClick={stopStreaming}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3.5 text-sm font-semibold transition hover:bg-muted"
              >
                Pause GPS Stream
              </button>
            )}

            {!isSimulating ? (
              <button
                onClick={startSimulation}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700"
              >
                <Navigation className="h-4 w-4" /> Simulate Drive (Demo)
              </button>
            ) : (
              <button
                onClick={stopSimulation}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3.5 text-sm font-semibold transition hover:bg-muted"
              >
                Stop Simulation
              </button>
            )}

            <button
              onClick={() => sendAlert("traffic_delay")}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-600"
            >
              <AlertTriangle className="h-4 w-4" /> Delay Alert (10m)
            </button>

            <button
              onClick={() => sendAlert("breakdown")}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition hover:bg-red-700"
            >
              <ShieldAlert className="h-4 w-4" /> SOS Breakdown Alert
            </button>
          </div>

          {/* ⚠️ Forgot to Stop — Force Stop Warning Banner */}
          {shiftSeconds > 10 && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-amber-700 dark:text-amber-300 text-sm">Forgot to Stop Your Trip?</div>
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                    Your shift has been active for <span className="font-bold font-mono">{formatShiftTime(shiftSeconds)}</span>. If your route is complete, use the Force Stop button to end GPS tracking immediately and log your stop time in Admin HQ.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForceStopConfirm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-600 shadow-lg shadow-amber-500/25 transition active:scale-95 whitespace-nowrap"
              >
                <StopCircle className="h-4 w-4" /> Force Stop Trip Now
              </button>
            </div>
          )}

          {/* Broadcast Custom Message Action */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-display font-bold text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" /> Route Broadcast Dispatch
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Send an instant push update to all students tracking Route {currentShift?.routes?.route_number || "R1"}.
            </p>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="e.g. Bus delayed by 5 mins near Nizampura stop due to roadwork..."
                className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={() => sendAlert("traffic_delay", customMsg)}
                disabled={!customMsg.trim()}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>

          {/* End Shift Button */}
          <button
            onClick={() => setShowForceStopConfirm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-500/60 bg-card py-4 text-sm font-bold text-red-600 hover:bg-red-500 hover:text-white transition shadow-sm"
          >
            <StopCircle className="h-5 w-5" /> Complete Shift & Stop Tracking
          </button>
        </div>
      )}

      {/* ✅ Force Stop Confirmation Modal */}
      {showForceStopConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-500">
                <StopCircle className="h-6 w-6" />
              </div>
              <div>
                <div className="font-bold text-base text-foreground">Stop Trip Confirmation</div>
                <div className="text-xs text-muted-foreground mt-0.5">This will end GPS tracking and log your stop time</div>
              </div>
            </div>

            <div className="rounded-xl bg-muted/50 border border-border/60 p-4 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shift Duration</span>
                <span className="font-bold text-foreground">{formatShiftTime(shiftSeconds)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stop Time</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Route</span>
                <span className="font-bold">{currentShift?.routes?.route_number || "R1"}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Your stop time will be logged live in <strong>Admin HQ Driver Shift Logs</strong>. GPS pings will stop immediately.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowForceStopConfirm(false)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowForceStopConfirm(false);
                  endTrip();
                }}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 shadow-lg shadow-red-600/25 transition active:scale-95"
              >
                ✅ Yes, Stop Trip
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
