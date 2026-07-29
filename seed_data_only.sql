-- GSFCU coordinates approx: 22.3236, 73.1631
INSERT INTO public.routes (id, route_number, name, description, departure_time, polyline) VALUES
  ('11111111-1111-1111-1111-111111111111', 'R1', 'Soma Talav → GSFCU', 'Morning route from Soma Talav area', '07:30',
    '[[22.2879,73.1927],[22.2955,73.1830],[22.3060,73.1750],[22.3236,73.1631]]'::jsonb),
  ('22222222-2222-2222-2222-222222222222', 'R2', 'Sama Savli → GSFCU', 'Via Sama Savli Road', '07:45',
    '[[22.3418,73.2010],[22.3350,73.1900],[22.3300,73.1780],[22.3236,73.1631]]'::jsonb),
  ('33333333-3333-3333-3333-333333333333', 'R3', 'Alkapuri → GSFCU', 'City centre pickup', '07:15',
    '[[22.3072,73.1812],[22.3120,73.1740],[22.3180,73.1680],[22.3236,73.1631]]'::jsonb),
  ('44444444-4444-4444-4444-444444444444', 'R4', 'Chhanakpuri → GSFCU', 'Western suburbs', '07:20',
    '[[22.3000,73.1450],[22.3080,73.1520],[22.3160,73.1580],[22.3236,73.1631]]'::jsonb);

INSERT INTO public.stops (route_id, name, lat, lng, stop_order, scheduled_time) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Soma Talav', 22.2879, 73.1927, 1, '07:30'),
  ('11111111-1111-1111-1111-111111111111', 'Manjalpur', 22.2955, 73.1830, 2, '07:38'),
  ('11111111-1111-1111-1111-111111111111', 'Vasna Road', 22.3060, 73.1750, 3, '07:48'),
  ('11111111-1111-1111-1111-111111111111', 'GSFCU Campus', 22.3236, 73.1631, 4, '08:00'),

  ('22222222-2222-2222-2222-222222222222', 'Sama Cross Roads', 22.3418, 73.2010, 1, '07:45'),
  ('22222222-2222-2222-2222-222222222222', 'Sama Savli Road', 22.3350, 73.1900, 2, '07:55'),
  ('22222222-2222-2222-2222-222222222222', 'Nizampura', 22.3300, 73.1780, 3, '08:05'),
  ('22222222-2222-2222-2222-222222222222', 'GSFCU Campus', 22.3236, 73.1631, 4, '08:15'),

  ('33333333-3333-3333-3333-333333333333', 'Alkapuri', 22.3072, 73.1812, 1, '07:15'),
  ('33333333-3333-3333-3333-333333333333', 'Race Course', 22.3120, 73.1740, 2, '07:25'),
  ('33333333-3333-3333-3333-333333333333', 'Fatehgunj', 22.3180, 73.1680, 3, '07:35'),
  ('33333333-3333-3333-3333-333333333333', 'GSFCU Campus', 22.3236, 73.1631, 4, '07:45'),

  ('44444444-4444-4444-4444-444444444444', 'Chhanakpuri', 22.3000, 73.1450, 1, '07:20'),
  ('44444444-4444-4444-4444-444444444444', 'Gotri', 22.3080, 73.1520, 2, '07:30'),
  ('44444444-4444-4444-4444-444444444444', 'Vadsar', 22.3160, 73.1580, 3, '07:40'),
  ('44444444-4444-4444-4444-444444444444', 'GSFCU Campus', 22.3236, 73.1631, 4, '07:50');

-- Seed a few buses (no driver assigned yet — admin assigns after driver signs up)
INSERT INTO public.buses (bus_number, plate, capacity, route_id) VALUES
  ('BUS-01', 'GJ-06-1001', 40, '11111111-1111-1111-1111-111111111111'),
  ('BUS-02', 'GJ-06-1002', 40, '22222222-2222-2222-2222-222222222222'),
  ('BUS-03', 'GJ-06-1003', 40, '33333333-3333-3333-3333-333333333333'),
  ('BUS-04', 'GJ-06-1004', 40, '44444444-4444-4444-4444-444444444444');

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
-- =====================================================================
-- GSFC UNIVERSITY TRANSIT — 12 MONTHLY TABLES & EXACTLY 2 TEST ENTRIES PER MONTH
-- Execute this SQL script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- =====================================================================

