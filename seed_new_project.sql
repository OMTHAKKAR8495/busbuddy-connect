
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('student', 'driver', 'admin');
CREATE TYPE public.pass_status AS ENUM ('pending', 'active', 'expired', 'rejected');
CREATE TYPE public.alert_type AS ENUM ('breakdown', 'traffic_delay', 'route_change', 'other');

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  roll_number TEXT,
  phone TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Allow admins to manage roles/see all roles
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ AUTO PROFILE + DEFAULT ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, roll_number, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'roll_number',
    NEW.raw_user_meta_data->>'phone'
  );
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'student');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ ROUTES ============
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  polyline JSONB NOT NULL DEFAULT '[]'::jsonb,
  departure_time TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.routes TO authenticated;
GRANT ALL ON public.routes TO service_role;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "routes_select_auth" ON public.routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "routes_admin_all" ON public.routes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ STOPS ============
CREATE TABLE IF NOT EXISTS public.stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  stop_order INT NOT NULL,
  scheduled_time TEXT
);
CREATE INDEX ON public.stops(route_id);
GRANT SELECT ON public.stops TO authenticated;
GRANT ALL ON public.stops TO service_role;
ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stops_select_auth" ON public.stops FOR SELECT TO authenticated USING (true);
CREATE POLICY "stops_admin_all" ON public.stops FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ BUSES ============
CREATE TABLE IF NOT EXISTS public.buses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_number TEXT NOT NULL UNIQUE,
  plate TEXT,
  capacity INT NOT NULL DEFAULT 40,
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.buses TO authenticated;
GRANT ALL ON public.buses TO service_role;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "buses_select_auth" ON public.buses FOR SELECT TO authenticated USING (true);
CREATE POLICY "buses_admin_all" ON public.buses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ TRIPS ============
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX ON public.trips(active);
CREATE INDEX ON public.trips(driver_id);
GRANT SELECT, INSERT, UPDATE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trips_select_auth" ON public.trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "trips_driver_own" ON public.trips FOR INSERT TO authenticated
  WITH CHECK (driver_id = auth.uid() AND public.has_role(auth.uid(), 'driver'));
CREATE POLICY "trips_driver_update_own" ON public.trips FOR UPDATE TO authenticated
  USING (driver_id = auth.uid()) WITH CHECK (driver_id = auth.uid());
CREATE POLICY "trips_admin_all" ON public.trips FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ BUS LOCATIONS ============
CREATE TABLE IF NOT EXISTS public.bus_locations (
  id BIGSERIAL PRIMARY KEY,
  bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.bus_locations(bus_id, recorded_at DESC);
GRANT SELECT, INSERT ON public.bus_locations TO authenticated;
GRANT ALL ON public.bus_locations TO service_role;
ALTER TABLE public.bus_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bus_locations_select_auth" ON public.bus_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "bus_locations_driver_insert" ON public.bus_locations FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.driver_id = auth.uid() AND t.active = true)
  );

-- Latest location per bus (view)
CREATE OR REPLACE VIEW public.latest_bus_locations AS
SELECT DISTINCT ON (bus_id) bus_id, trip_id, lat, lng, speed, heading, recorded_at
FROM public.bus_locations
ORDER BY bus_id, recorded_at DESC;
GRANT SELECT ON public.latest_bus_locations TO authenticated;

-- ============ BUS PASSES ============
CREATE TABLE IF NOT EXISTS public.bus_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE RESTRICT,
  pickup_stop_id UUID REFERENCES public.stops(id) ON DELETE SET NULL,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '6 months'),
  fee_paid BOOLEAN NOT NULL DEFAULT false,
  status public.pass_status NOT NULL DEFAULT 'pending',
  secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.bus_passes(student_id);
GRANT SELECT, INSERT, UPDATE ON public.bus_passes TO authenticated;
GRANT ALL ON public.bus_passes TO service_role;
ALTER TABLE public.bus_passes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "passes_select_own" ON public.bus_passes FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "passes_insert_own" ON public.bus_passes FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "passes_admin_all" ON public.bus_passes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ ALERTS ============
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type public.alert_type NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.alerts(route_id, created_at DESC);
GRANT SELECT, INSERT ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts_select_auth" ON public.alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "alerts_driver_insert" ON public.alerts FOR INSERT TO authenticated
  WITH CHECK (driver_id = auth.uid() AND public.has_role(auth.uid(), 'driver'));

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.bus_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

-- ============ SEED ROUTES + STOPS (GSFCU-style Vadodara) ============
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

-- 1. Create All 12 Monthly Attendance Tables in Line
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_july_2026 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, route_number TEXT, pickup_stop TEXT, fee_status TEXT, status TEXT, scanned_at TIMESTAMPTZ, scan_date DATE, scan_time TEXT, scan_day TEXT, month_name TEXT);
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_august_2026 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, route_number TEXT, pickup_stop TEXT, fee_status TEXT, status TEXT, scanned_at TIMESTAMPTZ, scan_date DATE, scan_time TEXT, scan_day TEXT, month_name TEXT);
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_september_2026 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, route_number TEXT, pickup_stop TEXT, fee_status TEXT, status TEXT, scanned_at TIMESTAMPTZ, scan_date DATE, scan_time TEXT, scan_day TEXT, month_name TEXT);
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_october_2026 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, route_number TEXT, pickup_stop TEXT, fee_status TEXT, status TEXT, scanned_at TIMESTAMPTZ, scan_date DATE, scan_time TEXT, scan_day TEXT, month_name TEXT);
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_november_2026 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, route_number TEXT, pickup_stop TEXT, fee_status TEXT, status TEXT, scanned_at TIMESTAMPTZ, scan_date DATE, scan_time TEXT, scan_day TEXT, month_name TEXT);
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_december_2026 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, route_number TEXT, pickup_stop TEXT, fee_status TEXT, status TEXT, scanned_at TIMESTAMPTZ, scan_date DATE, scan_time TEXT, scan_day TEXT, month_name TEXT);
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_january_2027 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, route_number TEXT, pickup_stop TEXT, fee_status TEXT, status TEXT, scanned_at TIMESTAMPTZ, scan_date DATE, scan_time TEXT, scan_day TEXT, month_name TEXT);
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_february_2027 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, route_number TEXT, pickup_stop TEXT, fee_status TEXT, status TEXT, scanned_at TIMESTAMPTZ, scan_date DATE, scan_time TEXT, scan_day TEXT, month_name TEXT);
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_march_2027 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, route_number TEXT, pickup_stop TEXT, fee_status TEXT, status TEXT, scanned_at TIMESTAMPTZ, scan_date DATE, scan_time TEXT, scan_day TEXT, month_name TEXT);
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_april_2027 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, route_number TEXT, pickup_stop TEXT, fee_status TEXT, status TEXT, scanned_at TIMESTAMPTZ, scan_date DATE, scan_time TEXT, scan_day TEXT, month_name TEXT);
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_may_2027 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, route_number TEXT, pickup_stop TEXT, fee_status TEXT, status TEXT, scanned_at TIMESTAMPTZ, scan_date DATE, scan_time TEXT, scan_day TEXT, month_name TEXT);
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_june_2027 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, route_number TEXT, pickup_stop TEXT, fee_status TEXT, status TEXT, scanned_at TIMESTAMPTZ, scan_date DATE, scan_time TEXT, scan_day TEXT, month_name TEXT);

-- Disable RLS for testing simplicity
ALTER TABLE public.pass_scan_logs_july_2026 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_scan_logs_august_2026 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_scan_logs_september_2026 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_scan_logs_october_2026 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_scan_logs_november_2026 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_scan_logs_december_2026 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_scan_logs_january_2027 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_scan_logs_february_2027 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_scan_logs_march_2027 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_scan_logs_april_2027 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_scan_logs_may_2027 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_scan_logs_june_2027 DISABLE ROW LEVEL SECURITY;

