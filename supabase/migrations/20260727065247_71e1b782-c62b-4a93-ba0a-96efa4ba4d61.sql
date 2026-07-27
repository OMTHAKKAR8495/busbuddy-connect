
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('student', 'driver', 'admin');
CREATE TYPE public.pass_status AS ENUM ('pending', 'active', 'expired', 'rejected');
CREATE TYPE public.alert_type AS ENUM ('breakdown', 'traffic_delay', 'route_change', 'other');

-- ============ PROFILES ============
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

-- ============ USER ROLES ============
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

-- ============ STOPS ============
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

-- ============ BUSES ============
CREATE TABLE public.buses (
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
CREATE TABLE public.trips (
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
CREATE TABLE public.bus_locations (
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
CREATE TABLE public.bus_passes (
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
CREATE TABLE public.alerts (
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
