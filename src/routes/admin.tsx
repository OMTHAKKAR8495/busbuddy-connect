import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import AdminDashboard from "@/components/admin-dashboard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  head: () => ({ meta: [{ title: "Transport Admin — GSFCU Transit" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminRoute,
});

function AdminRoute() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [factorId, setFactorId] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [user, setUser] = useState<{ id: string; fullName: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let lastActivity = Date.now();
    const mark = () => { lastActivity = Date.now(); };
    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "touchstart"];
    events.forEach((event) => window.addEventListener(event, mark, { passive: true }));
    const timer = window.setInterval(() => {
      if (Date.now() - lastActivity >= 8 * 60 * 60 * 1000) void supabase.auth.signOut().then(() => setUser(null));
    }, 60_000);
    return () => { events.forEach((event) => window.removeEventListener(event, mark)); window.clearInterval(timer); };
  }, [user]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const { data: auth, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError || !auth.user?.email_confirmed_at) throw new Error("Sign in failed. Verify your email and credentials.");
      const { data: roles, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", auth.user.id);
      if (roleError || !roles?.some((row) => row.role === "admin")) {
        await supabase.auth.signOut();
        throw new Error("This account is not authorized for administration.");
      }
      const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError) throw new Error("Unable to verify multi-factor authentication.");
      if (assurance.currentLevel === "aal2") {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", auth.user.id).maybeSingle();
        setUser({ id: auth.user.id, fullName: profile?.full_name ?? "Administrator" });
        return;
      }
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw new Error("Unable to load MFA factors.");
      const factor = factors.totp.find((item) => item.status === "verified");
      if (factor) setFactorId(factor.id);
      else {
        const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "GSFCU Transit Admin" });
        if (enrollError || !enrolled) throw new Error("Unable to enroll an authenticator.");
        setFactorId(enrolled.id);
        setTotpUri(enrolled.totp.uri);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed.");
    } finally { setBusy(false); }
  }

  async function verifyMfa(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: otp.trim() });
      if (verifyError) throw new Error("MFA verification failed.");
      const { data: auth } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", auth.user?.id ?? "").maybeSingle();
      if (auth.user) setUser({ id: auth.user.id, fullName: profile?.full_name ?? "Administrator" });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "MFA verification failed."); }
    finally { setBusy(false); }
  }

  if (user) return <AdminDashboard user={{ userId: user.id, role: "admin", profile: { full_name: user.fullName } }} />;
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
    <h1 className="text-2xl font-bold">Administrator sign in</h1>
    <p className="my-3 text-sm text-muted-foreground">Use your invited university account and an authenticator app.</p>
    {totpUri && <section className="my-4 rounded border p-4"><p className="mb-3 text-sm">Scan this QR code in your authenticator app, then enter its six-digit code.</p><QRCodeSVG value={totpUri} /><p className="mt-3 break-all text-xs">{totpUri}</p></section>}
    {error && <p role="alert" className="my-3 text-sm text-destructive">{error}</p>}
    {!factorId ? <form className="space-y-4" onSubmit={submit}>
      <label className="block">Email<input className="mt-1 w-full rounded border p-3" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label className="block">Password<input className="mt-1 w-full rounded border p-3" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <button className="w-full rounded bg-primary p-3 text-primary-foreground" disabled={busy}>Continue</button>
    </form> : <form className="space-y-4" onSubmit={verifyMfa}>
      <label className="block">Authenticator code<input className="mt-1 w-full rounded border p-3" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value)} /></label>
      <button className="w-full rounded bg-primary p-3 text-primary-foreground" disabled={busy}>Verify and continue</button>
    </form>}
  </main>;
}