-- 2. Insert Exactly 2 Test Entries Per Month

-- July 2026 (2 Test Entries)
INSERT INTO public.pass_scan_logs_july_2026 (student_name, roll_number, department, route_number, pickup_stop, fee_status, status, scanned_at, scan_date, scan_time, scan_day, month_name) VALUES
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2026-07-27 08:12:00+05:30', '2026-07-27', '08:12 AM', 'Monday', 'July 2026'),
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2026-07-28 08:14:00+05:30', '2026-07-28', '08:14 AM', 'Tuesday', 'July 2026');

-- August 2026 (2 Test Entries)
INSERT INTO public.pass_scan_logs_august_2026 (student_name, roll_number, department, route_number, pickup_stop, fee_status, status, scanned_at, scan_date, scan_time, scan_day, month_name) VALUES
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2026-08-03 08:10:00+05:30', '2026-08-03', '08:10 AM', 'Monday', 'August 2026'),
('Alex Sharma', '22CS089', 'Chemical Engineering', 'Route 2', 'Sama Savli Circle', 'Verified Paid', 'Boarded (Valid Pass)', '2026-08-04 07:55:00+05:30', '2026-08-04', '07:55 AM', 'Tuesday', 'August 2026');

-- September 2026 (2 Test Entries)
INSERT INTO public.pass_scan_logs_september_2026 (student_name, roll_number, department, route_number, pickup_stop, fee_status, status, scanned_at, scan_date, scan_time, scan_day, month_name) VALUES
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2026-09-01 08:15:00+05:30', '2026-09-01', '08:15 AM', 'Tuesday', 'September 2026'),
('Priya Patel', '23EC102', 'Electrical Engineering', 'Route 3', 'Waghodia Road', 'Verified Paid', 'Boarded (Valid Pass)', '2026-09-02 08:02:00+05:30', '2026-09-02', '08:02 AM', 'Wednesday', 'September 2026');

-- October 2026 (2 Test Entries)
INSERT INTO public.pass_scan_logs_october_2026 (student_name, roll_number, department, route_number, pickup_stop, fee_status, status, scanned_at, scan_date, scan_time, scan_day, month_name) VALUES
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2026-10-05 08:11:00+05:30', '2026-10-05', '08:11 AM', 'Monday', 'October 2026'),
('Rohan Varma', '24ME055', 'Mechanical Engineering', 'Route 6', 'Subhanpura', 'Verified Paid', 'Boarded (Valid Pass)', '2026-10-06 08:20:00+05:30', '2026-10-06', '08:20 AM', 'Tuesday', 'October 2026');

-- November 2026 (2 Test Entries)
INSERT INTO public.pass_scan_logs_november_2026 (student_name, roll_number, department, route_number, pickup_stop, fee_status, status, scanned_at, scan_date, scan_time, scan_day, month_name) VALUES
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2026-11-02 08:13:00+05:30', '2026-11-02', '08:13 AM', 'Monday', 'November 2026'),
('Ananya Shah', '25CE012', 'Civil Engineering', 'Route 5', 'Gotri Road', 'Verified Paid', 'Boarded (Valid Pass)', '2026-11-03 08:05:00+05:30', '2026-11-03', '08:05 AM', 'Tuesday', 'November 2026');

-- December 2026 (2 Test Entries)
INSERT INTO public.pass_scan_logs_december_2026 (student_name, roll_number, department, route_number, pickup_stop, fee_status, status, scanned_at, scan_date, scan_time, scan_day, month_name) VALUES
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2026-12-01 08:14:00+05:30', '2026-12-01', '08:14 AM', 'Tuesday', 'December 2026'),
('Alex Sharma', '22CS089', 'Chemical Engineering', 'Route 2', 'Sama Savli Circle', 'Verified Paid', 'Boarded (Valid Pass)', '2026-12-02 07:56:00+05:30', '2026-12-02', '07:56 AM', 'Wednesday', 'December 2026');

-- January 2027 (2 Test Entries)
INSERT INTO public.pass_scan_logs_january_2027 (student_name, roll_number, department, route_number, pickup_stop, fee_status, status, scanned_at, scan_date, scan_time, scan_day, month_name) VALUES
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2027-01-04 08:12:00+05:30', '2027-01-04', '08:12 AM', 'Monday', 'January 2027'),
('Priya Patel', '23EC102', 'Electrical Engineering', 'Route 3', 'Waghodia Road', 'Verified Paid', 'Boarded (Valid Pass)', '2027-01-05 08:03:00+05:30', '2027-01-05', '08:03 AM', 'Tuesday', 'January 2027');

-- February 2027 (2 Test Entries)
INSERT INTO public.pass_scan_logs_february_2027 (student_name, roll_number, department, route_number, pickup_stop, fee_status, status, scanned_at, scan_date, scan_time, scan_day, month_name) VALUES
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2027-02-01 08:10:00+05:30', '2027-02-01', '08:10 AM', 'Monday', 'February 2027'),
('Rohan Varma', '24ME055', 'Mechanical Engineering', 'Route 6', 'Subhanpura', 'Verified Paid', 'Boarded (Valid Pass)', '2027-02-02 08:21:00+05:30', '2027-02-02', '08:21 AM', 'Tuesday', 'February 2027');

-- March 2027 (2 Test Entries)
INSERT INTO public.pass_scan_logs_march_2027 (student_name, roll_number, department, route_number, pickup_stop, fee_status, status, scanned_at, scan_date, scan_time, scan_day, month_name) VALUES
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2027-03-01 08:15:00+05:30', '2027-03-01', '08:15 AM', 'Monday', 'March 2027'),
('Ananya Shah', '25CE012', 'Civil Engineering', 'Route 5', 'Gotri Road', 'Verified Paid', 'Boarded (Valid Pass)', '2027-03-02 08:04:00+05:30', '2027-03-02', '08:04 AM', 'Tuesday', 'March 2027');

-- April 2027 (2 Test Entries)
INSERT INTO public.pass_scan_logs_april_2027 (student_name, roll_number, department, route_number, pickup_stop, fee_status, status, scanned_at, scan_date, scan_time, scan_day, month_name) VALUES
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2027-04-05 08:11:00+05:30', '2027-04-05', '08:11 AM', 'Monday', 'April 2027'),
('Alex Sharma', '22CS089', 'Chemical Engineering', 'Route 2', 'Sama Savli Circle', 'Verified Paid', 'Boarded (Valid Pass)', '2027-04-06 07:57:00+05:30', '2027-04-06', '07:57 AM', 'Tuesday', 'April 2027');

-- May 2027 (2 Test Entries)
INSERT INTO public.pass_scan_logs_may_2027 (student_name, roll_number, department, route_number, pickup_stop, fee_status, status, scanned_at, scan_date, scan_time, scan_day, month_name) VALUES
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2027-05-03 08:13:00+05:30', '2027-05-03', '08:13 AM', 'Monday', 'May 2027'),
('Priya Patel', '23EC102', 'Electrical Engineering', 'Route 3', 'Waghodia Road', 'Verified Paid', 'Boarded (Valid Pass)', '2027-05-04 08:01:00+05:30', '2027-05-04', '08:01 AM', 'Tuesday', 'May 2027');

-- June 2027 (2 Test Entries)
INSERT INTO public.pass_scan_logs_june_2027 (student_name, roll_number, department, route_number, pickup_stop, fee_status, status, scanned_at, scan_date, scan_time, scan_day, month_name) VALUES
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2027-06-01 08:14:00+05:30', '2027-06-01', '08:14 AM', 'Tuesday', 'June 2027'),
('Rohan Varma', '24ME055', 'Mechanical Engineering', 'Route 6', 'Subhanpura', 'Verified Paid', 'Boarded (Valid Pass)', '2027-06-02 08:22:00+05:30', '2027-06-02', '08:22 AM', 'Wednesday', 'June 2027');

