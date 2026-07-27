import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "./app-shell";
import { toast } from "sonner";
import { Play, StopCircle, Radio, AlertTriangle, Gauge } from "lucide-react";

type User = { userId: string; role: "driver"; profile: { full_name: string } };

export default function DriverDashboard({ user }: { user: User }) {
  const qc = useQueryClient();
  const { data: buses = [] } = useQuery({
    queryKey: ["buses-with-routes"],
    queryFn: async () => (await supabase.from("buses").select("id, bus_number, plate, route_id, driver_id, routes(id,route_number,name)").eq("active", true)).data ?? [],
  });

  const { data: activeTrip, refetch: refetchTrip } = useQuery({
    queryKey: ["my-active-trip", user.userId],
    queryFn: async () => (await supabase.from("trips").select("*, buses(bus_number), routes(route_number,name)").eq("driver_id", user.userId).eq("active", true).maybeSingle()).data,
  });

  const [selectedBus, setSelectedBus] = useState<string>("");
  const [streaming, setStreaming] = useState(false);
  const [lastPos, setLastPos] = useState<{ lat: number; lng: number; speed?: number } | null>(null);
  const [pingCount, setPingCount] = useState(0);
  const watchIdRef = useRef<number | null>(null);

  const myBuses = buses.filter((b) => b.driver_id === user.userId || !b.driver_id);

  async function startTrip() {
    const bus = buses.find((b) => b.id === selectedBus);
    if (!bus || !bus.route_id) return toast.error("Select a bus with an assigned route");
    // ensure bus.driver_id — self-assign if empty (admin flow shortcut)
    if (!bus.driver_id) {
      await supabase.from("buses").update({ driver_id: user.userId }).eq("id", bus.id);
    }
    const { error } = await supabase.from("trips").insert({ bus_id: bus.id, route_id: bus.route_id, driver_id: user.userId, active: true });
    if (error) return toast.error(error.message);
    toast.success("Trip started");
    refetchTrip();
    qc.invalidateQueries({ queryKey: ["buses-with-routes"] });
  }

  async function endTrip() {
    if (!activeTrip) return;
    stopStreaming();
    await supabase.from("trips").update({ active: false, ended_at: new Date().toISOString() }).eq("id", activeTrip.id);
    toast.success("Trip ended");
    refetchTrip();
  }

  function startStreaming() {
    if (!activeTrip) return;
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setStreaming(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords;
        setLastPos({ lat: latitude, lng: longitude, speed: speed ?? undefined });
        setPingCount((c) => c + 1);
        await supabase.from("bus_locations").insert({
          bus_id: activeTrip.bus_id,
          trip_id: activeTrip.id,
          lat: latitude, lng: longitude,
          speed: speed != null ? speed * 3.6 : null,
          heading,
        });
      },
      (err) => toast.error("GPS: " + err.message),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  }

  function stopStreaming() {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setStreaming(false);
  }

  useEffect(() => () => stopStreaming(), []);

  async function sendAlert(type: "breakdown" | "traffic_delay") {
    if (!activeTrip) return;
    const msg = type === "breakdown" ? "Bus breakdown — please arrange alternate transport." : "Heavy traffic — expect delay of 10-15 minutes.";
    const { error } = await supabase.from("alerts").insert({ trip_id: activeTrip.id, route_id: activeTrip.route_id, driver_id: user.userId, alert_type: type, message: msg });
    if (error) return toast.error(error.message);
    toast.success("Alert sent to all students on route");
  }

  return (
    <AppShell title="Driver Companion" role={`Driver · ${user.profile.full_name}`}>
      {!activeTrip ? (
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8">
          <h2 className="font-display text-2xl font-semibold">Start your shift</h2>
          <p className="mt-1 text-sm text-muted-foreground">Select your bus & route, then tap Start.</p>
          <select value={selectedBus} onChange={(e) => setSelectedBus(e.target.value)} className="mt-6 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
            <option value="">Select bus…</option>
            {myBuses.map((b) => (
              <option key={b.id} value={b.id}>{b.bus_number} · {b.routes?.route_number} {b.routes?.name}</option>
            ))}
          </select>
          <button onClick={startTrip} disabled={!selectedBus} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            <Play className="h-4 w-4" /> Start Trip
          </button>
          {myBuses.length === 0 && <p className="mt-4 text-xs text-muted-foreground">No buses available. Ask a transport admin to assign one.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest opacity-70">On trip</div>
                <div className="mt-1 font-display text-3xl font-bold">{activeTrip.buses?.bus_number}</div>
                <div className="text-sm opacity-80">{activeTrip.routes?.route_number} · {activeTrip.routes?.name}</div>
              </div>
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${streaming ? "bg-success/30" : "bg-white/10"}`}>
                <Radio className={`h-3 w-3 ${streaming ? "animate-pulse" : ""}`} />
                {streaming ? "Streaming GPS" : "GPS idle"}
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-white/10 p-3">
                <div className="text-[10px] uppercase opacity-70">Pings</div>
                <div className="font-display text-xl font-bold">{pingCount}</div>
              </div>
              <div className="rounded-lg bg-white/10 p-3">
                <div className="text-[10px] uppercase opacity-70">Speed</div>
                <div className="font-display text-xl font-bold">{lastPos?.speed != null ? Math.round(lastPos.speed * 3.6) : 0} <span className="text-xs opacity-70">km/h</span></div>
              </div>
              <div className="rounded-lg bg-white/10 p-3">
                <div className="text-[10px] uppercase opacity-70">Position</div>
                <div className="font-mono text-xs">{lastPos ? `${lastPos.lat.toFixed(4)}, ${lastPos.lng.toFixed(4)}` : "—"}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {!streaming ? (
              <button onClick={startStreaming} className="flex items-center justify-center gap-2 rounded-lg bg-success py-4 text-sm font-semibold text-success-foreground">
                <Gauge className="h-4 w-4" /> Start GPS streaming
              </button>
            ) : (
              <button onClick={stopStreaming} className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-4 text-sm font-semibold">
                Pause GPS
              </button>
            )}
            <button onClick={() => sendAlert("traffic_delay")} className="flex items-center justify-center gap-2 rounded-lg bg-warning py-4 text-sm font-semibold text-warning-foreground">
              <AlertTriangle className="h-4 w-4" /> Traffic delay
            </button>
            <button onClick={() => sendAlert("breakdown")} className="flex items-center justify-center gap-2 rounded-lg bg-destructive py-4 text-sm font-semibold text-destructive-foreground">
              <AlertTriangle className="h-4 w-4" /> SOS breakdown
            </button>
          </div>

          <button onClick={endTrip} className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-card py-3 text-sm font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground">
            <StopCircle className="h-4 w-4" /> End Trip
          </button>
        </div>
      )}
    </AppShell>
  );
}
