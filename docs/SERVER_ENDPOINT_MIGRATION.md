# Legacy server endpoint replacement inventory

This inventory was recorded before removal of `server/`. Client code must use Supabase Auth, RLS-protected Postgres, or the listed server function. No replacement may trust browser-supplied identity or role data.

| Legacy endpoint/event | Replacement |
|---|---|
| `GET /api/health` | Deployment health check; no application API needed |
| `POST /api/auth/register` | Supabase Auth `signUp`; auth trigger creates profile and student role |
| `POST /api/auth/login` | Supabase Auth `signInWithPassword` |
| `GET /api/auth/me` | Supabase Auth `getUser()` |
| `GET /api/routes` | RLS-protected `routes` and `stops` reads |
| `GET /api/buses` | RLS-protected `buses` read |
| `POST /api/locations` | RLS-protected `bus_locations` insert by assigned driver |
| `GET /api/locations/latest` | RLS-protected latest-location view/query or Supabase Realtime |
| `POST /api/alerts` | RLS-protected `alerts` insert for admin or own-route driver |
| `GET /api/alerts` | RLS-protected `alerts` read |
| `POST /api/passes` | Admin server function; students create a `pass_applications` row via RLS |
| `GET /api/passes` | RLS-protected owner-scoped `bus_passes` read |
| `PATCH /api/passes/:id` | MFA-admin server function with audit entry |
| `GET /api/shifts` | RLS-protected `driver_shifts` read |
| `POST /api/shifts` | RLS-protected `driver_shifts` insert/update by assigned driver |
| `GET /api/driver-passes` | Removed. Drivers authenticate through invited Supabase accounts and read their own `driver_profiles` row |
| `POST /api/driver-passes` | Admin-only invite server function, audit entry, and email password setup |
| Socket.IO connection/disconnect events | Supabase Realtime on RLS-protected bus location rows or short polling |

The old endpoint inventory is complete. The replacement functions and full client migration are still in progress; deleting `server/` before those replacements ship would break deployment.