-- 3. Master Unified View for Parent CSV Reports
CREATE OR REPLACE VIEW public.view_all_monthly_scan_logs AS
SELECT * FROM public.pass_scan_logs_july_2026
UNION ALL SELECT * FROM public.pass_scan_logs_august_2026
UNION ALL SELECT * FROM public.pass_scan_logs_september_2026
UNION ALL SELECT * FROM public.pass_scan_logs_october_2026
UNION ALL SELECT * FROM public.pass_scan_logs_november_2026
UNION ALL SELECT * FROM public.pass_scan_logs_december_2026
UNION ALL SELECT * FROM public.pass_scan_logs_january_2027
UNION ALL SELECT * FROM public.pass_scan_logs_february_2027
UNION ALL SELECT * FROM public.pass_scan_logs_march_2027
UNION ALL SELECT * FROM public.pass_scan_logs_april_2027
UNION ALL SELECT * FROM public.pass_scan_logs_may_2027
UNION ALL SELECT * FROM public.pass_scan_logs_june_2027;
-- =====================================================================
-- GSFC UNIVERSITY TRANSIT — ALL 13 ROUTE TABLES WITH 12-MONTH DATA
-- Execute this SQL script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- =====================================================================

-- 1. Create Route 1 Table (Soma Talav -> GSFC Campus) — 12 Months Data
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_route_1 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, pickup_stop TEXT, scan_date DATE, scan_day TEXT, scan_time TEXT, month_name TEXT, status TEXT DEFAULT 'Boarded (Valid Pass)');
ALTER TABLE public.pass_scan_logs_route_1 DISABLE ROW LEVEL SECURITY;

INSERT INTO public.pass_scan_logs_route_1 (student_name, roll_number, department, pickup_stop, scan_date, scan_day, scan_time, month_name) VALUES
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Soma Talav (BPC Pump)', '2026-07-28', 'Tuesday', '08:14 AM', 'July 2026'),
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Soma Talav (BPC Pump)', '2026-08-03', 'Monday', '08:11 AM', 'August 2026'),
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Soma Talav (BPC Pump)', '2026-09-01', 'Tuesday', '08:10 AM', 'September 2026'),
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Soma Talav (BPC Pump)', '2026-10-05', 'Monday', '08:12 AM', 'October 2026'),
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Soma Talav (BPC Pump)', '2026-11-02', 'Monday', '08:15 AM', 'November 2026'),
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Soma Talav (BPC Pump)', '2026-12-01', 'Tuesday', '08:13 AM', 'December 2026'),
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Soma Talav (BPC Pump)', '2027-01-04', 'Monday', '08:12 AM', 'January 2027'),
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Soma Talav (BPC Pump)', '2027-02-01', 'Monday', '08:10 AM', 'February 2027'),
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Soma Talav (BPC Pump)', '2027-03-01', 'Monday', '08:15 AM', 'March 2027'),
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Soma Talav (BPC Pump)', '2027-04-05', 'Monday', '08:11 AM', 'April 2027'),
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Soma Talav (BPC Pump)', '2027-05-03', 'Monday', '08:13 AM', 'May 2027'),
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Soma Talav (BPC Pump)', '2027-06-01', 'Tuesday', '08:14 AM', 'June 2027');

-- 2. Create Route 2 Table (Sama Savli -> GSFC Campus) — 12 Months Data
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_route_2 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, pickup_stop TEXT, scan_date DATE, scan_day TEXT, scan_time TEXT, month_name TEXT, status TEXT DEFAULT 'Boarded (Valid Pass)');
ALTER TABLE public.pass_scan_logs_route_2 DISABLE ROW LEVEL SECURITY;

INSERT INTO public.pass_scan_logs_route_2 (student_name, roll_number, department, pickup_stop, scan_date, scan_day, scan_time, month_name) VALUES
('Alex Sharma', '22CS089', 'Chemical Engineering', 'Sama Savli Circle', '2026-07-28', 'Tuesday', '07:55 AM', 'July 2026'),
('Alex Sharma', '22CS089', 'Chemical Engineering', 'Sama Savli Circle', '2026-08-04', 'Tuesday', '07:58 AM', 'August 2026'),
('Alex Sharma', '22CS089', 'Chemical Engineering', 'Sama Savli Circle', '2026-09-01', 'Tuesday', '07:54 AM', 'September 2026'),
('Alex Sharma', '22CS089', 'Chemical Engineering', 'Sama Savli Circle', '2026-10-06', 'Tuesday', '07:56 AM', 'October 2026'),
('Alex Sharma', '22CS089', 'Chemical Engineering', 'Sama Savli Circle', '2026-11-03', 'Tuesday', '07:55 AM', 'November 2026'),
('Alex Sharma', '22CS089', 'Chemical Engineering', 'Sama Savli Circle', '2026-12-02', 'Wednesday', '07:56 AM', 'December 2026'),
('Alex Sharma', '22CS089', 'Chemical Engineering', 'Sama Savli Circle', '2027-01-05', 'Tuesday', '07:55 AM', 'January 2027'),
('Alex Sharma', '22CS089', 'Chemical Engineering', 'Sama Savli Circle', '2027-02-02', 'Tuesday', '07:57 AM', 'February 2027'),
('Alex Sharma', '22CS089', 'Chemical Engineering', 'Sama Savli Circle', '2027-03-02', 'Tuesday', '07:54 AM', 'March 2027'),
('Alex Sharma', '22CS089', 'Chemical Engineering', 'Sama Savli Circle', '2027-04-06', 'Tuesday', '07:57 AM', 'April 2027'),
('Alex Sharma', '22CS089', 'Chemical Engineering', 'Sama Savli Circle', '2027-05-04', 'Tuesday', '07:56 AM', 'May 2027'),
('Alex Sharma', '22CS089', 'Chemical Engineering', 'Sama Savli Circle', '2027-06-02', 'Wednesday', '07:55 AM', 'June 2027');

-- 3. Create Route 3 Table (Waghodia Road -> GSFC Campus) — 12 Months Data
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_route_3 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, pickup_stop TEXT, scan_date DATE, scan_day TEXT, scan_time TEXT, month_name TEXT, status TEXT DEFAULT 'Boarded (Valid Pass)');
ALTER TABLE public.pass_scan_logs_route_3 DISABLE ROW LEVEL SECURITY;

INSERT INTO public.pass_scan_logs_route_3 (student_name, roll_number, department, pickup_stop, scan_date, scan_day, scan_time, month_name) VALUES
('Priya Patel', '23EC102', 'Electrical Engineering', 'Waghodia Road', '2026-07-28', 'Tuesday', '08:02 AM', 'July 2026'),
('Priya Patel', '23EC102', 'Electrical Engineering', 'Waghodia Road', '2026-08-04', 'Tuesday', '08:01 AM', 'August 2026'),
('Priya Patel', '23EC102', 'Electrical Engineering', 'Waghodia Road', '2026-09-02', 'Wednesday', '08:02 AM', 'September 2026'),
('Priya Patel', '23EC102', 'Electrical Engineering', 'Waghodia Road', '2026-10-06', 'Tuesday', '08:00 AM', 'October 2026'),
('Priya Patel', '23EC102', 'Electrical Engineering', 'Waghodia Road', '2026-11-03', 'Tuesday', '08:03 AM', 'November 2026'),
('Priya Patel', '23EC102', 'Electrical Engineering', 'Waghodia Road', '2026-12-01', 'Tuesday', '08:02 AM', 'December 2026'),
('Priya Patel', '23EC102', 'Electrical Engineering', 'Waghodia Road', '2027-01-05', 'Tuesday', '08:03 AM', 'January 2027'),
('Priya Patel', '23EC102', 'Electrical Engineering', 'Waghodia Road', '2027-02-02', 'Tuesday', '08:01 AM', 'February 2027'),
('Priya Patel', '23EC102', 'Electrical Engineering', 'Waghodia Road', '2027-03-02', 'Tuesday', '08:02 AM', 'March 2027'),
('Priya Patel', '23EC102', 'Electrical Engineering', 'Waghodia Road', '2027-04-06', 'Tuesday', '08:00 AM', 'April 2027'),
('Priya Patel', '23EC102', 'Electrical Engineering', 'Waghodia Road', '2027-05-04', 'Tuesday', '08:01 AM', 'May 2027'),
('Priya Patel', '23EC102', 'Electrical Engineering', 'Waghodia Road', '2027-06-01', 'Tuesday', '08:02 AM', 'June 2027');

