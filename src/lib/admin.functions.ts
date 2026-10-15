import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enforceRateLimit } from "@/lib/rate-limit.server";

export const inviteStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({
    email: z.string().trim().email().max(254),
    fullName: z.string().trim().min(2).max(120),
    role: z.enum(["driver", "scanner", "admin"]),
  }))
  .handler(async ({ data, context }) => {
    enforceRateLimit(`invite:${context.userId}`, 5, 60_000);
    if (context.claims.aal !== "aal2") throw new Error("Not authorized");
    const { data: roles, error: roleError } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    if (roleError || !roles?.some((item) => item.role === "admin")) throw new Error("Not authorized");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      data: { full_name: data.fullName },
    });
    if (inviteError || !invited.user) throw new Error("Unable to invite this account");
    const { error: roleWriteError } = await supabaseAdmin.from("user_roles").delete().eq("user_id", invited.user.id).eq("role", "student");
    if (roleWriteError) throw new Error("Account invitation could not be completed");
    const { error: assignError } = await supabaseAdmin.from("user_roles").insert({ user_id: invited.user.id, role: data.role });
    if (assignError) throw new Error("Account invitation could not be completed");
    const { error: auditError } = await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "staff_invited",
      subject_id: invited.user.id,
      details: { role: data.role },
    });
    if (auditError) throw new Error("Account invitation could not be completed");
    return { invited: true };
  });

export const reviewPassApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ applicationId: z.string().uuid(), decision: z.enum(["approve", "reject"]) }))
  .handler(async ({ data, context }) => {
    if (context.claims.aal !== "aal2") throw new Error("Not authorized");
    const { data: roles, error: roleError } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    if (roleError || !roles?.some((item) => item.role === "admin")) throw new Error("Not authorized");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: application, error: lookupError } = await supabaseAdmin.from("pass_applications").select("id, student_id, route_id, pickup_stop_id, status").eq("id", data.applicationId).maybeSingle();
    if (lookupError || !application || application.status !== "pending") throw new Error("Application is unavailable");
    const status = data.decision === "approve" ? "approved" : "rejected";
    const { error: updateError } = await supabaseAdmin.from("pass_applications").update({ status }).eq("id", application.id);
    if (updateError) throw new Error("Application could not be reviewed");
    if (data.decision === "approve") {
      const { error: passError } = await supabaseAdmin.from("bus_passes").insert({
        student_id: application.student_id, route_id: application.route_id, pickup_stop_id: application.pickup_stop_id,
        status: "active", fee_paid: false,
      });
      if (passError) throw new Error("Approved application could not issue a pass");
    }
    const { error: auditError } = await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId, action: data.decision === "approve" ? "pass_issued" : "pass_application_rejected",
      subject_id: application.student_id, details: { application_id: application.id },
    });
    if (auditError) throw new Error("Application review could not be recorded");
    return { reviewed: true };
  });
