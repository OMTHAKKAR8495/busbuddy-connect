import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bus, User, ShieldCheck, ArrowRight, Lock, Mail, BadgeCheck, AlertCircle, Sparkles, Key } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — GSFCU Transit Console" },
      { name: "description", content: "Access your GSFCU student pass, driver dashboard, or fleet admin HQ." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<"student" | "driver" | "admin">("student");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [unconfirmedEmailError, setUnconfirmedEmailError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/app" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setUnconfirmedEmailError(null);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, roll_number: rollNumber || null, role },
          },
        });
        if (error) throw error;
        toast.success("Account created! Verification email sent if required.");
        navigate({ to: "/app" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            setUnconfirmedEmailError(email);
            toast.error("Email verification is pending for this account.");
          } else {
            throw error;
          }
        } else {
          toast.success("Welcome back to GSFCU Transit");
          navigate({ to: "/app" });
        }
      }
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Instant demo access button handler for evaluation
  function handleDemoAccess(demoRole: "student" | "driver" | "admin") {
    toast.success(`Entering ${demoRole.toUpperCase()} Evaluation Console`);
    navigate({ to: "/app" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="mb-8 flex items-center gap-3 group">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition group-hover:scale-105">
          <Bus className="h-6 w-6" />
        </div>
        <div>
          <span className="font-display text-xl font-bold tracking-tight">GSFCU Transit</span>
          <p className="text-xs text-muted-foreground">Smart Campus Mobility Console</p>
        </div>
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-8 shadow-2xl glow-card">
        {/* Toggle Mode Header */}
        <div className="mb-6 flex rounded-xl bg-muted p-1 border border-border/50">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setUnconfirmedEmailError(null);
              }}
              className={`flex-1 rounded-lg px-4 py-2 text-xs font-bold transition ${
                mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Email Not Confirmed Alert Banner */}
        {unconfirmedEmailError && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Email Confirmation Pending</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Supabase sent a confirmation link to <span className="font-mono font-bold text-foreground">{unconfirmedEmailError}</span>.
            </p>
            <div className="pt-1">
              <button
                onClick={() => handleDemoAccess("student")}
                className="w-full rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground shadow-md transition hover:opacity-90 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" /> Enter Console via Demo Access Now
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Select Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "student", label: "Student", icon: User },
                    { id: "driver", label: "Driver", icon: Bus },
                    { id: "admin", label: "Admin", icon: ShieldCheck },
                  ].map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setRole(r.id as never)}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-semibold transition ${
                        role === r.id
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border/80 text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <r.icon className="h-4 w-4" />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <Input label="Full Name" value={fullName} onChange={setFullName} required placeholder="e.g. Om Thakkar" />
              {role === "student" && (
                <Input label="Roll Number" value={rollNumber} onChange={setRollNumber} placeholder="e.g. 24BT04171" />
              )}
            </>
          )}

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={setEmail}
            required
            placeholder="24bt04171@gsfcuniversity.ac.in"
          />
          <Input label="Password" type="password" value={password} onChange={setPassword} required placeholder="••••••••" />

          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              "Authenticating..."
            ) : mode === "signin" ? (
              <>Sign In to Console <ArrowRight className="h-4 w-4" /></>
            ) : (
              <>Register Account <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </form>

        {/* 1-Click Presentation Access Section */}
        <div className="mt-6 border-t border-border/60 pt-5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Key className="h-3.5 w-3.5 text-primary" /> Faculty Evaluation Demo Mode
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoAccess("student")}
              className="flex flex-col items-center gap-1 rounded-xl border border-border bg-muted/30 p-2.5 text-xs font-semibold hover:bg-primary/10 hover:border-primary transition"
            >
              <span>🎓 Student</span>
              <span className="text-[10px] text-muted-foreground font-mono">Demo</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoAccess("driver")}
              className="flex flex-col items-center gap-1 rounded-xl border border-border bg-muted/30 p-2.5 text-xs font-semibold hover:bg-primary/10 hover:border-primary transition"
            >
              <span>🚌 Driver</span>
              <span className="text-[10px] text-muted-foreground font-mono">Demo</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoAccess("admin")}
              className="flex flex-col items-center gap-1 rounded-xl border border-border bg-muted/30 p-2.5 text-xs font-semibold hover:bg-primary/10 hover:border-primary transition"
            >
              <span>🛡️ Admin</span>
              <span className="text-[10px] text-muted-foreground font-mono">Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