-- 4. Create Tables for Routes 4 to 13
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_route_4 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, pickup_stop TEXT, scan_date DATE, scan_day TEXT, scan_time TEXT, month_name TEXT, status TEXT DEFAULT 'Boarded (Valid Pass)');
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_route_5 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, pickup_stop TEXT, scan_date DATE, scan_day TEXT, scan_time TEXT, month_name TEXT, status TEXT DEFAULT 'Boarded (Valid Pass)');
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_route_6 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, pickup_stop TEXT, scan_date DATE, scan_day TEXT, scan_time TEXT, month_name TEXT, status TEXT DEFAULT 'Boarded (Valid Pass)');
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_route_7 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, pickup_stop TEXT, scan_date DATE, scan_day TEXT, scan_time TEXT, month_name TEXT, status TEXT DEFAULT 'Boarded (Valid Pass)');
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_route_8 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, pickup_stop TEXT, scan_date DATE, scan_day TEXT, scan_time TEXT, month_name TEXT, status TEXT DEFAULT 'Boarded (Valid Pass)');
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_route_9 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, pickup_stop TEXT, scan_date DATE, scan_day TEXT, scan_time TEXT, month_name TEXT, status TEXT DEFAULT 'Boarded (Valid Pass)');
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_route_10 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, pickup_stop TEXT, scan_date DATE, scan_day TEXT, scan_time TEXT, month_name TEXT, status TEXT DEFAULT 'Boarded (Valid Pass)');
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_route_11 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, pickup_stop TEXT, scan_date DATE, scan_day TEXT, scan_time TEXT, month_name TEXT, status TEXT DEFAULT 'Boarded (Valid Pass)');
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_route_12 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, pickup_stop TEXT, scan_date DATE, scan_time TEXT, scan_day TEXT, month_name TEXT, status TEXT DEFAULT 'Boarded (Valid Pass)');
CREATE TABLE IF NOT EXISTS public.pass_scan_logs_route_13 (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_name TEXT, roll_number TEXT, department TEXT, pickup_stop TEXT, scan_date DATE, scan_day TEXT, scan_time TEXT, month_name TEXT, status TEXT DEFAULT 'Boarded (Valid Pass)');

ALTER TABLE public.pass_scan_logs_route_4 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_scan_logs_route_5 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_scan_logs_route_6 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_scan_logs_route_7 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_scan_logs_route_8 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_scan_logs_route_9 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_scan_logs_route_10 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_scan_logs_route_11 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_scan_logs_route_12 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_scan_logs_route_13 DISABLE ROW LEVEL SECURITY;

-- 5. Master Unified View for All Routes Across 12 Months
CREATE OR REPLACE VIEW public.view_all_routes_12_months_scan_logs AS
SELECT 'Route 1' as route_name, * FROM public.pass_scan_logs_route_1
UNION ALL SELECT 'Route 2' as route_name, * FROM public.pass_scan_logs_route_2
UNION ALL SELECT 'Route 3' as route_name, * FROM public.pass_scan_logs_route_3
UNION ALL SELECT 'Route 4' as route_name, * FROM public.pass_scan_logs_route_4
UNION ALL SELECT 'Route 5' as route_name, * FROM public.pass_scan_logs_route_5
UNION ALL SELECT 'Route 6' as route_name, * FROM public.pass_scan_logs_route_6
UNION ALL SELECT 'Route 7' as route_name, * FROM public.pass_scan_logs_route_7
UNION ALL SELECT 'Route 8' as route_name, * FROM public.pass_scan_logs_route_8
UNION ALL SELECT 'Route 9' as route_name, * FROM public.pass_scan_logs_route_9
UNION ALL SELECT 'Route 10' as route_name, * FROM public.pass_scan_logs_route_10
UNION ALL SELECT 'Route 11' as route_name, * FROM public.pass_scan_logs_route_11
UNION ALL SELECT 'Route 12' as route_name, * FROM public.pass_scan_logs_route_12
UNION ALL SELECT 'Route 13' as route_name, * FROM public.pass_scan_logs_route_13;
-- =====================================================================
-- GSFC UNIVERSITY TRANSIT — ALL MONTHLY ATTENDANCE TABLES (2026 - 2027)
-- Execute this SQL script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- =====================================================================

-- 1. Create Main Scan Table Structure Function
CREATE OR REPLACE FUNCTION create_monthly_scan_table(table_name TEXT) RETURNS VOID AS $$
BEGIN
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.%I (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_name TEXT NOT NULL,
            roll_number TEXT NOT NULL,
            department TEXT DEFAULT ''Computer Science & Engineering'',
            route_number TEXT NOT NULL,
            pickup_stop TEXT NOT NULL,
            fee_status TEXT DEFAULT ''Verified Paid'',
            status TEXT DEFAULT ''Boarded (Valid Pass)'',
            scanned_at TIMESTAMPTZ DEFAULT NOW(),
            scan_date DATE DEFAULT CURRENT_DATE,
            scan_time TEXT NOT NULL,
            scan_day TEXT NOT NULL,
            month_name TEXT NOT NULL
        );
        ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow public read" ON public.%I FOR SELECT USING (true);
        CREATE POLICY "Allow insert" ON public.%I FOR INSERT WITH CHECK (true);
    ', table_name, table_name, table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- 2. Create All 12 Monthly Attendance Tables
SELECT create_monthly_scan_table('pass_scan_logs_july_2026');
SELECT create_monthly_scan_table('pass_scan_logs_august_2026');
SELECT create_monthly_scan_table('pass_scan_logs_september_2026');
SELECT create_monthly_scan_table('pass_scan_logs_october_2026');
SELECT create_monthly_scan_table('pass_scan_logs_november_2026');
SELECT create_monthly_scan_table('pass_scan_logs_december_2026');
SELECT create_monthly_scan_table('pass_scan_logs_january_2027');
SELECT create_monthly_scan_table('pass_scan_logs_february_2027');
SELECT create_monthly_scan_table('pass_scan_logs_march_2027');
SELECT create_monthly_scan_table('pass_scan_logs_april_2027');
SELECT create_monthly_scan_table('pass_scan_logs_may_2027');
SELECT create_monthly_scan_table('pass_scan_logs_june_2027');

-- =====================================================================
-- 3. SEED REALISTIC STUDENT ATTENDANCE ENTRIES MONTH BY MONTH
-- =====================================================================

-- July 2026 Attendance Entries
INSERT INTO public.pass_scan_logs_july_2026 (
    student_name, roll_number, department, route_number, pickup_stop, fee_status, status, scanned_at, scan_date, scan_time, scan_day, month_name
) VALUES
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2026-07-28 08:14:22+05:30', '2026-07-28', '08:14 AM', 'Tuesday', 'July 2026'),
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2026-07-27 08:12:05+05:30', '2026-07-27', '08:12 AM', 'Monday', 'July 2026'),
('Alex Sharma', '22CS089', 'Chemical Engineering', 'Route 2', 'Sama Savli Circle', 'Verified Paid', 'Boarded (Valid Pass)', '2026-07-28 07:55:10+05:30', '2026-07-28', '07:55 AM', 'Tuesday', 'July 2026'),
('Priya Patel', '23EC102', 'Electrical Engineering', 'Route 3', 'Waghodia Road', 'Verified Paid', 'Boarded (Valid Pass)', '2026-07-28 08:02:18+05:30', '2026-07-28', '08:02 AM', 'Tuesday', 'July 2026'),
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2026-07-24 08:15:30+05:30', '2026-07-24', '08:15 AM', 'Friday', 'July 2026');

