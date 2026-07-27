import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "student" | "driver" | "admin";

export function useMyRole() {
  return useQuery({
    queryKey: ["my-role"],
    queryFn: async (): Promise<{ userId: string; role: AppRole; profile: { full_name: string; roll_number: string | null; photo_url: string | null } } | null> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", u.user.id),
        supabase.from("profiles").select("full_name, roll_number, photo_url").eq("id", u.user.id).maybeSingle(),
      ]);
      const priority: AppRole[] = ["admin", "driver", "student"];
      const found = priority.find((r) => roles?.some((x) => x.role === r)) ?? "student";
      return {
        userId: u.user.id,
        role: found,
        profile: profile ?? { full_name: u.user.email ?? "", roll_number: null, photo_url: null },
      };
    },
  });
}
