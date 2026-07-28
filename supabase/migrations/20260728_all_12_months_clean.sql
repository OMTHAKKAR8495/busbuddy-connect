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
