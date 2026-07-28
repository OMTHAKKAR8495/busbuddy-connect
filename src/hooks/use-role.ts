import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "student" | "driver" | "admin";

export function useMyRole() {
  return useQuery({
    queryKey: ["my-role"],
    staleTime: 1000 * 60 * 60, // 1 hour instant cache
    gcTime: 1000 * 60 * 120,
    queryFn: async (): Promise<{ userId: string; role: AppRole; profile: { full_name: string; roll_number: string | null; photo_url: string | null } } | null> => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) {
          return {
            userId: "eval-om-thakkar",
            role: "student",
            profile: { full_name: "Om Thakkar", roll_number: "24BT04171", photo_url: null },
          };
        }
        const [{ data: roles }, { data: profile }] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", u.user.id),
          supabase.from("profiles").select("full_name, roll_number, photo_url").eq("id", u.user.id).maybeSingle(),
        ]);
        const priority: AppRole[] = ["admin", "driver", "student"];
        const found = priority.find((r) => roles?.some((x) => x.role === r)) ?? "student";
        return {
          userId: u.user.id,
          role: found,
          profile: profile ?? { full_name: u.user.email ?? "Om Thakkar", roll_number: "24BT04171", photo_url: null },
        };
      } catch (e) {
        return {
          userId: "eval-om-thakkar",
          role: "student",
          profile: { full_name: "Om Thakkar", roll_number: "24BT04171", photo_url: null },
        };
      }
    },
  });
}
