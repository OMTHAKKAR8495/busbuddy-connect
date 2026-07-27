-- ====================================================================
-- GSFC UNIVERSITY TRANSIT (BUSBUDDY CONNECT) — COMPLETE SUPABASE SCHEMA
-- Run this script in the Supabase SQL Editor to initialize all tables,
-- RLS policies, views, trigger functions, and official 2026-27 route data.
-- ====================================================================

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('student', 'driver', 'admin');
CREATE TYPE public.pass_status AS ENUM ('pending', 'active', 'expired', 'rejected');
CREATE TYPE public.alert_type AS ENUM ('breakdown', 'traffic_delay', 'route_change', 'other');

-- 2. PROFILES TABLE
CREATE TABLE public.profiles (
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

-- 3. USER ROLES TABLE
CREATE TABLE public.user_roles (
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

CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. AUTO PROFILE & DEFAULT ROLE TRIGGER
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

-- 5. ROUTES TABLE
CREATE TABLE public.routes (
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

-- 6. STOPS TABLE
CREATE TABLE public.stops (
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

-- 7. BUSES TABLE
CREATE TABLE public.buses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_number TEXT NOT NULL UNIQUE,
  plate TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 40,
  active BOOLEAN NOT NULL DEFAULT true,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.buses TO authenticated;
GRANT ALL ON public.buses TO service_role;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "buses_select_auth" ON public.buses FOR SELECT TO authenticated USING (true);
CREATE POLICY "buses_driver_update" ON public.buses FOR UPDATE TO authenticated
  USING (driver_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (driver_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 8. TRIPS TABLE
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true
);
GRANT SELECT, INSERT, UPDATE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trips_select_auth" ON public.trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "trips_driver_insert" ON public.trips FOR INSERT TO authenticated WITH CHECK (driver_id = auth.uid());
CREATE POLICY "trips_driver_update" ON public.trips FOR UPDATE TO authenticated USING (driver_id = auth.uid());

-- 9. BUS LOCATIONS TABLE (REALTIME GPS TELEMETRY)
CREATE TABLE public.bus_locations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
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
  WITH CHECK (EXISTS (SELECT 1 FROM public.trips WHERE id = trip_id AND driver_id = auth.uid() AND active = true));

-- LATEST BUS LOCATIONS VIEW
CREATE VIEW public.latest_bus_locations
WITH (security_invoker = true) AS
SELECT DISTINCT ON (bus_id) bus_id, trip_id, lat, lng, speed, heading, recorded_at
FROM public.bus_locations
ORDER BY bus_id, recorded_at DESC;
GRANT SELECT ON public.latest_bus_locations TO authenticated;

-- 10. BUS PASSES TABLE
CREATE TABLE public.bus_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  pickup_stop_id UUID REFERENCES public.stops(id) ON DELETE SET NULL,
  status public.pass_status NOT NULL DEFAULT 'pending',
  fee_paid BOOLEAN NOT NULL DEFAULT false,
  secret TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '6 months')::date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.bus_passes TO authenticated;
GRANT ALL ON public.bus_passes TO service_role;
ALTER TABLE public.bus_passes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "passes_select_own" ON public.bus_passes FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "passes_student_insert" ON public.bus_passes FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "passes_admin_update" ON public.bus_passes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 11. ALERTS TABLE
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  alert_type public.alert_type NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts_select_auth" ON public.alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "alerts_driver_insert" ON public.alerts FOR INSERT TO authenticated WITH CHECK (driver_id = auth.uid());

-- ====================================================================
-- SEED DATA: 13 OFFICIAL GSFC UNIVERSITY ROUTES (2026-27)
-- ====================================================================

INSERT INTO public.routes (id, route_number, name, description, polyline, departure_time, active)
VALUES
('r01-0000-0000-0000-000000000001', 'Route 1', 'Soma Talav (BPC Pump) → GSFC University', 'Bus GJ-16-AU-4788 via Soma Talav, Gurukul, Bapod Police St, Super Bekery.', '[[22.2891, 73.2382], [22.2940, 73.2300], [22.2985, 73.2241], [22.3120, 73.2080], [22.3800, 73.1930]]'::jsonb, '07:30 AM', true),
('r02-0000-0000-0000-000000000002', 'Route 2', 'Parivar Char Rasta → GSFC University', 'Bus GJ-06-BX-3670 via Parivar, Vrundavan, Sardar Estate, Earth Icon, Amit Nagar.', '[[22.3020, 73.2260], [22.3180, 73.2220], [22.3320, 73.2100], [22.3450, 73.2010], [22.3480, 73.1960], [22.3800, 73.1930]]'::jsonb, '07:35 AM', true),
('r03-0000-0000-0000-000000000003', 'Route 3', 'Khodiyar Nagar (50 Seater) → GSFC University', 'Bus GJ-06-BV-2875 via Khodiyar Nagar, Airport Circle, Harni Gada, Golden Chokadi, Dena.', '[[22.3310, 73.2210], [22.3270, 73.2290], [22.3390, 73.2270], [22.3680, 73.2250], [22.3820, 73.2180], [22.3800, 73.1930]]'::jsonb, '07:25 AM', true),
('r04-0000-0000-0000-000000000004', 'Route 4', 'Chankypuri → GSFC University', 'Bus GJ-06-AX-3348 via Chankypuri, Abhilasha Char Rasta, Miletry Boys.', '[[22.3410, 73.1610], [22.3490, 73.1680], [22.3620, 73.1750], [22.3800, 73.1930]]'::jsonb, '07:40 AM', true),
('r05-0000-0000-0000-000000000005', 'Route 5', 'Earth Icon → GSFC University', 'Bus GJ-16-AU-4890 via Earth Icon, Jagdish Farshan, Amit Nagar, L & T Circle.', '[[22.3450, 73.2010], [22.3470, 73.1980], [22.3480, 73.1960], [22.3580, 73.1890], [22.3800, 73.1930]]'::jsonb, '07:45 AM', true),
('r06-0000-0000-0000-000000000006', 'Route 6', 'Voltamp Company → GSFC University', 'Bus GJ-06-BV-7584 via Voltamp, Maneja Crossing, Hanuman Temple, Novino, Susen Circle.', '[[22.2410, 73.1940], [22.2480, 73.1980], [22.2560, 73.1920], [22.2680, 73.1890], [22.2790, 73.1860], [22.3800, 73.1930]]'::jsonb, '07:15 AM', true),
('r07-0000-0000-0000-000000000007', 'Route 7', 'Ravi Park → GSFC University', 'Bus GJ-16-AU-1390 via Ravi Park, Gamgasagar, Kabir Complex, Polo Ground.', '[[22.2850, 73.1980], [22.2910, 73.1940], [22.2970, 73.1910], [22.3020, 73.1870], [22.3800, 73.1930]]'::jsonb, '07:30 AM', true),
('r08-0000-0000-0000-000000000008', 'Route 8', 'Darbar Chowkdi → GSFC University', 'Bus GJ-06-BV-7989 via Darbar Chowkdi, Pramukh Prasad, Avdhut Fatak, Kalaghoda, Mahesana Nagar.', '[[22.2740, 73.1760], [22.2830, 73.1790], [22.2890, 73.1830], [22.3060, 73.1890], [22.3420, 73.1810], [22.3800, 73.1930]]'::jsonb, '07:20 AM', true),
('r09-0000-0000-0000-000000000009', 'Route 9', 'Sarswati Complex → GSFC University', 'Bus GJ-06-BV-2915 via Sarswati Complex, Tulsidham, Raj Mahel Gate, Fatehgung, Yogniketan, Nizampura.', '[[22.2790, 73.1680], [22.2860, 73.1720], [22.2990, 73.1820], [22.3210, 73.1880], [22.3310, 73.1870], [22.3480, 73.1860], [22.3800, 73.1930]]'::jsonb, '07:25 AM', true),
('r10-0000-0000-0000-000000000010', 'Route 10', 'Khishcoli Circle → GSFC University', 'Bus GJ-16-AU-3840 via Khishcoli Circle, Atladra, Kia Moter, Sun Pharma Road, Tandalja.', '[[22.2690, 73.1510], [22.2760, 73.1540], [22.2840, 73.1580], [22.2910, 73.1610], [22.2980, 73.1640], [22.3800, 73.1930]]'::jsonb, '07:15 AM', true),
('r11-0000-0000-0000-000000000011', 'Route 11', 'Hari Nagar Char Rasta → GSFC University', 'Bus GJ-06-AX-1826 via Hari Nagar, Nandalay, Zansi Ki Rani, Jain Derasar, Dashama Chokdi, ITI Gorwa, Panchwati.', '[[22.3090, 73.1490], [22.3160, 73.1530], [22.3240, 73.1580], [22.3310, 73.1620], [22.3410, 73.1660], [22.3510, 73.1710], [22.3610, 73.1760], [22.3800, 73.1930]]'::jsonb, '07:20 AM', true),
('r12-0000-0000-0000-000000000012', 'Route 12', 'Akshar Chowk → GSFC University', 'Bus GJ-06-BV-6129 via Akshar Chowk, Devdeep Nagar, Vasna Circle, Swaminarayan Mandir, Time Circle, Chhani Jakat Naka, Canal, Gurudwara.', '[[22.2910, 73.1520], [22.2980, 73.1480], [22.3050, 73.1440], [22.3120, 73.1410], [22.3240, 73.1460], [22.3510, 73.1810], [22.3610, 73.1840], [22.3690, 73.1870], [22.3800, 73.1930]]'::jsonb, '07:10 AM', true),
('r13-0000-0000-0000-000000000013', 'Route 13', 'Nilamber Circle → GSFC University', 'Bus GJ-06-BV-6527 via Nilamber Circle, Yash Complex, Natubhai Circle, Chakli Circle, Trident Circle, Genda Circle.', '[[22.3120, 73.1320], [22.3190, 73.1410], [22.3140, 73.1590], [22.3110, 73.1680], [22.3150, 73.1760], [22.3210, 73.1720], [22.3800, 73.1930]]'::jsonb, '07:25 AM', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.buses (id, bus_number, plate, capacity, active, route_id)
VALUES
('b01-0000-0000-0000-000000000001', '01', 'GJ-16-AU-4788', 40, true, 'r01-0000-0000-0000-000000000001'),
('b02-0000-0000-0000-000000000002', '02', 'GJ-06-BX-3670', 40, true, 'r02-0000-0000-0000-000000000002'),
('b03-0000-0000-0000-000000000003', '03', 'GJ-06-BV-2875', 50, true, 'r03-0000-0000-0000-000000000003'),
('b04-0000-0000-0000-000000000004', '04', 'GJ-06-AX-3348', 40, true, 'r04-0000-0000-0000-000000000004'),
('b05-0000-0000-0000-000000000005', '05', 'GJ-16-AU-4890', 40, true, 'r05-0000-0000-0000-000000000005'),
('b06-0000-0000-0000-000000000006', '06', 'GJ-06-BV-7584', 40, true, 'r06-0000-0000-0000-000000000006'),
('b07-0000-0000-0000-000000000007', '07', 'GJ-16-AU-1390', 40, true, 'r07-0000-0000-0000-000000000007'),
('b08-0000-0000-0000-000000000008', '08', 'GJ-06-BV-7989', 40, true, 'r08-0000-0000-0000-000000000008'),
('b09-0000-0000-0000-000000000009', '09', 'GJ-06-BV-2915', 40, true, 'r09-0000-0000-0000-000000000009'),
('b10-0000-0000-0000-000000000010', '10', 'GJ-16-AU-3840', 40, true, 'r10-0000-0000-0000-000000000010'),
('b11-0000-0000-0000-000000000011', '11', 'GJ-06-AX-1826', 40, true, 'r11-0000-0000-0000-000000000011'),
('b12-0000-0000-0000-000000000012', '12', 'GJ-06-BV-6129', 40, true, 'r12-0000-0000-0000-000000000012'),
('b13-0000-0000-0000-000000000013', '13', 'GJ-06-BV-6527', 40, true, 'r13-0000-0000-0000-000000000013')
ON CONFLICT (id) DO NOTHING;
