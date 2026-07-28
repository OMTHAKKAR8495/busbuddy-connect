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
