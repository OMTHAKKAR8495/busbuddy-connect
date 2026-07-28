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

  const [selectedBus, setSelectedBus] = useState<string>("");
  const [streaming, setStreaming] = useState(false);
  const [lastPos, setLastPos] = useState<{ lat: number; lng: number; speed?: number; heading?: number } | null>(null);
  const [pingCount, setPingCount] = useState(0);
  const [customMsg, setCustomMsg] = useState("");
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [shiftSeconds, setShiftSeconds] = useState(0);

  const watchIdRef = useRef<number | null>(null);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Shift duration counter
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTrip) {
      interval = setInterval(() => setShiftSeconds((s) => s + 1), 1000);
    } else {
      setShiftSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeTrip]);

  const myBuses = buses.filter((b) => b.driver_id === user.userId || !b.driver_id);

  async function startTrip() {
    const bus = buses.find((b) => b.id === selectedBus);
    if (!bus || !bus.route_id) return toast.error("Select a bus with an assigned route");
    if (!bus.driver_id) {
      await supabase.from("buses").update({ driver_id: user.userId }).eq("id", bus.id);
    }
    const { error } = await supabase.from("trips").insert({
      bus_id: bus.id,
      route_id: bus.route_id,
      driver_id: user.userId,
      active: true,
    });
    if (error) return toast.error(error.message);
    toast.success(`Shift started on Route ${bus.routes?.route_number}`);
    refetchTrip();
    qc.invalidateQueries({ queryKey: ["buses-with-routes"] });
  }

  async function endTrip() {
    if (!activeTrip) return;
    stopStreaming();
    stopSimulation();
    await supabase.from("trips").update({ active: false, ended_at: new Date().toISOString() }).eq("id", activeTrip.id);
    toast.success("Shift ended successfully");
    refetchTrip();
  }

  // Real GPS watch position
  function startStreaming() {
    if (!activeTrip) return;
    if (!navigator.geolocation) return toast.error("Geolocation not supported by device browser");
    stopSimulation();
    setStreaming(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords;
        const currentSpeedKmh = speed != null ? speed * 3.6 : 35;
        setLastPos({ lat: latitude, lng: longitude, speed: currentSpeedKmh, heading: heading ?? 0 });
        setPingCount((c) => c + 1);

        await supabase.from("bus_locations").insert({
          bus_id: activeTrip.bus_id,
          trip_id: activeTrip.id,
          lat: latitude,
          lng: longitude,
          speed: currentSpeedKmh,
          heading: heading ?? 0,
        });
      },
      (err) => toast.error("GPS Error: " + err.message),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  }

  function stopStreaming() {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setStreaming(false);
  }

  // Simulation mode for testing route movement
  function startSimulation() {
    if (!activeTrip) return;
    stopStreaming();
    setIsSimulating(true);
    setStreaming(true);

    const polyline = (activeTrip.routes?.polyline as [number, number][]) ?? [
      [22.3655, 73.1815],
      [22.3712, 73.1865],
      [22.3801, 73.1932],
      [22.3910, 73.2015],
    ];

    let idx = 0;
    simTimerRef.current = setInterval(async () => {
      const point = polyline[idx % polyline.length];
      const speed = Math.floor(30 + Math.random() * 15);
      const heading = Math.floor(Math.random() * 360);
      setLastPos({ lat: point[0], lng: point[1], speed, heading });
      setPingCount((c) => c + 1);

      await supabase.from("bus_locations").insert({
        bus_id: activeTrip.bus_id,
        trip_id: activeTrip.id,
        lat: point[0],
        lng: point[1],
        speed,
        heading,
      });

      idx++;
    }, 3000);
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
    if (!activeTrip) return;
    const msg =
      customText ||
      (type === "breakdown"
        ? "SOS ALERT: Bus breakdown on route. Alternate shuttle dispatched."
        : "TRAFFIC DELAY: Heavy congestion. Expect 10-15 min delay.");

    const { error } = await supabase.from("alerts").insert({
      trip_id: activeTrip.id,
      route_id: activeTrip.route_id,
      driver_id: user.userId,
      alert_type: type,
      message: msg,
    });
    if (error) return toast.error(error.message);
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
      {!activeTrip ? (
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

            <button
              onClick={startTrip}
              disabled={!selectedBus}
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
                  Bus {activeTrip.buses?.bus_number} ({activeTrip.buses?.plate})
                </h2>
                <p className="text-sm opacity-90 font-medium mt-0.5">
                  Route {activeTrip.routes?.route_number}: {activeTrip.routes?.name}
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

          {/* Controls & Action Buttons */}
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

          {/* Broadcast Custom Message Action */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-display font-bold text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" /> Route Broadcast Dispatch
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Send an instant push update to all students tracking Route {activeTrip.routes?.route_number}.
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

          {/* End Shift */}
          <button
            onClick={endTrip}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-card py-4 text-sm font-bold text-red-600 hover:bg-red-500 hover:text-white transition shadow-sm"
          >
            <StopCircle className="h-5 w-5" /> Complete Shift & Stop Tracking
          </button>
        </div>
      )}
    </AppShell>
  );
}