-- August 2026 Attendance Entries
INSERT INTO public.pass_scan_logs_august_2026 (
    student_name, roll_number, department, route_number, pickup_stop, fee_status, status, scanned_at, scan_date, scan_time, scan_day, month_name
) VALUES
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2026-08-03 08:11:00+05:30', '2026-08-03', '08:11 AM', 'Monday', 'August 2026'),
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2026-08-04 08:13:45+05:30', '2026-08-04', '08:13 AM', 'Tuesday', 'August 2026'),
('Alex Sharma', '22CS089', 'Chemical Engineering', 'Route 2', 'Sama Savli Circle', 'Verified Paid', 'Boarded (Valid Pass)', '2026-08-04 07:58:20+05:30', '2026-08-04', '07:58 AM', 'Tuesday', 'August 2026'),
('Rohan Varma', '24ME055', 'Mechanical Engineering', 'Route 6', 'Subhanpura', 'Verified Paid', 'Boarded (Valid Pass)', '2026-08-05 08:22:10+05:30', '2026-08-05', '08:22 AM', 'Wednesday', 'August 2026');

-- September 2026 Attendance Entries
INSERT INTO public.pass_scan_logs_september_2026 (
    student_name, roll_number, department, route_number, pickup_stop, fee_status, status, scanned_at, scan_date, scan_time, scan_day, month_name
) VALUES
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2026-09-01 08:10:00+05:30', '2026-09-01', '08:10 AM', 'Tuesday', 'September 2026'),
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2026-09-02 08:14:15+05:30', '2026-09-02', '08:14 AM', 'Wednesday', 'September 2026'),
('Ananya Shah', '25CE012', 'Civil Engineering', 'Route 5', 'Gotri Road', 'Verified Paid', 'Boarded (Valid Pass)', '2026-09-02 08:05:00+05:30', '2026-09-02', '08:05 AM', 'Wednesday', 'September 2026');

-- October 2026 Attendance Entries
INSERT INTO public.pass_scan_logs_october_2026 (
    student_name, roll_number, department, route_number, pickup_stop, fee_status, status, scanned_at, scan_date, scan_time, scan_day, month_name
) VALUES
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2026-10-05 08:12:30+05:30', '2026-10-05', '08:12 AM', 'Monday', 'October 2026'),
('Priya Patel', '23EC102', 'Electrical Engineering', 'Route 3', 'Waghodia Road', 'Verified Paid', 'Boarded (Valid Pass)', '2026-10-06 08:00:10+05:30', '2026-10-06', '08:00 AM', 'Tuesday', 'October 2026');

-- November 2026 Attendance Entries
INSERT INTO public.pass_scan_logs_november_2026 (
    student_name, roll_number, department, route_number, pickup_stop, fee_status, status, scanned_at, scan_date, scan_time, scan_day, month_name
) VALUES
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2026-11-02 08:15:00+05:30', '2026-11-02', '08:15 AM', 'Monday', 'November 2026'),
('Alex Sharma', '22CS089', 'Chemical Engineering', 'Route 2', 'Sama Savli Circle', 'Verified Paid', 'Boarded (Valid Pass)', '2026-11-03 07:54:20+05:30', '2026-11-03', '07:54 AM', 'Tuesday', 'November 2026');

-- December 2026 Attendance Entries
INSERT INTO public.pass_scan_logs_december_2026 (
    student_name, roll_number, department, route_number, pickup_stop, fee_status, status, scanned_at, scan_date, scan_time, scan_day, month_name
) VALUES
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2026-12-01 08:13:00+05:30', '2026-12-01', '08:13 AM', 'Tuesday', 'December 2026'),
('Ananya Shah', '25CE012', 'Civil Engineering', 'Route 5', 'Gotri Road', 'Verified Paid', 'Boarded (Valid Pass)', '2026-12-02 08:06:40+05:30', '2026-12-02', '08:06 AM', 'Wednesday', 'December 2026');

-- January 2027 Attendance Entries
INSERT INTO public.pass_scan_logs_january_2027 (
    student_name, roll_number, department, route_number, pickup_stop, fee_status, status, scanned_at, scan_date, scan_time, scan_day, month_name
) VALUES
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2027-01-04 08:11:15+05:30', '2027-01-04', '08:11 AM', 'Monday', 'January 2027'),
('Priya Patel', '23EC102', 'Electrical Engineering', 'Route 3', 'Waghodia Road', 'Verified Paid', 'Boarded (Valid Pass)', '2027-01-05 08:01:00+05:30', '2027-01-05', '08:01 AM', 'Tuesday', 'January 2027');

-- =====================================================================
-- 4. MASTER UNIFIED VIEW FOR PARENT CSV REPORTS & ALL MONTH QUERIES
-- =====================================================================

CREATE OR REPLACE VIEW public.view_all_monthly_scan_logs AS
SELECT * FROM public.pass_scan_logs_july_2026
UNION ALL
SELECT * FROM public.pass_scan_logs_august_2026
UNION ALL
SELECT * FROM public.pass_scan_logs_september_2026
UNION ALL
SELECT * FROM public.pass_scan_logs_october_2026
UNION ALL
SELECT * FROM public.pass_scan_logs_november_2026
UNION ALL
SELECT * FROM public.pass_scan_logs_december_2026
UNION ALL
SELECT * FROM public.pass_scan_logs_january_2027
UNION ALL
SELECT * FROM public.pass_scan_logs_february_2027
UNION ALL
SELECT * FROM public.pass_scan_logs_march_2027
UNION ALL
SELECT * FROM public.pass_scan_logs_april_2027
UNION ALL
SELECT * FROM public.pass_scan_logs_may_2027
UNION ALL
SELECT * FROM public.pass_scan_logs_june_2027;
-- =====================================================================
-- GSFC UNIVERSITY TRANSIT — ALL 13 BUS ROUTES & STOPS MASTER DATABASE
-- Execute this SQL script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- =====================================================================

-- 1. Create Bus Routes Master Table
CREATE TABLE IF NOT EXISTS public.bus_routes_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_number TEXT UNIQUE NOT NULL,
    route_name TEXT NOT NULL,
    start_point TEXT NOT NULL,
    destination_point TEXT DEFAULT 'GSFC University Main Campus',
    total_stops INT DEFAULT 5,
    distance_km NUMERIC(5,2) DEFAULT 18.5,
    morning_departure_time TEXT DEFAULT '07:30 AM',
    evening_return_time TEXT DEFAULT '05:15 PM',
    bus_assigned TEXT NOT NULL,
    driver_name TEXT NOT NULL,
    driver_phone TEXT DEFAULT '+91 98765 43210',
    status TEXT DEFAULT 'Active Operating'
);

-- Disable RLS for testing simplicity
ALTER TABLE public.bus_routes_master DISABLE ROW LEVEL SECURITY;

