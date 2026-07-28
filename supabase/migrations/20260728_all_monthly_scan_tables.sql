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
