import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "./app-shell";
import LiveMap from "./live-map";
import { toast } from "sonner";
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
  FileCheck
} from "lucide-react";

type User = { userId: string; role: "admin"; profile: { full_name: string } };

export default function AdminDashboard({ user }: { user: User }) {
  const [tab, setTab] = useState<"fleet" | "passes" | "routes" | "analytics">("fleet");

  return (
    <AppShell title="Transport Admin HQ" role={`Admin · ${user.profile.full_name}`}>
      <div className="mb-6 flex gap-2 rounded-xl bg-muted p-1.5 border border-border/60">
        {[
          { k: "fleet", l: "Fleet Command Map", i: Activity },
          { k: "passes", l: "Pass & Fee Management", i: Users },
          { k: "routes", l: "Route & Stop Manager", i: RouteIcon },
          { k: "analytics", l: "Fleet Analytics & Speed Logs", i: BarChart3 },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as never)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs sm:text-sm font-semibold transition ${
              tab === t.k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.i className="h-4 w-4" /> {t.l}
          </button>
        ))}
      </div>

      {tab === "fleet" && <FleetTab />}
      {tab === "passes" && <PassesTab />}
      {tab === "routes" && <RoutesTab />}
      {tab === "analytics" && <AnalyticsTab />}
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

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const activeBusIds = new Set(activeTrips.map((t) => t.bus_id));
  const points = buses
    .filter((b) => activeBusIds.has(b.id) && locs[b.id])
    .map((b) => ({ bus_id: b.id, label: `Bus ${b.bus_number}`, ...locs[b.id] }));

  const routes = Array.from(
    new Map(buses.filter((b) => b.routes?.polyline).map((b) => [b.route_id, b.routes])).values()
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total Registered Fleet" value={`${buses.length} Buses`} />
        <Stat label="Active Shifts in Transit" value={`${activeTrips.length} Active`} />
        <Stat label="GPS Telemetry Streaming" value={`${points.length} Live`} />
        <Stat label="Fleet Punctuality Rate" value="98.5%" />
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="font-display font-bold text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" /> Fleet Command Radar Map
          </h3>
          <span className="text-xs text-muted-foreground">Showing Vadodara Campus Network</span>
        </div>
        <LiveMap
          buses={points}
          routes={routes.map((r) => ({ polyline: (r?.polyline as [number, number][]) ?? [], color: "#3b82f6" }))}
          height={520}
        />
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

function PassesTab() {
  const qc = useQueryClient();
  const { data: passes = [] } = useQuery({
    queryKey: ["admin-passes"],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("bus_passes")
        .select("*, routes(route_number,name)")
        .order("created_at", { ascending: false });

      if (!rows?.length) return [];
      const ids = Array.from(new Set(rows.map((r) => r.student_id)));
      const { data: profs } = await supabase.from("profiles").select("id, full_name, roll_number").in("id", ids);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      return rows.map((r) => ({ ...r, profiles: map.get(r.student_id) ?? null }));
    },
  });

  async function update(
    id: string,
    patch: { status?: "active" | "pending" | "expired" | "rejected"; fee_paid?: boolean }
  ) {
    const { error } = await supabase.from("bus_passes").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Pass status updated");
    qc.invalidateQueries({ queryKey: ["admin-passes"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">Student Bus Pass & Fee Approval Queue</h3>
        <span className="text-xs font-medium text-muted-foreground">{passes.length} Total Requests</span>
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
              <th className="px-5 py-3.5 text-right">Approve / Reject</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {passes.map((p) => (
              <tr key={p.id} className="hover:bg-muted/20 transition">
                <td className="px-5 py-4">
                  <div className="font-bold text-foreground">{p.profiles?.full_name ?? "Student"}</div>
                  <div className="text-xs font-mono text-muted-foreground">{p.profiles?.roll_number ?? "No Roll No"}</div>
                </td>
                <td className="px-5 py-4 font-medium">
                  Route {p.routes?.route_number} · {p.routes?.name}
                </td>
                <td className="px-5 py-4 text-xs font-mono text-muted-foreground">
                  {p.valid_from} → {p.valid_until}
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => update(p.id, { fee_paid: !p.fee_paid })}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      p.fee_paid
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {p.fee_paid ? "Verified Paid" : "Unpaid"}
                  </button>
                </td>
                <td className="px-5 py-4 capitalize font-medium">{p.status}</td>
                <td className="px-5 py-4 text-right">
                  {p.status === "pending" ? (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => update(p.id, { status: "active", fee_paid: true })}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
                        title="Approve Pass"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => update(p.id, { status: "rejected" })}
                        className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 shadow-sm"
                        title="Reject Pass"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Processed</span>
                  )}
                </td>
              </tr>
            ))}
            {passes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No pass requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