-- 2. Insert All 13 Official GSFC University Shuttle Routes (Vadodara Region)
INSERT INTO public.bus_routes_master (
    route_number, route_name, start_point, total_stops, distance_km, morning_departure_time, evening_return_time, bus_assigned, driver_name
) VALUES
('Route R1', 'Soma Talav → Tarsali → GSFC Campus', 'Soma Talav (BPC Pump)', 5, 21.5, '07:30 AM', '05:15 PM', 'Bus 01 (GJ-06-AX-1001)', 'Suresh Kumar'),
('Route R2', 'Sama Savli → Nizampura → GSFC Campus', 'Sama Savli Circle', 4, 14.2, '07:45 AM', '05:15 PM', 'Bus 04 (GJ-06-AX-1004)', 'Ramesh Patel'),
('Route R3', 'Waghodia Road → Ajwa Road → GSFC Campus', 'Waghodia Road Cross Roads', 6, 23.0, '07:25 AM', '05:15 PM', 'Bus 03 (GJ-06-AX-1003)', 'Mahesh Singh'),
('Route R4', 'Maneja → Makarpura GIDC → GSFC Campus', 'Maneja Railway Crossing', 5, 19.8, '07:30 AM', '05:15 PM', 'Bus 02 (GJ-06-AX-1002)', 'Vikram Parmar'),
('Route R5', 'Gotri Road → Sevasi → GSFC Campus', 'Gotri Water Tank', 5, 16.5, '07:40 AM', '05:15 PM', 'Bus 05 (GJ-06-AX-1005)', 'Ketan Solanki'),
('Route R6', 'Subhanpura → High Tanki → GSFC Campus', 'Subhanpura High Tanki', 4, 12.0, '07:50 AM', '05:15 PM', 'Bus 06 (GJ-06-AX-1006)', 'Dinesh Varma'),
('Route R7', 'Akota Stadium → OP Road → GSFC Campus', 'Akota Stadium Circle', 5, 17.2, '07:35 AM', '05:15 PM', 'Bus 07 (GJ-06-AX-1007)', 'Prakash Jha'),
('Route R8', 'Alkapuri → Station Circle → GSFC Campus', 'Alkapuri Railway Station', 4, 13.5, '07:45 AM', '05:15 PM', 'Bus 08 (GJ-06-AX-1008)', 'Bharat Thakor'),
('Route R9', 'Karelibaug → Muktanand → GSFC Campus', 'Karelibaug Water Tank', 5, 15.0, '07:40 AM', '05:15 PM', 'Bus 09 (GJ-06-AX-1009)', 'Jiten Chaudhari'),
('Route R10', 'Gorwa BIDC → ITI Circle → GSFC Campus', 'Gorwa BIDC Main Gate', 4, 11.5, '07:50 AM', '05:15 PM', 'Bus 10 (GJ-06-AX-1010)', 'Vijay Rabari'),
('Route R11', 'Tarsali Ring Road → ONGC → GSFC Campus', 'Tarsali Bypass Circle', 6, 24.0, '07:20 AM', '05:15 PM', 'Bus 11 (GJ-06-AX-1011)', 'Manish Rajput'),
('Route R12', 'VIP Road → Chhani Jakatnaka → GSFC Campus', 'VIP Road Circle', 5, 16.0, '07:40 AM', '05:15 PM', 'Bus 12 (GJ-06-AX-1012)', 'Ashok Gohil'),
('Route R13', 'Bajwa Station → Fertilizer Nagar → GSFC Campus', 'Bajwa Railway Station', 3, 08.5, '08:00 AM', '05:15 PM', 'Bus 13 (GJ-06-AX-1013)', 'Ganpat Vasava');

-- 3. Create Bus Stops Master Table
CREATE TABLE IF NOT EXISTS public.bus_stops_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_number TEXT REFERENCES public.bus_routes_master(route_number) ON DELETE CASCADE,
    stop_order INT NOT NULL,
    stop_name TEXT NOT NULL,
    scheduled_arrival TEXT NOT NULL,
    landmark TEXT
);

-- Disable RLS for testing simplicity
ALTER TABLE public.bus_stops_master DISABLE ROW LEVEL SECURITY;

-- Insert Key Sample Stops
INSERT INTO public.bus_stops_master (route_number, stop_order, stop_name, scheduled_arrival, landmark) VALUES
('Route R1', 1, 'Soma Talav (BPC Pump)', '07:30 AM', 'Near BPC Petrol Pump'),
('Route R1', 2, 'Tarsali Bypass', '07:40 AM', 'Near Highway Bridge'),
('Route R1', 3, 'Makarpura Bus Depot', '07:50 AM', 'Main Gate'),
('Route R1', 4, 'Chhani Circle', '08:05 AM', 'Near Flyover'),
('Route R1', 5, 'GSFC University Main Campus', '08:15 AM', 'Gate No 1'),

('Route R2', 1, 'Sama Savli Circle', '07:45 AM', 'Near Circle Fountain'),
('Route R2', 2, 'Nizampura Junction', '07:55 AM', 'Near ICICI Bank'),
('Route R2', 3, 'Chhani Jakatnaka', '08:05 AM', 'Jakatnaka Octroi'),
('Route R2', 4, 'GSFC University Main Campus', '08:15 AM', 'Gate No 1');
-- =====================================================================
-- GSFC UNIVERSITY TRANSIT — DRIVER SHIFT TIMINGS AUDIT LOGS (2026 - 2027)
-- Records exactly when drivers started shifts and stopped at GSFC Campus
-- Execute this SQL script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- =====================================================================

-- 1. Create Function for Monthly Driver Shift Log Tables
CREATE OR REPLACE FUNCTION create_driver_shift_table(table_name TEXT) RETURNS VOID AS $$
BEGIN
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.%I (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            driver_name TEXT NOT NULL,
            bus_number TEXT NOT NULL,
            bus_plate TEXT DEFAULT ''GJ-06-AX-1001'',
            route_number TEXT NOT NULL,
            route_name TEXT NOT NULL,
            start_location TEXT NOT NULL,
            destination TEXT DEFAULT ''GSFC University Main Campus'',
            shift_start_time TEXT NOT NULL,
            shift_stop_time TEXT NOT NULL,
            total_duration_minutes INT DEFAULT 45,
            distance_covered_km NUMERIC(5,2) DEFAULT 18.5,
            shift_date DATE DEFAULT CURRENT_DATE,
            shift_day TEXT NOT NULL,
            month_year TEXT NOT NULL,
            status TEXT DEFAULT ''Completed — Arrived at GSFC Campus''
        );
        ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;
    ', table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- 2. Create All 12 Monthly Driver Shift Tables
SELECT create_driver_shift_table('driver_shift_logs_july_2026');
SELECT create_driver_shift_table('driver_shift_logs_august_2026');
SELECT create_driver_shift_table('driver_shift_logs_september_2026');
SELECT create_driver_shift_table('driver_shift_logs_october_2026');
SELECT create_driver_shift_table('driver_shift_logs_november_2026');
SELECT create_driver_shift_table('driver_shift_logs_december_2026');
SELECT create_driver_shift_table('driver_shift_logs_january_2027');
SELECT create_driver_shift_table('driver_shift_logs_february_2027');
SELECT create_driver_shift_table('driver_shift_logs_march_2027');
SELECT create_driver_shift_table('driver_shift_logs_april_2027');
SELECT create_driver_shift_table('driver_shift_logs_may_2027');
SELECT create_driver_shift_table('driver_shift_logs_june_2027');

-- =====================================================================
-- 3. SEED REALISTIC DRIVER START & STOP SHIFT TIMINGS MONTH BY MONTH
-- =====================================================================

-- July 2026 Driver Shift Timings (Start & Stop at GSFC Campus)
INSERT INTO public.driver_shift_logs_july_2026 (
    driver_name, bus_number, bus_plate, route_number, route_name, start_location, shift_start_time, shift_stop_time, total_duration_minutes, distance_covered_km, shift_date, shift_day, month_year
) VALUES
('Suresh Kumar', 'BUS-01', 'GJ-06-AX-1001', 'Route R1', 'Soma Talav → GSFC Campus', 'Soma Talav (BPC Pump)', '07:30 AM', '08:15 AM', 45, 21.5, '2026-07-28', 'Tuesday', 'July 2026'),
('Ramesh Patel', 'BUS-04', 'GJ-06-AX-1004', 'Route R2', 'Sama Savli → GSFC Campus', 'Sama Savli Circle', '07:45 AM', '08:15 AM', 30, 14.2, '2026-07-28', 'Tuesday', 'July 2026'),
('Mahesh Singh', 'BUS-03', 'GJ-06-AX-1003', 'Route R3', 'Waghodia Road → GSFC Campus', 'Waghodia Road', '07:25 AM', '08:15 AM', 50, 23.0, '2026-07-28', 'Tuesday', 'July 2026'),
('Suresh Kumar', 'BUS-01', 'GJ-06-AX-1001', 'Route R1', 'Soma Talav → GSFC Campus', 'Soma Talav (BPC Pump)', '07:30 AM', '08:14 AM', 44, 21.5, '2026-07-27', 'Monday', 'July 2026');

