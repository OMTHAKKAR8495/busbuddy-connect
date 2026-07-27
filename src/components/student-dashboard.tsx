import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "./app-shell";
import LiveMap from "./live-map";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { MapPin, Clock, ShieldCheck, Plus, AlertTriangle } from "lucide-react";
import { haversineKm, etaMinutes } from "@/lib/geo";

type User = { userId: string; role: "student"; profile: { full_name: string; roll_number: string | null; photo_url: string | null } };

export default function StudentDashboard({ user }: { user: User }) {
  const [tab, setTab] = useState<"track" | "pass" | "alerts">("track");
  return (
    <AppShell title="GSFCU Transit" role={`Student · ${user.profile.full_name}`}>
      <div className="mb-4 flex gap-2 rounded-lg bg-muted p-1">
        {(["track", "pass", "alerts"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize transition ${tab === t ? "bg-card text-foreground shadow" : "text-muted-foreground"}`}>
            {t === "track" ? "Live tracking" : t === "pass" ? "Bus pass" : "Alerts"}
          </button>
        ))}
      </div>
      {tab === "track" && <TrackPanel />}
      {tab === "pass" && <PassPanel user={user} />}
      {tab === "alerts" && <AlertsPanel />}
    </AppShell>
  );
}

function TrackPanel() {
  const { data: routes = [] } = useQuery({
    queryKey: ["routes-with-stops"],
    queryFn: async () => {
      const { data } = await supabase.from("routes").select("id, route_number, name, polyline, stops(id,name,lat,lng,stop_order,scheduled_time)").eq("active", true).order("route_number");
      return data ?? [];
    },
  });
  const { data: buses = [] } = useQuery({
    queryKey: ["buses"],
    queryFn: async () => {
      const { data } = await supabase.from("buses").select("id, bus_number, route_id").eq("active", true);
      return data ?? [];
    },
  });

  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedStop, setSelectedStop] = useState<string | null>(null);
  const [locations, setLocations] = useState<Record<string, { lat: number; lng: number; speed?: number | null; heading?: number | null; recorded_at: string }>>({});

  useEffect(() => {
    if (routes.length && !selectedRoute) setSelectedRoute(routes[0].id);
  }, [routes, selectedRoute]);

  // initial fetch of latest locations
  useEffect(() => {
    supabase.from("latest_bus_locations").select("*").then(({ data }) => {
      if (!data) return;
      const map: typeof locations = {};
      data.forEach((r) => { map[r.bus_id as string] = { lat: r.lat as number, lng: r.lng as number, speed: r.speed, heading: r.heading, recorded_at: r.recorded_at as string }; });
      setLocations(map);
    });
  }, []);

  // realtime
  useEffect(() => {
    const ch = supabase.channel("bus-locations")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bus_locations" }, (payload) => {
        const r = payload.new as { bus_id: string; lat: number; lng: number; speed?: number; heading?: number; recorded_at: string };
        setLocations((prev) => ({ ...prev, [r.bus_id]: { lat: r.lat, lng: r.lng, speed: r.speed, heading: r.heading, recorded_at: r.recorded_at } }));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const route = useMemo(() => routes.find((r) => r.id === selectedRoute), [routes, selectedRoute]);
  const stops = useMemo(() => (route?.stops ?? []).slice().sort((a, b) => a.stop_order - b.stop_order), [route]);
  const routeBuses = buses.filter((b) => b.route_id === selectedRoute);

  const busMapPoints = routeBuses
    .map((b) => {
      const loc = locations[b.id];
      if (!loc) return null;
      return { bus_id: b.id, label: b.bus_number, lat: loc.lat, lng: loc.lng, speed: loc.speed, heading: loc.heading };
    })
    .filter(Boolean) as { bus_id: string; label: string; lat: number; lng: number; speed?: number | null; heading?: number | null }[];

  const stop = stops.find((s) => s.id === selectedStop);
  const eta = stop && busMapPoints[0]
    ? etaMinutes(haversineKm([busMapPoints[0].lat, busMapPoints[0].lng], [stop.lat, stop.lng]))
    : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="mb-3 flex flex-wrap gap-2">
          {routes.map((r) => (
            <button key={r.id} onClick={() => setSelectedRoute(r.id)} className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${selectedRoute === r.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary"}`}>
              {r.route_number} · {r.name}
            </button>
          ))}
        </div>
        <LiveMap
          buses={busMapPoints}
          routes={route ? [{ polyline: (route.polyline as [number, number][]) ?? [] }] : []}
          stops={stops.map((s) => ({ lat: s.lat, lng: s.lng, name: s.name }))}
          height={500}
        />
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">Your stop</h3>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </div>
          <select value={selectedStop ?? ""} onChange={(e) => setSelectedStop(e.target.value || null)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">Select pickup stop…</option>
            {stops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {stop && (
            <div className="mt-4 rounded-lg bg-secondary p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Estimated arrival</div>
              <div className="mt-1 flex items-baseline gap-2">
                {busMapPoints.length ? (
                  <>
                    <span className="font-display text-4xl font-bold text-primary">{eta}</span>
                    <span className="text-sm text-muted-foreground">min</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">No bus streaming right now</span>
                )}
              </div>
              {stop.scheduled_time && <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> Scheduled {stop.scheduled_time}</div>}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 font-display text-base font-semibold">Active buses on route</h3>
          {busMapPoints.length === 0 ? (
            <p className="text-xs text-muted-foreground">No driver has started a trip on this route yet.</p>
          ) : (
            <ul className="space-y-2">
              {busMapPoints.map((b) => (
                <li key={b.bus_id} className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
                  <span className="text-sm font-medium">{b.label}</span>
                  <span className="text-xs text-success">● Live · {b.speed ? Math.round(b.speed) : 0} km/h</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

function PassPanel({ user }: { user: User }) {
  const { data: passes = [], refetch } = useQuery({
    queryKey: ["my-passes"],
    queryFn: async () => {
      const { data } = await supabase.from("bus_passes").select("*, routes(route_number,name), stops!bus_passes_pickup_stop_id_fkey(name)").eq("student_id", user.userId).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: routes = [] } = useQuery({
    queryKey: ["routes-simple"],
    queryFn: async () => (await supabase.from("routes").select("id, route_number, name, stops(id,name,stop_order)").eq("active", true)).data ?? [],
  });

  const [showForm, setShowForm] = useState(false);
  const [routeId, setRouteId] = useState("");
  const [stopId, setStopId] = useState("");

  const active = passes.find((p) => p.status === "active");
  const pending = passes.find((p) => p.status === "pending");

  async function apply() {
    if (!routeId) return toast.error("Pick a route");
    const { error } = await supabase.from("bus_passes").insert({
      student_id: user.userId, route_id: routeId, pickup_stop_id: stopId || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Pass request submitted");
    setShowForm(false); setRouteId(""); setStopId("");
    refetch();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        {active ? <DigitalPass pass={active} user={user} /> : (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 font-display text-lg font-semibold">No active pass</h3>
            <p className="mt-1 text-sm text-muted-foreground">{pending ? "Your pass request is pending admin approval." : "Apply for a bus pass to get your digital QR."}</p>
            {!pending && !showForm && (
              <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                <Plus className="h-4 w-4" /> Apply for pass
              </button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-display text-base font-semibold">Pass history</h3>
        <ul className="mt-3 space-y-2">
          {passes.length === 0 && <li className="text-sm text-muted-foreground">None yet.</li>}
          {passes.map((p) => (
            <li key={p.id} className="rounded-lg bg-secondary p-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{p.routes?.route_number} · {p.routes?.name}</span>
                <StatusBadge status={p.status} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Valid {p.valid_from} → {p.valid_until} · Fee {p.fee_paid ? "paid" : "unpaid"}</div>
            </li>
          ))}
        </ul>

        {showForm && (
          <div className="mt-4 space-y-3 rounded-lg border border-border p-4">
            <select value={routeId} onChange={(e) => { setRouteId(e.target.value); setStopId(""); }} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select route…</option>
              {routes.map((r) => <option key={r.id} value={r.id}>{r.route_number} · {r.name}</option>)}
            </select>
            <select value={stopId} onChange={(e) => setStopId(e.target.value)} disabled={!routeId} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="">Pickup stop (optional)</option>
              {routes.find((r) => r.id === routeId)?.stops?.slice().sort((a: {stop_order: number}, b: {stop_order: number}) => a.stop_order - b.stop_order).map((s: {id: string; name: string}) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={apply} className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground">Submit</button>
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-success/15 text-success",
    pending: "bg-warning/15 text-warning-foreground",
    expired: "bg-muted text-muted-foreground",
    rejected: "bg-destructive/15 text-destructive",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${map[status] ?? "bg-muted"}`}>{status}</span>;
}

function DigitalPass({ pass, user }: { pass: { id: string; secret: string; valid_until: string; routes?: { route_number?: string; name?: string } | null }; user: User }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);
  const window = Math.floor(Date.now() / 15000); // rotate every 15s
  const token = `${pass.id.slice(0, 8)}.${window.toString(36)}.${pass.secret.slice(0, 6)}`;
  const qrValue = JSON.stringify({ p: pass.id, s: user.userId, r: pass.routes?.route_number, t: token });
  const timeLeft = 15 - Math.floor((Date.now() / 1000) % 15);
  void tick;

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-2xl">
      <div className="flex items-center justify-between px-6 pt-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] opacity-70">GSFCU Digital Pass</div>
          <div className="font-display text-2xl font-bold">{pass.routes?.route_number} · {pass.routes?.name}</div>
        </div>
        <ShieldCheck className="h-6 w-6 opacity-80" />
      </div>
      <div className="px-6 pb-6 pt-6">
        <div className="grid grid-cols-[1fr_auto] items-center gap-6">
          <div>
            <div className="text-xs opacity-70">Student</div>
            <div className="text-lg font-semibold">{user.profile.full_name}</div>
            {user.profile.roll_number && <div className="text-xs opacity-70">Roll: {user.profile.roll_number}</div>}
            <div className="mt-3 text-xs opacity-70">Valid until</div>
            <div className="text-sm font-medium">{pass.valid_until}</div>
          </div>
          <div className="rounded-xl bg-white p-3">
            <QRCodeSVG value={qrValue} size={128} level="M" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 text-xs">
          <span className="opacity-80">Rotating token</span>
          <span className="font-mono">{token.slice(-6)}</span>
          <span className="opacity-80">renews in {timeLeft}s</span>
        </div>
      </div>
    </div>
  );
}

function AlertsPanel() {
  const [alerts, setAlerts] = useState<{ id: string; alert_type: string; message: string | null; created_at: string; routes?: { route_number: string } | null }[]>([]);
  useEffect(() => {
    supabase.from("alerts").select("id, alert_type, message, created_at, routes(route_number)").order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setAlerts((data ?? []) as never));
    const ch = supabase.channel("alerts-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" }, (payload) => {
        setAlerts((prev) => [payload.new as never, ...prev]);
        toast.warning("New alert on your route");
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  return (
    <div className="space-y-3">
      {alerts.length === 0 && <p className="text-sm text-muted-foreground">No alerts.</p>}
      {alerts.map((a) => (
        <div key={a.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" />
          <div className="flex-1">
            <div className="text-sm font-medium capitalize">{a.alert_type.replace("_", " ")} · {a.routes?.route_number}</div>
            {a.message && <div className="text-xs text-muted-foreground">{a.message}</div>}
            <div className="mt-1 text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
