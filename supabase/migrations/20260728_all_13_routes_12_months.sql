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
