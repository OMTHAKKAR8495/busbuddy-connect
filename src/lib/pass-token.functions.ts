import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enforceRateLimit } from "@/lib/rate-limit.server";
import { issueSignedPassToken, verifySignedPassToken } from "@/lib/qr-token.server";

const uuid = z.string().uuid();
const getIp = () => {
  const request = getRequest();
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidate = forwarded || request.headers.get("x-real-ip") || "unknown";
  return candidate.length <= 64 ? candidate : "unknown";
};

export const issuePassToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ passId: uuid }))
  .handler(async ({ data, context }) => {
    enforceRateLimit(`issue:${context.userId}:${getIp()}`, 10, 60_000);
    const { data: roles, error: roleError } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    if (roleError || !roles?.some((role) => role.role === "student")) throw new Error("Pass token unavailable");
    const { data: pass, error } = await context.supabase.from("bus_passes").select("id, student_id, status, fee_paid, valid_from, valid_until").eq("id", data.passId).eq("student_id", context.userId).maybeSingle();
    const now = new Date().toISOString().slice(0, 10);
    if (error || !pass || pass.status !== "active" || !pass.fee_paid || pass.valid_from > now || pass.valid_until < now) {
      throw new Error("Pass token unavailable");
    }
    return { token: issueSignedPassToken(pass.id, context.userId) };
  });

export const verifyPassToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ token: z.string().min(10).max(2048), busId: uuid }))
  .handler(async ({ data, context }) => {
    const ip = getIp();
    enforceRateLimit(`verify:scanner:${context.userId}`, 30, 60_000);
    enforceRateLimit(`verify:ip:${ip}`, 120, 60_000);
    const { data: roles, error: roleError } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const role = roles?.find((item) => ["scanner", "driver", "admin"].includes(item.role))?.role;
    if (roleError || !role) throw new Error("Not authorized to verify passes");
    if (role === "admin" && context.claims.aal !== "aal2") throw new Error("Not authorized to verify passes");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let claims: ReturnType<typeof verifySignedPassToken> | null = null;
    let result = false;
    let reason = "invalid_token";
    let studentId: string | null = null;
    let routeId: string | null = null;
    try {
      claims = verifySignedPassToken(data.token);
      studentId = claims.sid;
      const { error: replayError } = await supabaseAdmin.from("used_qr_tokens").insert({ jti: claims.jti, expires_at: new Date(claims.exp * 1000).toISOString() });
      if (replayError) reason = "reused_token";
      else {
        const { data: pass, error } = await supabaseAdmin.from("bus_passes").select("id, student_id, route_id, status, fee_paid, valid_from, valid_until").eq("id", claims.pid).eq("student_id", claims.sid).maybeSingle();
        const { data: bus } = await supabaseAdmin.from("buses").select("id, route_id, driver_id").eq("id", data.busId).maybeSingle();
        routeId = pass?.route_id ?? null;
        const today = new Date().toISOString().slice(0, 10);
        const assignedDriver = role !== "driver" || bus?.driver_id === context.userId;
        result = !error && Boolean(pass && bus && assignedDriver && pass.status === "active" && pass.fee_paid && pass.valid_from <= today && pass.valid_until >= today && pass.route_id === bus.route_id);
        reason = result ? "valid" : "pass_inactive_or_wrong_route";
      }
    } catch { reason = "invalid_or_expired_token"; }
    const { data: profile } = studentId ? await supabaseAdmin.from("profiles").select("full_name, roll_number").eq("id", studentId).maybeSingle() : { data: null };
    const { data: route } = routeId ? await supabaseAdmin.from("routes").select("route_number, name").eq("id", routeId).maybeSingle() : { data: null };
    const { error: scanError } = await supabaseAdmin.from("pass_scans").insert({
      pass_id: claims?.pid ?? null, scanner_id: context.userId, bus_id: data.busId, route_id: routeId,
      result, reason, ip: ip === "unknown" ? null : ip,
    });
    const { error: auditError } = await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId, action: "pass_scan", subject_id: claims?.pid ?? null,
      details: { result, reason, route_id: routeId },
    });
    if (scanError || auditError) throw new Error("Verification could not be recorded");
    const name = profile?.full_name?.trim().split(/\s+/)[0] ?? "Student";
    const roll = profile?.roll_number ?? "";
    return { valid: result, reason, firstName: result ? name : null, maskedRollNumber: result && roll ? `${roll.slice(0, 2)}••••${roll.slice(-2)}` : null, route: result ? route?.route_number ?? route?.name ?? "" : null };
  });