-- August 2026 Driver Shift Timings
INSERT INTO public.driver_shift_logs_august_2026 (
    driver_name, bus_number, bus_plate, route_number, route_name, start_location, shift_start_time, shift_stop_time, total_duration_minutes, distance_covered_km, shift_date, shift_day, month_year
) VALUES
('Suresh Kumar', 'BUS-01', 'GJ-06-AX-1001', 'Route R1', 'Soma Talav → GSFC Campus', 'Soma Talav (BPC Pump)', '07:30 AM', '08:16 AM', 46, 21.5, '2026-08-03', 'Monday', 'August 2026'),
('Ramesh Patel', 'BUS-04', 'GJ-06-AX-1004', 'Route R2', 'Sama Savli → GSFC Campus', 'Sama Savli Circle', '07:45 AM', '08:13 AM', 28, 14.2, '2026-08-04', 'Tuesday', 'August 2026');

-- September 2026 Driver Shift Timings
INSERT INTO public.driver_shift_logs_september_2026 (
    driver_name, bus_number, bus_plate, route_number, route_name, start_location, shift_start_time, shift_stop_time, total_duration_minutes, distance_covered_km, shift_date, shift_day, month_year
) VALUES
('Mahesh Singh', 'BUS-03', 'GJ-06-AX-1003', 'Route R3', 'Waghodia Road → GSFC Campus', 'Waghodia Road', '07:25 AM', '08:15 AM', 50, 23.0, '2026-09-01', 'Tuesday', 'September 2026'),
('Vikram Parmar', 'BUS-02', 'GJ-06-AX-1002', 'Route R4', 'Maneja → GSFC Campus', 'Maneja Crossing', '07:30 AM', '08:15 AM', 45, 19.8, '2026-09-02', 'Wednesday', 'September 2026');

-- October 2026 Driver Shift Timings
INSERT INTO public.driver_shift_logs_october_2026 (
    driver_name, bus_number, bus_plate, route_number, route_name, start_location, shift_start_time, shift_stop_time, total_duration_minutes, distance_covered_km, shift_date, shift_day, month_year
) VALUES
('Ketan Solanki', 'BUS-05', 'GJ-06-AX-1005', 'Route R5', 'Gotri Road → GSFC Campus', 'Gotri Water Tank', '07:40 AM', '08:15 AM', 35, 16.5, '2026-10-05', 'Monday', 'October 2026'),
('Dinesh Varma', 'BUS-06', 'GJ-06-AX-1006', 'Route R6', 'Subhanpura → GSFC Campus', 'Subhanpura High Tanki', '07:50 AM', '08:15 AM', 25, 12.0, '2026-10-06', 'Tuesday', 'October 2026');

-- November 2026 Driver Shift Timings
INSERT INTO public.driver_shift_logs_november_2026 (
    driver_name, bus_number, bus_plate, route_number, route_name, start_location, shift_start_time, shift_stop_time, total_duration_minutes, distance_covered_km, shift_date, shift_day, month_year
) VALUES
('Prakash Jha', 'BUS-07', 'GJ-06-AX-1007', 'Route R7', 'Akota Stadium → GSFC Campus', 'Akota Stadium Circle', '07:35 AM', '08:15 AM', 40, 17.2, '2026-11-02', 'Monday', 'November 2026'),
('Bharat Thakor', 'BUS-08', 'GJ-06-AX-1008', 'Route R8', 'Alkapuri → GSFC Campus', 'Alkapuri Railway Station', '07:45 AM', '08:15 AM', 30, 13.5, '2026-11-03', 'Tuesday', 'November 2026');

-- December 2026 Driver Shift Timings
INSERT INTO public.driver_shift_logs_december_2026 (
    driver_name, bus_number, bus_plate, route_number, route_name, start_location, shift_start_time, shift_stop_time, total_duration_minutes, distance_covered_km, shift_date, shift_day, month_year
) VALUES
('Jiten Chaudhari', 'BUS-09', 'GJ-06-AX-1009', 'Route R9', 'Karelibaug → GSFC Campus', 'Karelibaug Water Tank', '07:40 AM', '08:15 AM', 35, 15.0, '2026-12-01', 'Tuesday', 'December 2026'),
('Vijay Rabari', 'BUS-10', 'GJ-06-AX-1010', 'Route R10', 'Gorwa BIDC → GSFC Campus', 'Gorwa BIDC Main Gate', '07:50 AM', '08:15 AM', 25, 11.5, '2026-12-02', 'Wednesday', 'December 2026');

-- January 2027 Driver Shift Timings
INSERT INTO public.driver_shift_logs_january_2027 (
    driver_name, bus_number, bus_plate, route_number, route_name, start_location, shift_start_time, shift_stop_time, total_duration_minutes, distance_covered_km, shift_date, shift_day, month_year
) VALUES
('Manish Rajput', 'BUS-11', 'GJ-06-AX-1011', 'Route R11', 'Tarsali Ring Road → GSFC Campus', 'Tarsali Bypass Circle', '07:20 AM', '08:15 AM', 55, 24.0, '2027-01-04', 'Monday', 'January 2027'),
('Ashok Gohil', 'BUS-12', 'GJ-06-AX-1012', 'Route R12', 'VIP Road → GSFC Campus', 'VIP Road Circle', '07:40 AM', '08:15 AM', 35, 16.0, '2027-01-05', 'Tuesday', 'January 2027');

-- =====================================================================
-- 4. MASTER UNIFIED VIEW FOR ALL MONTHS DRIVER SHIFT LOGS
-- =====================================================================

CREATE OR REPLACE VIEW public.view_all_driver_shift_logs AS
SELECT * FROM public.driver_shift_logs_july_2026
UNION ALL SELECT * FROM public.driver_shift_logs_august_2026
UNION ALL SELECT * FROM public.driver_shift_logs_september_2026
UNION ALL SELECT * FROM public.driver_shift_logs_october_2026
UNION ALL SELECT * FROM public.driver_shift_logs_november_2026
UNION ALL SELECT * FROM public.driver_shift_logs_december_2026
UNION ALL SELECT * FROM public.driver_shift_logs_january_2027
UNION ALL SELECT * FROM public.driver_shift_logs_february_2027
UNION ALL SELECT * FROM public.driver_shift_logs_march_2027
UNION ALL SELECT * FROM public.driver_shift_logs_april_2027
UNION ALL SELECT * FROM public.driver_shift_logs_may_2027
UNION ALL SELECT * FROM public.driver_shift_logs_june_2027;
-- =====================================================================
-- GSFC UNIVERSITY TRANSIT — STUDENT ATTENDANCE & GATE SCAN AUDIT LOGS
-- Execute this SQL script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- =====================================================================

-- 1. Create Student Attendance Gate Scan Logs Table
CREATE TABLE IF NOT EXISTS public.pass_scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    department TEXT DEFAULT 'Computer Science & Engineering',
    pass_id TEXT,
    route_number TEXT NOT NULL,
    pickup_stop TEXT NOT NULL,
    fee_status TEXT DEFAULT 'Verified Paid',
    status TEXT DEFAULT 'Boarded (Valid Pass)',
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    scan_date DATE DEFAULT CURRENT_DATE,
    scan_time TEXT NOT NULL,
    scan_day TEXT NOT NULL,
    month_year TEXT NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.pass_scan_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for Access Control
