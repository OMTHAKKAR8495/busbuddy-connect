import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { signOutAndClearAppStorage, supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — GSFCU Transit" }] }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(10).max(128),
  fullName: z.string().trim().min(2).max(120).optional(),
  rollNumber: z.string().trim().max(32).optional(),
});

function AuthPage() {
  const navigate = useNavigate();
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = credentials.safeParse({ email, password, fullName: signup ? fullName : undefined, rollNumber: signup ? rollNumber : undefined });
    if (!parsed.success) {
      toast.error("Check your email and password. Passwords must be at least 10 characters.");
      return;
    }
    setBusy(true);
    try {
      if (signup) {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { data: { full_name: parsed.data.fullName, roll_number: parsed.data.rollNumber } },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your university email to verify your account, then sign in.");
        } else {
          toast.success("Account created. Verify your email to continue.");
          await signOutAndClearAppStorage();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
        if (error || !data.user) throw new Error("Sign in failed. Check your credentials and email verification.");
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user?.email_confirmed_at) {
          await signOutAndClearAppStorage();
          throw new Error("Verify your email before signing in.");
        }
        await navigate({ to: "/app" });
      }
    } catch {
      toast.error(signup ? "Unable to create account. Check your details and allowed university email domain." : "Sign in failed. Check your credentials and email verification.");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    const parsed = z.string().email().safeParse(email.trim());
    if (!parsed.success) return toast.error("Enter your email address first.");
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${window.location.origin}/auth` });
    if (error) toast.error("Unable to send the reset email.");
    else toast.success("If the account exists, a password reset email is on its way.");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-bold">GSFCU Transit</h1>
      <p className="mb-8 mt-2 text-muted-foreground">{signup ? "Create your student account" : "Sign in to your account"}</p>
      <form className="space-y-4" onSubmit={submit}>
        {signup && <>
          <label className="block">Full name<input className="mt-1 w-full rounded border p-3" autoComplete="name" maxLength={120} value={fullName} onChange={(event) => setFullName(event.target.value)} required /></label>
          <label className="block">Roll number<input className="mt-1 w-full rounded border p-3" maxLength={32} value={rollNumber} onChange={(event) => setRollNumber(event.target.value)} required /></label>
        </>}
        <label className="block">University email<input className="mt-1 w-full rounded border p-3" type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label className="block">Password<input className="mt-1 w-full rounded border p-3" type="password" autoComplete={signup ? "new-password" : "current-password"} minLength={10} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        <button className="w-full rounded bg-primary p-3 text-primary-foreground" type="submit" disabled={busy}>{busy ? "Please wait…" : signup ? "Create account" : "Sign in"}</button>
      </form>
      {!signup && <button className="mt-4 text-sm underline" type="button" onClick={resetPassword}>Forgot password?</button>}
      <button className="mt-6 text-sm underline" type="button" onClick={() => setSignup((value) => !value)}>{signup ? "Already registered? Sign in" : "New student? Create an account"}</button>
    </main>
  );
}
