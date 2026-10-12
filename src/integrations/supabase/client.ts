import { neonSql } from "@/lib/neon";

// Helper for Supabase-like query interface backed 100% by Neon PostgreSQL
export const supabase = {
  auth: {
    getUser: async () => {
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("gsfcu_active_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            return {
              data: {
                user: {
                  id: parsed.userId,
                  email: parsed.profile?.email || parsed.profile?.full_name + "@gsfcu.ac.in",
                  user_metadata: {
                    full_name: parsed.profile?.full_name,
                    roll_number: parsed.profile?.roll_number,
                    role: parsed.role,
                  },
                },
              },
              error: null,
            };
          }
        } catch (e) {}
      }
      return { data: { user: null }, error: null };
    },

    getSession: async () => {
      const { data } = await supabase.auth.getUser();
      return {
        data: {
          session: data.user ? { access_token: "neon_session_token", user: data.user } : null,
        },
        error: null,
      };
    },

    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try {
        const rows = await neonSql`
          SELECT id, full_name, email, role, roll_number
          FROM public.app_accounts
          WHERE LOWER(email) = ${email.trim().toLowerCase()} AND password = ${password}
          LIMIT 1;
        `;
        if (rows.length > 0) {
          const u = rows[0];
          const userObj = {
            userId: u.id,
            role: u.role,
            profile: { full_name: u.full_name, roll_number: u.roll_number, email: u.email },
          };
          if (typeof window !== "undefined") {
            localStorage.setItem("gsfcu_active_user", JSON.stringify(userObj));
            localStorage.setItem("gsfcu_demo_role", u.role);
          }
          return { data: { user: userObj }, error: null };
        }
        return { data: { user: null }, error: new Error("Invalid credentials") };
      } catch (err: any) {
        return { data: { user: null }, error: err };
      }
    },

    signUp: async ({ email, password, options }: any) => {
      try {
        const meta = options?.data || {};
        const rows = await neonSql`
          INSERT INTO public.app_accounts (full_name, email, password, roll_number, role)
          VALUES (${meta.full_name || "Student"}, ${email.trim().toLowerCase()}, ${password}, ${meta.roll_number || null}, ${meta.role || 'student'})
          RETURNING id, full_name, email, role, roll_number;
        `;
        const u = rows[0];
        const userObj = {
          userId: u.id,
          role: u.role,
          profile: { full_name: u.full_name, roll_number: u.roll_number, email: u.email },
        };
        if (typeof window !== "undefined") {
          localStorage.setItem("gsfcu_active_user", JSON.stringify(userObj));
          localStorage.setItem("gsfcu_demo_role", u.role);
        }
        return { data: { user: userObj }, error: null };
      } catch (err: any) {
        return { data: { user: null }, error: err };
      }
    },

    signInWithOAuth: async () => {
      return { data: null, error: new Error("OAuth configured via Neon Auth Provider") };
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // In Neon PostgreSQL architecture, broadcast state changes or listen to storage
      const listener = (e: StorageEvent) => {
        if (e.key === "gsfcu_active_user") {
          callback(e.newValue ? "SIGNED_IN" : "SIGNED_OUT", null);
        }
      };
      if (typeof window !== "undefined") {
        window.addEventListener("storage", listener);
      }
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              if (typeof window !== "undefined") {
                window.removeEventListener("storage", listener);
              }
            },
          },
        },
      };
    },

    signOut: async () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("gsfcu_active_user");
        localStorage.removeItem("gsfcu_demo_role");
        localStorage.removeItem("gsfcu_auth_token");
        window.dispatchEvent(new Event("gsfcu_auth_change"));
      }
      return { error: null };
    },
  },

  // Table Query Bridge mapping to Neon SQL
  from: (table: string) => {
    let selectedFields = "*";
    let filters: Record<string, any> = {};
    let orderClause = "";
    let isSingle = false;

    const builder: any = {
      select: (fields: string = "*") => {
        selectedFields = fields;
        return builder;
      },
      eq: (col: string, val: any) => {
        filters[col] = val;
        return builder;
      },
      order: (col: string, opts?: { ascending?: boolean }) => {
        orderClause = `ORDER BY ${col} ${opts?.ascending ? "ASC" : "DESC"}`;
        return builder;
      },
      limit: (count: number) => {
        builder._limit = count;
        return builder;
      },
      range: (from: number, to: number) => {
        builder._limit = to - from + 1;
        return builder;
      },
      gte: (col: string, val: any) => {
        filters[`${col}__gte`] = val;
        return builder;
      },
      lte: (col: string, val: any) => {
        filters[`${col}__lte`] = val;
        return builder;
      },
      in: (col: string, vals: any[]) => {
        filters[`${col}__in`] = vals;
        return builder;
      },
      maybeSingle: async () => {
        isSingle = true;
        return builder.then((res: any) => ({ data: res.data?.[0] || null, error: res.error }));
      },
      single: async () => {
        isSingle = true;
        return builder.then((res: any) => ({ data: res.data?.[0] || null, error: res.error }));
      },
      insert: async (payload: any) => {
        try {
          const item = Array.isArray(payload) ? payload[0] : payload;
          if (table === "bus_passes") {
            const rows = await neonSql`
              INSERT INTO public.bus_passes (student_id, route_id, pickup_stop_id, valid_from, valid_until, fee_paid, status, secret)
              VALUES (${item.student_id}, ${item.route_id}, ${item.pickup_stop_id || null}, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', false, 'active', gen_random_uuid())
              RETURNING *;
            `;
            return { data: rows[0], error: null };
          }
          if (table === "trips") {
            const rows = await neonSql`
              INSERT INTO public.trips (bus_id, route_id, driver_id, started_at, active)
              VALUES (${item.bus_id}, ${item.route_id}, ${item.driver_id}, NOW(), true)
              RETURNING *;
            `;
            return { data: rows[0], error: null };
          }
          if (table === "bus_locations") {
            await neonSql`
              INSERT INTO public.bus_locations (bus_id, trip_id, lat, lng, speed, heading, recorded_at)
              VALUES (${item.bus_id}, ${item.trip_id || null}, ${item.lat}, ${item.lng}, ${item.speed || 0}, ${item.heading || 0}, NOW());
            `;
            return { data: item, error: null };
          }
          if (table === "alerts") {
            const rows = await neonSql`
              INSERT INTO public.alerts (route_id, driver_id, alert_type, message, created_at)
              VALUES (${item.route_id || null}, ${item.driver_id || null}, ${item.alert_type}, ${item.message}, NOW())
              RETURNING *;
            `;
            return { data: rows[0], error: null };
          }
          if (table === "routes") {
            const rows = await neonSql`
              INSERT INTO public.routes (route_number, name, description, polyline, active)
              VALUES (${item.route_number}, ${item.name}, ${item.description || ''}, '[]'::jsonb, true)
              RETURNING *;
            `;
            return { data: rows[0], error: null };
          }
          return { data: item, error: null };
        } catch (err: any) {
          return { data: null, error: err };
        }
      },
      upsert: async (payload: any) => {
        return builder.insert(payload);
      },
      update: (payload: any) => {
        return {
          eq: async (col: string, val: any) => {
            try {
              if (table === "trips" && val) {
                await neonSql`UPDATE public.trips SET active = false, ended_at = NOW() WHERE id = ${val};`;
              }
              if (table === "buses" && col === "id") {
                await neonSql`UPDATE public.buses SET driver_id = ${payload.driver_id || null} WHERE id = ${val};`;
              }
              return { data: payload, error: null };
            } catch (err: any) {
              return { data: null, error: err };
            }
          },
        };
      },
      then: async (resolve: any) => {
        try {
          if (table === "routes") {
            const rows = await neonSql`
              SELECT r.id, r.route_number, r.name, r.polyline, r.active
              FROM public.routes r
              WHERE r.active = true
              ORDER BY r.route_number ASC;
            `;
            let stops: any[] = [];
            try {
              stops = await neonSql`
                SELECT id, route_id, name, lat, lng, stop_order, scheduled_time
                FROM public.stops
                ORDER BY route_id, stop_order ASC;
              `;
            } catch (err) {
              console.warn("Could not fetch stops:", err);
            }
            const stopsMap = stops.reduce((acc: any, s: any) => {
              acc[s.route_id] = acc[s.route_id] || [];
              acc[s.route_id].push(s);
              return acc;
            }, {});
            const enriched = rows.map((r: any) => ({ ...r, stops: stopsMap[r.id] || [] }));
            return resolve({ data: enriched, error: null });
          }

          if (table === "buses") {
            const rows = await neonSql`
              SELECT b.id, b.bus_number, b.plate, b.route_id, b.driver_id, b.active
              FROM public.buses b
              WHERE b.active = true
              ORDER BY b.bus_number ASC;
            `;
            const routes = await neonSql`SELECT id, route_number, name, polyline FROM public.routes;`;
            const routeMap = routes.reduce((acc: any, r: any) => {
              acc[r.id] = r;
              return acc;
            }, {});
            const enriched = rows.map((b: any) => ({
              ...b,
              routes: routeMap[b.route_id] || null,
            }));
            return resolve({ data: enriched, error: null });
          }

          if (table === "latest_bus_locations") {
            const rows = await neonSql`
              SELECT DISTINCT ON (bus_id)
                bus_id, lat, lng, speed, heading, recorded_at
              FROM public.bus_locations
              ORDER BY bus_id, recorded_at DESC;
            `;
            return resolve({ data: rows, error: null });
          }

          if (table === "trips") {
            let rows;
            if (filters.driver_id) {
              rows = await neonSql`
                SELECT * FROM public.trips WHERE driver_id = ${filters.driver_id} AND active = true LIMIT 1;
              `;
            } else {
              rows = await neonSql`SELECT * FROM public.trips WHERE active = true;`;
            }
            return resolve({ data: rows, error: null });
          }

          if (table === "bus_passes") {
            const rawRows = await neonSql`SELECT * FROM public.bus_passes ORDER BY created_at DESC;`;
            const rows = rawRows.map((r: any) => ({
              ...r,
              valid_from: r.valid_from instanceof Date ? r.valid_from.toISOString().split("T")[0] : String(r.valid_from || ""),
              valid_until: r.valid_until instanceof Date ? r.valid_until.toISOString().split("T")[0] : String(r.valid_until || ""),
              created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at || ""),
            }));
            return resolve({ data: rows, error: null });
          }

          if (table === "alerts") {
            const rawRows = await neonSql`
              SELECT a.id, a.route_id, a.driver_id, a.alert_type, a.message, a.created_at,
                     r.route_number, r.name as route_name
              FROM public.alerts a
              LEFT JOIN public.routes r ON a.route_id = r.id
              ORDER BY a.created_at DESC
              LIMIT 50;
            `;
            const rows = rawRows.map((a: any) => ({
              ...a,
              created_at: a.created_at instanceof Date ? a.created_at.toISOString() : String(a.created_at || ""),
              routes: a.route_number ? { route_number: a.route_number, name: a.route_name } : null,
            }));
            return resolve({ data: rows, error: null });
          }

          if (table === "user_roles") {
            let rows = [];
            if (filters.user_id) {
              rows = await neonSql`SELECT role FROM public.user_roles WHERE user_id = ${filters.user_id};`;
            } else if (filters.role) {
              rows = await neonSql`SELECT user_id, role FROM public.user_roles WHERE role = ${filters.role}::public.app_role;`;
            }
            return resolve({ data: rows, error: null });
          }

          if (table === "profiles") {
            if (filters.id) {
              const rows = await neonSql`SELECT * FROM public.profiles WHERE id = ${filters.id} LIMIT 1;`;
              return resolve({ data: rows[0] || null, error: null });
            }
            const rows = await neonSql`SELECT * FROM public.profiles;`;
            return resolve({ data: rows, error: null });
          }

          return resolve({ data: [], error: null });
        } catch (err: any) {
          return resolve({ data: null, error: err });
        }
      },
    };

    return builder;
  },

  // Mock removeChannel for compatibility
  removeChannel: (_ch: any) => {},

  // Mock realtime channel
  channel: (_name: string) => ({
    on: () => ({
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
  }),
};

export default supabase;
