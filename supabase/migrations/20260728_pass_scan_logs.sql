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