CREATE POLICY "Allow public read access for scan audit logs"
    ON public.pass_scan_logs
    FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated users & conductors to insert scan logs"
    ON public.pass_scan_logs
    FOR INSERT
    WITH CHECK (true);

-- 4. Create Performance Indexes for Date-to-Date & Roll Number CSV Reports
CREATE INDEX IF NOT EXISTS idx_scan_logs_date ON public.pass_scan_logs(scan_date);
CREATE INDEX IF NOT EXISTS idx_scan_logs_roll ON public.pass_scan_logs(roll_number);
CREATE INDEX IF NOT EXISTS idx_scan_logs_route ON public.pass_scan_logs(route_number);

-- =====================================================================
-- 5. SEED INITIAL DATE-WISE ATTENDANCE RECORDS FOR JULY 2026
-- =====================================================================

INSERT INTO public.pass_scan_logs (
    student_name, roll_number, department, route_number, pickup_stop, fee_status, status, scanned_at, scan_date, scan_time, scan_day, month_year
) VALUES
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2026-07-28 08:14:22+05:30', '2026-07-28', '08:14 AM', 'Tuesday', 'July 2026'),
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2026-07-27 08:12:05+05:30', '2026-07-27', '08:12 AM', 'Monday', 'July 2026'),
('Alex Sharma', '22CS089', 'Chemical Engineering', 'Route 2', 'Sama Savli Circle', 'Verified Paid', 'Boarded (Valid Pass)', '2026-07-28 07:55:10+05:30', '2026-07-28', '07:55 AM', 'Tuesday', 'July 2026'),
('Priya Patel', '23EC102', 'Electrical Engineering', 'Route 3', 'Waghodia Road', 'Verified Paid', 'Boarded (Valid Pass)', '2026-07-28 08:02:18+05:30', '2026-07-28', '08:02 AM', 'Tuesday', 'July 2026'),
('Om Thakkar', '24BT04171', 'Computer Science & Engineering', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Boarded (Valid Pass)', '2026-07-24 08:15:30+05:30', '2026-07-24', '08:15 AM', 'Friday', 'July 2026'),
('Rohan Varma', '24ME055', 'Mechanical Engineering', 'Route 6', 'Subhanpura', 'Verified Paid', 'Boarded (Valid Pass)', '2026-07-27 08:20:00+05:30', '2026-07-27', '08:20 AM', 'Monday', 'July 2026');
-- =====================================================================
-- GSFC UNIVERSITY TRANSIT — SEPARATE MASTER TABLES & AUDIT QUERIES
-- Execute each query block independently in your Supabase SQL Editor
-- =====================================================================

-- =====================================================================
-- QUERY 1: ALL REGISTERED STUDENTS MASTER TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.registered_students_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    roll_number TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    department TEXT DEFAULT 'Computer Science & Engineering',
    semester INT DEFAULT 3,
    registration_date DATE DEFAULT CURRENT_DATE,
    account_status TEXT DEFAULT 'Active Verified'
);

ALTER TABLE public.registered_students_master DISABLE ROW LEVEL SECURITY;

INSERT INTO public.registered_students_master (student_name, roll_number, email, phone, department, semester, account_status) VALUES
('Om Thakkar', '24BT04171', 'om.thakkar@gsfcuniversity.ac.in', '+91 98765 43210', 'Computer Science & Engineering', 3, 'Active Verified'),
('Alex Sharma', '22CS089', 'alex.sharma@gsfcuniversity.ac.in', '+91 98123 45678', 'Chemical Engineering', 5, 'Active Verified'),
('Priya Patel', '23EC102', 'priya.patel@gsfcuniversity.ac.in', '+91 98234 56789', 'Electrical Engineering', 4, 'Active Verified'),
('Rohan Varma', '24ME055', 'rohan.varma@gsfcuniversity.ac.in', '+91 98345 67890', 'Mechanical Engineering', 3, 'Active Verified'),
('Ananya Shah', '25CE012', 'ananya.shah@gsfcuniversity.ac.in', '+91 98456 78901', 'Civil Engineering', 1, 'Active Verified');


-- =====================================================================
-- QUERY 2: BUS PASS APPLICATIONS & ISSUED PASSES MASTER TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.bus_pass_applications_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pass_number TEXT UNIQUE NOT NULL,
    student_name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    route_number TEXT NOT NULL,
    pickup_stop TEXT NOT NULL,
    valid_from DATE DEFAULT '2026-07-01',
    valid_until DATE DEFAULT '2027-01-31',
    fee_amount_inr NUMERIC(10,2) DEFAULT 6500.00,
    fee_payment_status TEXT DEFAULT 'Verified Paid',
    approval_status TEXT DEFAULT 'Approved Active',
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bus_pass_applications_master DISABLE ROW LEVEL SECURITY;

INSERT INTO public.bus_pass_applications_master (pass_number, student_name, roll_number, route_number, pickup_stop, fee_payment_status, approval_status) VALUES
('GSFCU-PASS-2026-001', 'Om Thakkar', '24BT04171', 'Route 1', 'Soma Talav (BPC Pump)', 'Verified Paid', 'Approved Active'),
('GSFCU-PASS-2026-002', 'Alex Sharma', '22CS089', 'Route 2', 'Sama Savli Circle', 'Verified Paid', 'Approved Active'),
('GSFCU-PASS-2026-003', 'Priya Patel', '23EC102', 'Route 3', 'Waghodia Road', 'Verified Paid', 'Approved Active'),
('GSFCU-PASS-2026-004', 'Rohan Varma', '24ME055', 'Route 6', 'Subhanpura', 'Verified Paid', 'Approved Active'),
('GSFCU-PASS-2026-005', 'Ananya Shah', '25CE012', 'Route 5', 'Gotri Road', 'Pending Verification', 'Pending Approval');


-- =====================================================================
-- QUERY 3: USER AUTHENTICATION & LOGIN AUDIT TRAIL TABLE (GOOGLE & PASSWORD)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.user_login_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    user_role TEXT DEFAULT 'Student',
    auth_provider TEXT NOT NULL, -- 'Google OAuth' or 'Email / Password'
    login_status TEXT DEFAULT 'Successful Login',
    device_type TEXT DEFAULT 'Mobile Smartphone',
    ip_address TEXT DEFAULT '152.57.12.84',
    logged_in_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_login_audit_logs DISABLE ROW LEVEL SECURITY;

INSERT INTO public.user_login_audit_logs (user_email, user_role, auth_provider, login_status, device_type, ip_address, logged_in_at) VALUES
('om.thakkar@gsfcuniversity.ac.in', 'Student', 'Google OAuth', 'Successful Login', 'iPhone 15 Pro (Safari PWA)', '152.57.12.84', '2026-07-28 08:10:00+05:30'),
('alex.sharma@gsfcuniversity.ac.in', 'Student', 'Email / Password', 'Successful Login', 'Android Smartphone (Chrome)', '49.36.140.12', '2026-07-28 07:50:00+05:30'),
('priya.patel@gsfcuniversity.ac.in', 'Student', 'Google OAuth', 'Successful Login', 'Android Smartphone (Brave)', '117.218.45.99', '2026-07-28 08:00:00+05:30'),
('driver.ramesh@gsfcuniversity.ac.in', 'Driver', 'Email / Password', 'Successful Login', 'Samsung Galaxy A54 (Driver App)', '106.213.88.15', '2026-07-28 07:15:00+05:30'),
('admin.transport@gsfcuniversity.ac.in', 'Admin', 'Google OAuth', 'Successful Login', 'MacBook Air (Chrome Desktop)', '152.57.12.84', '2026-07-28 09:00:00+05:30');
