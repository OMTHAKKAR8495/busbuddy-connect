import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bus, MapPin, QrCode, Radio, Shield, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GSFCU Transit — Live Bus Tracking" },
      { name: "description", content: "Real-time GSFCU shuttle tracking, smart ETA, and dynamic digital bus pass." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bus className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-semibold">GSFCU Transit</span>
        </div>
        <div className="flex items-center gap-3">
          {signedIn ? (
            <Link to="/app" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              Open app
            </Link>
          ) : (
            <>
              <Link to="/auth" className="text-sm font-medium text-foreground hover:text-primary">Sign in</Link>
              <button onClick={() => navigate({ to: "/auth", search: { mode: "signup" } as never })} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                Get started
              </button>
            </>
          )}
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent-foreground">
              <Radio className="h-3 w-3" /> Live · Vadodara
            </div>
            <h1 className="mt-4 text-5xl font-bold leading-tight tracking-tight lg:text-6xl">
              Never miss your <span className="text-primary">campus bus</span> again.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Real-time GPS tracking, smart ETA to your stop, and an anti-fraud digital pass — for every GSFCU student, driver, and transport admin.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90">
                Sign in
              </Link>
              <button onClick={() => navigate({ to: "/auth", search: { mode: "signup" } as never })} className="rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:border-primary">
                Create account
              </button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Users className="h-4 w-4" /> 3 roles</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> 4 routes seeded</div>
              <div className="flex items-center gap-2"><Shield className="h-4 w-4" /> Rotating QR</div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-primary/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Route R2</div>
                  <div className="font-display text-2xl font-semibold">Sama Savli → GSFCU</div>
                </div>
                <div className="rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">On time</div>
              </div>
              <div className="mt-6 space-y-3">
                {[
                  { s: "Sama Cross Roads", t: "07:45", done: true },
                  { s: "Sama Savli Road", t: "07:55", active: true, eta: "in 7 min" },
                  { s: "Nizampura", t: "08:05" },
                  { s: "GSFCU Campus", t: "08:15" },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${r.done ? "bg-muted-foreground/40" : r.active ? "bg-accent ring-4 ring-accent/20" : "bg-border"}`} />
                    <div className="flex-1 border-l border-dashed border-border pl-3">
                      <div className={`text-sm font-medium ${r.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{r.s}</div>
                      <div className="text-xs text-muted-foreground">{r.t} {r.eta && <span className="text-accent-foreground">· {r.eta}</span>}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24 grid gap-6 md:grid-cols-3">
          {[
            { icon: MapPin, title: "Live tracking map", desc: "Watch every GSFCU bus move in real time on OpenStreetMap." },
            { icon: QrCode, title: "Dynamic digital pass", desc: "Rotating token in the QR prevents students from sharing screenshots." },
            { icon: Radio, title: "Instant alerts", desc: "Drivers push breakdown & delay alerts to everyone on the route." },
          ].map((f, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        GSFCU Transit · Built on Lovable Cloud
      </footer>
    </div>
  );
}
