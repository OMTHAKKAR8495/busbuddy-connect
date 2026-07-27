
-- Recreate view with security_invoker
DROP VIEW IF EXISTS public.latest_bus_locations;
CREATE VIEW public.latest_bus_locations
WITH (security_invoker = true) AS
SELECT DISTINCT ON (bus_id) bus_id, trip_id, lat, lng, speed, heading, recorded_at
FROM public.bus_locations
ORDER BY bus_id, recorded_at DESC;
GRANT SELECT ON public.latest_bus_locations TO authenticated;

-- Lock down SECURITY DEFINER helpers
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- trigger runs as table owner, no execute grant needed for users
