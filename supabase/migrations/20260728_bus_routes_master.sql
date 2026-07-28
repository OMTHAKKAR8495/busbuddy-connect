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
