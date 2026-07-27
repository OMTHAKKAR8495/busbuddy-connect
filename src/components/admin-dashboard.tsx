import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "./app-shell";
import LiveMap from "./live-map";
import { toast } from "sonner";
import { Check, X, Users, Route as RouteIcon, Bus as BusIcon, Activity } from "lucide-react";

type User = { userId: string; role: "admin"; profile: { full_name: string } };

export default function AdminDashboard({ user }: { user: User }) {
  const [tab, setTab] = useState<"fleet" | "passes" | "routes">("fleet");
  return (
    <AppShell title="Transport Admin" role={`Admin · ${user.profile.full_name}`}>
      <div className="mb-4 flex gap-2 rounded-lg bg-muted p-1">
        {([
          { k: "fleet", l: "Fleet map", i: Activity },
          { k: "passes", l: "Passes", i: Users },
          { k: "routes", l: "Routes & buses", i: RouteIcon },
        ] as const).map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${tab === t.k ? "bg-card text-foreground shadow" : "text-muted-foreground"}`}>
            <t.i className="h-4 w-4" /> {t.l}
          </button>
        ))}
      </div>
      {tab === "fleet" && <FleetTab />}
      {tab === "passes" && <PassesTab />}
      {tab === "routes" && <RoutesTab />}
    </AppShell>
  );
}

function FleetTab() {
  const { data: buses = [] } = useQuery({ queryKey: ["all-buses"], queryFn: async () => (await supabase.from("buses").select("id, bus_number, route_id, routes(route_number, polyline)")).data ?? [] });
  const { data: activeTrips = [] } = useQuery({ queryKey: ["active-trips"], queryFn: async () => (await supabase.from("trips").select("id, bus_id").eq("active", true)).data ?? [] });
  const [locs, setLocs] = useState<Record<string, { lat: number; lng: number; speed?: number | null; heading?: number | null }>>({});

  useEffect(() => {
    supabase.from("latest_bus_locations").select("*").then(({ data }) => {
      if (!data) return;
      const map: typeof locs = {};
      data.forEach((r) => { map[r.bus_id as string] = { lat: r.lat as number, lng: r.lng as number, speed: r.speed, heading: r.heading }; });
      setLocs(map);
    });
    const ch = supabase.channel("admin-locs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bus_locations" }, (payload) => {
        const r = payload.new as { bus_id: string; lat: number; lng: number; speed?: number; heading?: number };
        setLocs((p) => ({ ...p, [r.bus_id]: { lat: r.lat, lng: r.lng, speed: r.speed, heading: r.heading } }));
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const activeBusIds = new Set(activeTrips.map((t) => t.bus_id));
  const points = buses
    .filter((b) => activeBusIds.has(b.id) && locs[b.id])
    .map((b) => ({ bus_id: b.id, label: b.bus_number, ...locs[b.id] }));

  const routes = Array.from(new Map(buses.filter((b) => b.routes?.polyline).map((b) => [b.route_id, b.routes])).values());

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total buses" value={buses.length} />
        <Stat label="Active trips" value={activeTrips.length} />
        <Stat label="Streaming" value={points.length} />
        <Stat label="Idle" value={buses.length - activeTrips.length} />
      </div>
      <LiveMap
        buses={points}
        routes={routes.map((r) => ({ polyline: (r?.polyline as [number, number][]) ?? [], color: "#1e40af" }))}
        height={520}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}

function PassesTab() {
  const qc = useQueryClient();
  const { data: passes = [] } = useQuery({
    queryKey: ["admin-passes"],
    queryFn: async () => {
      const { data: rows } = await supabase.from("bus_passes").select("*, routes(route_number,name)").order("created_at", { ascending: false });
      if (!rows?.length) return [] as ((typeof rows extends (infer R)[] ? R : never) & { profiles: { full_name: string; roll_number: string | null } | null })[];
      const ids = Array.from(new Set(rows.map((r) => r.student_id)));
      const { data: profs } = await supabase.from("profiles").select("id, full_name, roll_number").in("id", ids);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      return rows.map((r) => ({ ...r, profiles: map.get(r.student_id) ?? null }));
    },
  });

  async function update(id: string, patch: { status?: "active" | "pending" | "expired" | "rejected"; fee_paid?: boolean }) {
    const { error } = await supabase.from("bus_passes").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["admin-passes"] });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted text-xs uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Student</th>
            <th className="px-4 py-3 text-left">Route</th>
            <th className="px-4 py-3 text-left">Validity</th>
            <th className="px-4 py-3 text-left">Fee</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {passes.map((p) => (
            <tr key={p.id} className="border-t border-border">
              <td className="px-4 py-3">
                <div className="font-medium">{p.profiles?.full_name}</div>
                <div className="text-xs text-muted-foreground">{p.profiles?.roll_number ?? "—"}</div>
              </td>
              <td className="px-4 py-3">{p.routes?.route_number} · {p.routes?.name}</td>
              <td className="px-4 py-3 text-xs">{p.valid_from} → {p.valid_until}</td>
              <td className="px-4 py-3">
                <button onClick={() => update(p.id, { fee_paid: !p.fee_paid })} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${p.fee_paid ? "bg-success/15 text-success" : "bg-muted"}`}>
                  {p.fee_paid ? "Paid" : "Unpaid"}
                </button>
              </td>
              <td className="px-4 py-3 capitalize">{p.status}</td>
              <td className="px-4 py-3 text-right">
                {p.status === "pending" && (
                  <div className="flex justify-end gap-1">
                    <button onClick={() => update(p.id, { status: "active", fee_paid: true })} className="rounded-md bg-success/15 p-1.5 text-success hover:bg-success hover:text-success-foreground" title="Approve"><Check className="h-4 w-4" /></button>
                    <button onClick={() => update(p.id, { status: "rejected" })} className="rounded-md bg-destructive/15 p-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground" title="Reject"><X className="h-4 w-4" /></button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {passes.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No pass requests yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function RoutesTab() {
  const qc = useQueryClient();
  const { data: routes = [] } = useQuery({ queryKey: ["admin-routes"], queryFn: async () => (await supabase.from("routes").select("*, stops(*), buses(id,bus_number,driver_id)").order("route_number")).data ?? [] });
  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, profiles!user_roles_user_id_fkey1(full_name)").eq("role", "driver");
      // fallback query via direct join if the above fails
      if (!data) {
        const { data: d2 } = await supabase.from("user_roles").select("user_id").eq("role", "driver");
        return d2 ?? [];
      }
      return data;
    },
  });

  async function assignDriver(busId: string, driverId: string) {
    const { error } = await supabase.from("buses").update({ driver_id: driverId || null }).eq("id", busId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-routes"] });
    toast.success("Bus updated");
  }

  return (
    <div className="space-y-4">
      {routes.map((r) => (
        <div key={r.id} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{r.route_number}</div>
              <h3 className="font-display text-xl font-semibold">{r.name}</h3>
              <p className="text-xs text-muted-foreground">{r.description}</p>
            </div>
            <div className="text-xs text-muted-foreground">Departure {r.departure_time}</div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">Stops</div>
              <ol className="space-y-1 text-sm">
                {(r.stops ?? []).slice().sort((a: {stop_order: number}, b: {stop_order: number}) => a.stop_order - b.stop_order).map((s: {id: string; name: string; scheduled_time: string | null}) => (
                  <li key={s.id} className="flex justify-between rounded-md bg-secondary px-3 py-1.5">
                    <span>{s.name}</span>
                    <span className="text-xs text-muted-foreground">{s.scheduled_time}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">Buses & drivers</div>
              <ul className="space-y-2">
                {(r.buses ?? []).map((b: {id: string; bus_number: string; driver_id: string | null}) => (
                  <li key={b.id} className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm">
                    <BusIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{b.bus_number}</span>
                    <select value={b.driver_id ?? ""} onChange={(e) => assignDriver(b.id, e.target.value)} className="ml-auto rounded-md border border-input bg-background px-2 py-1 text-xs">
                      <option value="">Unassigned</option>
                      {drivers.map((d) => (
                        <option key={d.user_id} value={d.user_id}>
                          {(d as { profiles?: { full_name?: string } | null }).profiles?.full_name ?? d.user_id.slice(0, 8)}
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
  );
}
