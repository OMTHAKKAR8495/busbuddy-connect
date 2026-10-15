import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "student" | "driver" | "scanner" | "admin";

export function useMyRole() {
  return useQuery({
    queryKey: ["my-role"],
    staleTime: 5_000,
    queryFn: async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) return null;
      const [{ data: roles, error: roleError }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", auth.user.id),
        supabase.from("profiles").select("full_name, roll_number, photo_url").eq("id", auth.user.id).maybeSingle(),
      ]);
      if (roleError) throw new Error("Unable to load account permissions");
      const role = roles?.[0]?.role as AppRole | undefined;
      if (!role) return null;
      return {
        userId: auth.user.id,
        role,
        profile: profile ?? { full_name: auth.user.email ?? "", roll_number: null, photo_url: null },
      };
    },
  });
}
