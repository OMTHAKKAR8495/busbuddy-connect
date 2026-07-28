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
