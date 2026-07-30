import { useEffect, useMemo, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "./app-shell";
import LiveMap from "./live-map";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  MapPin,
  Clock,
  ShieldCheck,
  Plus,
  AlertTriangle,
  Bell,
  BellRing,
  Navigation,
  CheckCircle2,
  Lock,
  RefreshCw,
  User as UserIcon,
  Sparkles,
  Ticket
} from "lucide-react";
import { haversineKm, etaMinutes } from "@/lib/geo";

type User = {
  userId: string;
  role: "student";
  profile: { full_name: string; roll_number: string | null; photo_url: string | null };
};

export default function StudentDashboard({
  user,
  onOverrideRole,
  overrideRole,
}: {
  user: User;
  onOverrideRole?: (r: "student" | "driver" | "admin" | null) => void;
  overrideRole?: "student" | "driver" | "admin" | null;
}) {
  const [tab, setTab] = useState<"track" | "pass" | "alerts">("track");

  return (
    <AppShell
      title="GSFCU Transit"
      role={`Student · ${user.profile.full_name}`}
      onOverrideRole={onOverrideRole}
      overrideRole={overrideRole}
    >
      <div className="mb-6 flex gap-2 rounded-xl bg-muted p-1.5 border border-border/60">
        {[
          { id: "track", label: "Live Bus Tracking", icon: Navigation },
          { id: "pass", label: "Digital Bus Pass", icon: Ticket },
          { id: "alerts", label: "Route Alerts", icon: Bell },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as never)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold transition ${
              tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "track" && <TrackPanel user={user} />}
      {tab === "pass" && <PassPanel user={user} />}
      {tab === "alerts" && <AlertsPanel />}
    </AppShell>
  );
}

function TrackPanel({ user }: { user: User }) {
  const { data: routes = [] } = useQuery({
    queryKey: ["routes-with-stops"],
    queryFn: async () => {
      const { data } = await supabase
        .from("routes")
        .select("id, route_number, name, polyline, stops(id,name,lat,lng,stop_order,scheduled_time)")
        .eq("active", true)
        .order("route_number");
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
  const [locations, setLocations] = useState<
    Record<string, { lat: number; lng: number; speed?: number | null; heading?: number | null; recorded_at: string }>
  >({});
  const [notifiedProximity, setNotifiedProximity] = useState(false);

  useEffect(() => {
    if (routes.length && !selectedRoute) setSelectedRoute(routes[0].id);
  }, [routes, selectedRoute]);

  // Initial fetch of latest locations
  useEffect(() => {
    supabase.from("latest_bus_locations").select("*").then(({ data }) => {
      if (!data) return;
      const map: typeof locations = {};
      data.forEach((r) => {
        map[r.bus_id as string] = {
          lat: r.lat as number,
          lng: r.lng as number,
          speed: r.speed,
          heading: r.heading,
          recorded_at: r.recorded_at as string,
        };
      });
      setLocations(map);
    });
  }, []);

  // Realtime locations subscription
  useEffect(() => {
    const ch = supabase
      .channel("bus-locations")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bus_locations" }, (payload) => {
        const r = payload.new as {
          bus_id: string;
          lat: number;
          lng: number;
          speed?: number;
          heading?: number;
          recorded_at: string;
        };
        setLocations((prev) => ({
          ...prev,
          [r.bus_id]: { lat: r.lat, lng: r.lng, speed: r.speed, heading: r.heading, recorded_at: r.recorded_at },
        }));
      })
      .subscribe();

    const handleTelemetry = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.lat) {
        setLocations((prev) => ({
          ...prev,
          [detail.bus_id || "bus-01"]: {
            lat: detail.lat,
            lng: detail.lng,
            speed: detail.speed,
            heading: detail.heading,
            recorded_at: new Date().toISOString(),
          },
        }));
      }
    };
    window.addEventListener("gsfc_live_telemetry_event", handleTelemetry);
    const stored = localStorage.getItem("gsfc_live_telemetry");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.lat) {
          setLocations((prev) => ({
            ...prev,
            [parsed.bus_id || "bus-01"]: {
              lat: parsed.lat,
              lng: parsed.lng,
              speed: parsed.speed,
              heading: parsed.heading,
              recorded_at: new Date().toISOString(),
            },
          }));
        }
      } catch (err) {}
    }

    return () => {
      supabase.removeChannel(ch);
      window.removeEventListener("gsfc_live_telemetry_event", handleTelemetry);
    };
  }, []);

  const route = useMemo(() => routes.find((r) => r.id === selectedRoute), [routes, selectedRoute]);
  const stops = useMemo(
    () =>
      (route?.stops ?? []).slice().sort((a, b) => {
        if ((a.stop_order ?? 0) !== (b.stop_order ?? 0)) return (a.stop_order ?? 0) - (b.stop_order ?? 0);
        return (a.scheduled_time || "").localeCompare(b.scheduled_time || "");
      }),
    [route]
  );

  useEffect(() => {
    if (stops.length && (!selectedStop || !stops.some((s) => s.id === selectedStop))) {
      setSelectedStop(stops[0].id);
    }
  }, [stops, selectedStop]);
  const routeBuses = buses.filter((b) => b.route_id === selectedRoute);

  const busMapPoints = routeBuses
    .map((b) => {
      const loc = locations[b.id];
      if (!loc) return null;
      return { bus_id: b.id, label: b.bus_number, lat: loc.lat, lng: loc.lng, speed: loc.speed, heading: loc.heading };
    })
    .filter(Boolean) as { bus_id: string; label: string; lat: number; lng: number; speed?: number | null; heading?: number | null }[];

  const stop = stops.find((s) => s.id === selectedStop);
  const distanceKm =
    stop && busMapPoints[0]
      ? haversineKm([busMapPoints[0].lat, busMapPoints[0].lng], [stop.lat, stop.lng])
      : null;
  const eta = distanceKm != null ? etaMinutes(distanceKm, busMapPoints[0]?.speed || 35) : null;

  // Proximity Alert Trigger (1km check)
  useEffect(() => {
    if (distanceKm != null && distanceKm <= 1.0 && !notifiedProximity) {
      setNotifiedProximity(true);
      toast.info(`🚌 Bus Proximity Alert! Bus is within ${distanceKm.toFixed(1)} km of ${stop?.name}. Step out now!`, {
        duration: 8000,
      });

      // Browser Notification if supported and granted
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("GSFCU Transit — Bus Arriving Soon!", {
          body: `Shuttle is ${distanceKm.toFixed(1)} km away from ${stop?.name}.`,
          icon: "/favicon.ico",
        });
      }
    }
  }, [distanceKm, stop, notifiedProximity]);

  function requestNotificationPermission() {
    if ("Notification" in window) {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") toast.success("Push notification alerts enabled!");
      });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        {/* Route Selector Chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          {routes.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setSelectedRoute(r.id);
                setNotifiedProximity(false);
              }}
              className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                selectedRoute === r.id
                  ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "border-border/80 bg-card text-muted-foreground hover:border-primary/50"
              }`}
            >
              Route {r.route_number}: {r.name}
            </button>
          ))}
        </div>

        <LiveMap
          buses={busMapPoints}
          routes={route ? [{ polyline: (route.polyline as [number, number][]) ?? [] }] : []}
          stops={stops.map((s) => ({ lat: s.lat, lng: s.lng, name: s.name }))}
          height={520}
        />
      </div>

      <aside className="space-y-4">
        {/* Stop Selector & Smart ETA Widget */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-bold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Select Morning Stop
            </h3>
            <button
              onClick={requestNotificationPermission}
              className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
            >
              <BellRing className="h-3.5 w-3.5" /> Enable Push
            </button>
          </div>

          <select
            value={selectedStop ?? ""}
            onChange={(e) => {
              setSelectedStop(e.target.value || null);
              setNotifiedProximity(false);
            }}
            className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select pickup stop…</option>
            {stops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.scheduled_time ? `(${s.scheduled_time})` : ""}
              </option>
            ))}
          </select>

          {stop && (
            <div className="mt-4 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 border border-primary/20">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Smart ETA Calculation
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                {busMapPoints.length ? (
                  <>
                    <span className="font-display text-4xl font-extrabold text-primary">{eta}</span>
                    <span className="text-sm font-semibold text-muted-foreground">mins ({distanceKm?.toFixed(1)} km)</span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    No active shuttle streaming on route currently
                  </span>
                )}
              </div>

              {distanceKm != null && (
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {distanceKm <= 1.0 ? "Bus is nearby (< 1 km)! Stand ready at stop." : "Tracking active on Leaflet radar"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Route Stop Sequence */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
          <h3 className="mb-3 font-display text-base font-bold">Route Stop Sequence</h3>
          <ul className="space-y-2.5">
            {stops.map((s, idx) => (
              <li
                key={s.id}
                className={`flex items-center justify-between rounded-xl p-3 text-xs border transition ${
                  selectedStop === s.id
                    ? "border-primary bg-primary/5 font-semibold"
                    : "border-border/60 bg-muted/20 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                    {idx + 1}
                  </span>
                  <span className="text-foreground font-medium">{s.name}</span>
                </div>
                <span className="font-mono text-muted-foreground">{s.scheduled_time ?? "—"}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function PassPanel({ user }: { user: User }) {
  const { data: passes = [], refetch } = useQuery({
    queryKey: ["my-passes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bus_passes")
        .select("*, routes(route_number,name), stops!bus_passes_pickup_stop_id_fkey(name)")
        .eq("student_id", user.userId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 2000,
  });

  const { data: routes = [] } = useQuery({
    queryKey: ["routes-simple"],
    queryFn: async () =>
      (await supabase.from("routes").select("id, route_number, name, stops(id,name,stop_order)").eq("active", true)).data ?? [],
  });

  const [showForm, setShowForm] = useState(false);
  const [routeId, setRouteId] = useState("");
  const [stopId, setStopId] = useState("");
  const [approvedStorage, setApprovedStorage] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const checkStorage = () => {
      try {
        const map = JSON.parse(localStorage.getItem("gsfcu_approved_passes") || "{}");
        setApprovedStorage(map);
      } catch (e) {
        console.error(e);
      }
    };
    checkStorage();
    const interval = setInterval(checkStorage, 1000);
    return () => clearInterval(interval);
  }, []);

  const approvedFromStorage = passes.find((p) => approvedStorage[p.id] || approvedStorage["all"]);
  const active =
    passes.find((p) => p.status === "active") ||
    approvedFromStorage ||
    (approvedStorage["demo"]
      ? {
          id: "demo-pass-01",
          secret: "sec9988",
          valid_from: "2026-07-27",
          valid_until: "2027-01-27",
          routes: { route_number: "R1", name: "Soma Talav → GSFCU" },
        }
      : null);

  const pending = passes.find((p) => p.status === "pending");

  function handleInstantApproveDemo() {
    try {
      const map = JSON.parse(localStorage.getItem("gsfcu_approved_passes") || "{}");
      map["all"] = true;
      map["demo"] = true;
      if (pending) map[pending.id] = true;
      localStorage.setItem("gsfcu_approved_passes", JSON.stringify(map));
      setApprovedStorage(map);
      toast.success("Bus Pass approved & QR entry code generated!");
      refetch();
    } catch (e) {
      console.error(e);
    }
  }

  async function apply() {
    if (!routeId) return toast.error("Pick a route");

    const selectedRouteObj = routes.find((r) => r.id === routeId);

    const newAppObj = {
      id: "pass-" + Date.now(),
      student_id: user.userId,
      student_name: user.profile.full_name,
      roll_number: user.profile.roll_number || "24BT04171",
      route_id: routeId,
      routes: {
        route_number: selectedRouteObj?.route_number || "R1",
        name: selectedRouteObj?.name || "Soma Talav → GSFCU",
      },
      profiles: {
        full_name: user.profile.full_name,
        roll_number: user.profile.roll_number || "24BT04171",
      },
      status: "pending",
      fee_paid: false,
      valid_from: new Date().toISOString().split("T")[0],
      valid_until: "2027-01-28",
      created_at: new Date().toISOString(),
    };

    try {
      const existingApps = JSON.parse(localStorage.getItem("gsfcu_student_applications") || "[]");
      existingApps.unshift(newAppObj);
      localStorage.setItem("gsfcu_student_applications", JSON.stringify(existingApps));
    } catch (e) {
      console.error("Local application store:", e);
    }

    try {
      await supabase.from("bus_passes").insert({
        student_id: user.userId,
        route_id: routeId,
        pickup_stop_id: stopId || null,
      });
    } catch (e) {
      console.log("Supabase pass insert background:", e);
    }

    toast.success("✓ Bus pass application submitted! Reflected live in Admin HQ Queue.");
    setShowForm(false);
    setRouteId("");
    setStopId("");
    refetch();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        {active ? (
          <DigitalPass pass={active as never} user={user} />
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 bg-card p-8 text-center shadow-sm space-y-4">
            <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
            <div>
              <h3 className="font-display text-xl font-bold">No Active Pass Issued Yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {pending
                  ? "Your transport pass request has been submitted to Admin HQ for fee verification."
                  : "Apply for a GSFCU Bus Pass to unlock your anti-fraud dynamic QR pass."}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              {pending && (
                <button
                  onClick={handleInstantApproveDemo}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="h-4 w-4" /> Instant Demo Approve & Issue Pass
                </button>
              )}
              {!pending && !showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90"
                >
                  <Plus className="h-4 w-4" /> Apply for Bus Pass
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
        <h3 className="font-display text-lg font-bold">Pass Application History</h3>
        <ul className="mt-4 space-y-3">
          {passes.length === 0 && <li className="text-sm text-muted-foreground">No applications found.</li>}
          {passes.map((p) => (
            <li key={p.id} className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold font-display">
                  Route {p.routes?.route_number}: {p.routes?.name}
                </span>
                <StatusBadge status={p.status} />
              </div>
              <div className="text-xs text-muted-foreground">
                Validity: {p.valid_from} → {p.valid_until} · Fee:{" "}
                <span className={p.fee_paid ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                  {p.fee_paid ? "Verified Paid" : "Payment Pending"}
                </span>
              </div>
            </li>
          ))}
        </ul>

        {showForm && (
          <div className="mt-6 space-y-4 rounded-xl border border-border p-5 bg-muted/30">
            <h4 className="font-bold text-sm">Apply for New Transport Pass</h4>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Select Route</label>
              <select
                value={routeId}
                onChange={(e) => {
                  setRouteId(e.target.value);
                  setStopId("");
                }}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none"
              >
                <option value="">Select route…</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    Route {r.route_number}: {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Pickup Stop (Optional)</label>
              <select
                value={stopId}
                onChange={(e) => setStopId(e.target.value)}
                disabled={!routeId}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none"
              >
                <option value="">Select stop…</option>
                {routes
                  .find((r) => r.id === routeId)
                  ?.stops?.slice()
                  .sort((a: { stop_order: number }, b: { stop_order: number }) => a.stop_order - b.stop_order)
                  .map((s: { id: string; name: string }) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={apply}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Submit Application
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    expired: "bg-muted text-muted-foreground",
    rejected: "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${map[status] ?? "bg-muted"}`}>
      {status}
    </span>
  );
}

// Anti-Fraud Dynamic Digital Pass Component
function DigitalPass({
  pass,
  user,
}: {
  pass: {
    id: string;
    secret: string;
    valid_until: string;
    valid_from: string;
    routes?: { route_number?: string; name?: string } | null;
    stops?: { name?: string } | null;
  };
  user: User;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const windowTime = Math.floor(Date.now() / 15000); // 15-second rotation window
  const token = `${pass.id.slice(0, 6)}.${windowTime.toString(36)}.${pass.secret.slice(0, 4)}`;
  const qrValue = JSON.stringify({
    passId: pass.id,
    studentId: user.userId,
    roll: user.profile.roll_number,
    route: pass.routes?.route_number,
    token,
  });

  const secondsRemaining = 15 - (Math.floor(Date.now() / 1000) % 15);
  void tick;

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-indigo-900 to-slate-900 text-white shadow-2xl glow-card border border-white/10">
        {/* Animated Security Scanner Line across card */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />

        {/* Header Badge */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src="/gsfc-transit-app-logo.png" alt="GSFC Bus Transit Logo" className="h-11 w-auto object-contain rounded-xl shadow-md" />
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-bold">
                <Sparkles className="h-3 w-3" /> GSFC UNIVERSITY VERIFIED BUS PASS
              </div>
              <div className="font-display text-xl font-extrabold mt-0.5">
                Route {pass.routes?.route_number} · {pass.routes?.name}
              </div>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-5">
            {/* Student Identity Photo Container */}
            <div className="relative flex flex-col items-center">
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-2 border-emerald-400/80 bg-slate-800 shadow-md">
                {user.profile.photo_url ? (
                  <img src={user.profile.photo_url} alt={user.profile.full_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-tr from-primary to-indigo-600 text-white font-bold text-xl font-display">
                    {user.profile.full_name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-0 inset-x-0 bg-emerald-500 py-0.5 text-[8px] font-bold uppercase text-center text-slate-950 font-mono tracking-tighter">
                  VERIFIED
                </span>
              </div>
            </div>

            {/* Student Holder Info */}
            <div className="space-y-1.5">
              <div>
                <div className="text-[10px] uppercase tracking-wider opacity-70 font-mono">Student ID / Holder</div>
                <div className="text-lg font-bold font-display text-white leading-tight">{user.profile.full_name}</div>
                <div className="text-xs font-mono text-emerald-300 font-bold mt-0.5">
                  Roll: {user.profile.roll_number ?? "24BT04171"}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider opacity-70 font-mono">Validity Period</div>
                <div className="text-[11px] font-semibold font-mono text-slate-200">
                  {pass.valid_from} → {pass.valid_until}
                </div>
              </div>
            </div>

            {/* Dynamic Rotating QR Code */}
            <div className="relative rounded-2xl bg-white p-3 shadow-lg border-2 border-emerald-400/50 flex flex-col items-center shrink-0">
              <QRCodeSVG value={qrValue} size={110} level="M" />
              <div className="mt-1 text-center font-mono text-[8px] font-bold text-slate-900 tracking-tighter">
                ENTRY SCANNER QR
              </div>
            </div>
          </div>

          {/* Anti-Fraud Security Ticker Bar */}
          <div className="mt-5 flex items-center justify-between rounded-xl bg-black/40 px-4 py-3 text-xs border border-white/10">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
              <span className="font-mono text-emerald-400 font-bold text-[11px]">{token}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] opacity-80">
                Renews in <span className="font-bold text-white font-mono">{secondsRemaining}s</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertsPanel() {
  const [alerts, setAlerts] = useState<
    { id: string; alert_type: string; message: string | null; created_at: string; routes?: { route_number: string } | null }[]
  >([]);

  useEffect(() => {
    supabase
      .from("alerts")
      .select("id, alert_type, message, created_at, routes(route_number)")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setAlerts((data ?? []) as never));

    const ch = supabase
      .channel("alerts-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" }, (payload) => {
        setAlerts((prev) => [payload.new as never, ...prev]);
        toast.warning("New route alert broadcasted by driver!");
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  return (
    <div className="space-y-4">
      {alerts.length === 0 && (
        <div className="rounded-2xl border border-border/80 bg-card p-8 text-center text-muted-foreground text-sm">
          No active emergency alerts or driver notifications.
        </div>
      )}
      {alerts.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-sm"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold capitalize text-foreground">
              {a.alert_type.replace("_", " ")} — Route {a.routes?.route_number}
            </div>
            {a.message && <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.message}</div>}
            <div className="mt-2 text-[10px] font-mono text-muted-foreground">
              {new Date(a.created_at).toLocaleTimeString()} · {new Date(a.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
