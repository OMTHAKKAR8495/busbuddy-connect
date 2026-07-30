-- =====================================================================
-- OFFICIAL GSFC UNIVERSITY STUDENTS ROUTES 2026-27
-- Execute this SQL script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- =====================================================================

-- Clean up existing route/stop/bus relationships to avoid foreign key conflicts
TRUNCATE TABLE public.stops, public.buses, public.routes CASCADE;

-- Insert Official 13 Routes (All ending at GSFC University)
INSERT INTO public.routes (id, route_number, name, description, departure_time, polyline) VALUES
  ('11111111-1111-1111-1111-111111111111', 'R1', 'Soma Talav (BPC Pump) → GSFC University', 'GJ-16-AU-4788', '07:30 AM', '[[22.2879,73.1927],[22.2950,73.1850],[22.3020,73.1780],[22.3100,73.1700],[22.3236,73.1631]]'::jsonb),
  ('22222222-2222-2222-2222-222222222222', 'R2', 'Parivar Char Rasta → GSFC University', 'GJ-06-BX-3670', '07:30 AM', '[[22.2950,73.2100],[22.3020,73.2020],[22.3100,73.1950],[22.3180,73.1880],[22.3250,73.1750],[22.3236,73.1631]]'::jsonb),
  ('33333333-3333-3333-3333-333333333333', 'R3', 'Khodiyar Nagar → GSFC University', 'GJ-06-BV-2875 (50 Seater)', '07:30 AM', '[[22.3150,73.2150],[22.3220,73.2100],[22.3280,73.2050],[22.3350,73.1980],[22.3400,73.1850],[22.3236,73.1631]]'::jsonb),
  ('44444444-4444-4444-4444-444444444444', 'R4', 'Chankypuri → GSFC University', 'GJ-06-AX-3348', '07:40 AM', '[[22.3300,73.1650],[22.3380,73.1620],[22.3420,73.1600],[22.3236,73.1631]]'::jsonb),
  ('55555555-5555-5555-5555-555555555555', 'R5', 'Earth Icon → GSFC University', 'GJ-16-AU-4890', '07:35 AM', '[[22.3200,73.1950],[22.3250,73.1880],[22.3300,73.1800],[22.3350,73.1720],[22.3236,73.1631]]'::jsonb),
  ('66666666-6666-6666-6666-666666666666', 'R6', 'Voltamp Company → GSFC University', 'GJ-06-BV-7584', '07:25 AM', '[[22.2600,73.1900],[22.2700,73.1850],[22.2800,73.1800],[22.2900,73.1750],[22.3000,73.1700],[22.3236,73.1631]]'::jsonb),
  ('77777777-7777-7777-7777-777777777777', 'R7', 'Ravi Park → GSFC University', 'GJ-16-AU-1390', '07:35 AM', '[[22.2900,73.1600],[22.2980,73.1650],[22.3050,73.1700],[22.3120,73.1720],[22.3236,73.1631]]'::jsonb),
  ('88888888-8888-8888-8888-888888888888', 'R8', 'Darbar Chowkdi → GSFC University', 'GJ-06-BV-7989', '07:25 AM', '[[22.2750,73.1750],[22.2850,73.1780],[22.2950,73.1800],[22.3080,73.1820],[22.3180,73.1750],[22.3236,73.1631]]'::jsonb),
  ('99999999-9999-9999-9999-999999999999', 'R9', 'Sarswati Complex → GSFC University', 'GJ-06-BV-2915', '07:25 AM', '[[22.3100,73.2050],[22.3150,73.1980],[22.3120,73.1880],[22.3200,73.1820],[22.3280,73.1780],[22.3320,73.1720],[22.3236,73.1631]]'::jsonb),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'R10', 'Khishcoli Circle → GSFC University', 'GJ-16-AU-3840', '07:30 AM', '[[22.2800,73.1450],[22.2880,73.1500],[22.2950,73.1550],[22.3020,73.1600],[22.3100,73.1620],[22.3236,73.1631]]'::jsonb),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'R11', 'Hari Nagar Char Rasta → GSFC University', 'GJ-06-AX-1826', '07:20 AM', '[[22.3120,73.1400],[22.3180,73.1450],[22.3240,73.1500],[22.3300,73.1540],[22.3350,73.1580],[22.3380,73.1620],[22.3400,73.1660],[22.3236,73.1631]]'::jsonb),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'R12', 'Akshar Chowk → GSFC University', 'GJ-06-BV-6129', '07:15 AM', '[[22.2900,73.1500],[22.2960,73.1540],[22.3020,73.1580],[22.3080,73.1620],[22.3140,73.1660],[22.3280,73.1700],[22.3340,73.1680],[22.3380,73.1650],[22.3236,73.1631]]'::jsonb),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'R13', 'Nilamber Circle → GSFC University', 'GJ-06-BV-6527', '07:25 AM', '[[22.3050,73.1350],[22.3100,73.1450],[22.3150,73.1550],[22.3200,73.1650],[22.3250,73.1720],[22.3300,73.1700],[22.3236,73.1631]]'::jsonb);

-- Insert Official Bus Fleet
INSERT INTO public.buses (bus_number, plate, capacity, route_id) VALUES
  ('BUS-01', 'GJ-16-AU-4788', 45, '11111111-1111-1111-1111-111111111111'),
  ('BUS-02', 'GJ-06-BX-3670', 45, '22222222-2222-2222-2222-222222222222'),
  ('BUS-03', 'GJ-06-BV-2875', 50, '33333333-3333-3333-3333-333333333333'),
  ('BUS-04', 'GJ-06-AX-3348', 45, '44444444-4444-4444-4444-444444444444'),
  ('BUS-05', 'GJ-16-AU-4890', 45, '55555555-5555-5555-5555-555555555555'),
  ('BUS-06', 'GJ-06-BV-7584', 45, '66666666-6666-6666-6666-666666666666'),
  ('BUS-07', 'GJ-16-AU-1390', 45, '77777777-7777-7777-7777-777777777777'),
  ('BUS-08', 'GJ-06-BV-7989', 45, '88888888-8888-8888-8888-888888888888'),
  ('BUS-09', 'GJ-06-BV-2915', 45, '99999999-9999-9999-9999-999999999999'),
  ('BUS-10', 'GJ-16-AU-3840', 45, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('BUS-11', 'GJ-06-AX-1826', 45, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('BUS-12', 'GJ-06-BV-6129', 45, 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('BUS-13', 'GJ-06-BV-6527', 45, 'dddddddd-dddd-dddd-dddd-dddddddddddd');

-- Insert Official Stop Sequences (Every Route Ends at GSFC University)
INSERT INTO public.stops (route_id, name, lat, lng, stop_order, scheduled_time) VALUES
  -- Route 1 (GJ-16-AU-4788)
  ('11111111-1111-1111-1111-111111111111', 'SOMA TALAV (BPC PUMP)', 22.2879, 73.1927, 1, '07:30 AM'),
  ('11111111-1111-1111-1111-111111111111', 'GURUKUL CHAR RASTA', 22.2950, 73.1850, 2, '07:38 AM'),
  ('11111111-1111-1111-1111-111111111111', 'BAPOD POLICE ST', 22.3020, 73.1780, 3, '07:46 AM'),
  ('11111111-1111-1111-1111-111111111111', 'SUPER BEKERY', 22.3100, 73.1700, 4, '07:54 AM'),
  ('11111111-1111-1111-1111-111111111111', 'GSFC University', 22.3236, 73.1631, 5, '08:15 AM'),

  -- Route 2 (GJ-06-BX-3670)
  ('22222222-2222-2222-2222-222222222222', 'PARIVAR CHAR RASTA', 22.2950, 73.2100, 1, '07:30 AM'),
  ('22222222-2222-2222-2222-222222222222', 'VRUNDAVAN CIRCLE', 22.3020, 73.2020, 2, '07:38 AM'),
  ('22222222-2222-2222-2222-222222222222', 'SARDAR ESTATE(ISS)', 22.3100, 73.1950, 3, '07:46 AM'),
  ('22222222-2222-2222-2222-222222222222', 'EARTH ICON', 22.3180, 73.1880, 4, '07:54 AM'),
  ('22222222-2222-2222-2222-222222222222', 'AMIT NAGAR', 22.3250, 73.1750, 5, '08:02 AM'),
  ('22222222-2222-2222-2222-222222222222', 'GSFC University', 22.3236, 73.1631, 6, '08:15 AM'),

  -- Route 3 (GJ-06-BV-2875)
  ('33333333-3333-3333-3333-333333333333', 'KHODIAR NAGAR', 22.3150, 73.2150, 1, '07:30 AM'),
  ('33333333-3333-3333-3333-333333333333', 'AIRPORT CIRCLE', 22.3220, 73.2100, 2, '07:38 AM'),
  ('33333333-3333-3333-3333-333333333333', 'HARNI GADA CIRCLE', 22.3280, 73.2050, 3, '07:46 AM'),
  ('33333333-3333-3333-3333-333333333333', 'GOLDEN CHOKADI', 22.3350, 73.1980, 4, '07:54 AM'),
  ('33333333-3333-3333-3333-333333333333', 'DENA CHOKADI', 22.3400, 73.1850, 5, '08:02 AM'),
  ('33333333-3333-3333-3333-333333333333', 'GSFC University', 22.3236, 73.1631, 6, '08:15 AM'),

  -- Route 4 (GJ-06-AX-3348)
  ('44444444-4444-4444-4444-444444444444', 'CHANKYPURI', 22.3300, 73.1650, 1, '07:40 AM'),
  ('44444444-4444-4444-4444-444444444444', 'ABHILASHA CHAR RASTA', 22.3380, 73.1620, 2, '07:48 AM'),
  ('44444444-4444-4444-4444-444444444444', 'MILETRY BOYS', 22.3420, 73.1600, 3, '07:56 AM'),
  ('44444444-4444-4444-4444-444444444444', 'GSFC University', 22.3236, 73.1631, 4, '08:15 AM'),

  -- Route 5 (GJ-16-AU-4890)
  ('55555555-5555-5555-5555-555555555555', 'EARTH ICON', 22.3200, 73.1950, 1, '07:35 AM'),
  ('55555555-5555-5555-5555-555555555555', 'JAGDISH FARSHAN', 22.3250, 73.1880, 2, '07:43 AM'),
  ('55555555-5555-5555-5555-555555555555', 'AMIT NAGAR', 22.3300, 73.1800, 3, '07:51 AM'),
  ('55555555-5555-5555-5555-555555555555', 'L & T CIRCLE', 22.3350, 73.1720, 4, '07:59 AM'),
  ('55555555-5555-5555-5555-555555555555', 'GSFC University', 22.3236, 73.1631, 5, '08:15 AM'),

  -- Route 6 (GJ-06-BV-7584)
  ('66666666-6666-6666-6666-666666666666', 'VOLTAMP COMPANY', 22.2600, 73.1900, 1, '07:25 AM'),
  ('66666666-6666-6666-6666-666666666666', 'MANEJA CROSSING', 22.2700, 73.1850, 2, '07:33 AM'),
  ('66666666-6666-6666-6666-666666666666', 'HANUMAN TEMPLE (MAK)', 22.2800, 73.1800, 3, '07:41 AM'),
  ('66666666-6666-6666-6666-666666666666', 'NOVINO', 22.2900, 73.1750, 4, '07:49 AM'),
  ('66666666-6666-6666-6666-666666666666', 'SUSEN CIRCLE', 22.3000, 73.1700, 5, '07:57 AM'),
  ('66666666-6666-6666-6666-666666666666', 'GSFC University', 22.3236, 73.1631, 6, '08:15 AM'),

  -- Route 7 (GJ-16-AU-1390)
  ('77777777-7777-7777-7777-777777777777', 'RAVI PARK', 22.2900, 73.1600, 1, '07:35 AM'),
  ('77777777-7777-7777-7777-777777777777', 'GAMGASAGAR', 22.2980, 73.1650, 2, '07:43 AM'),
  ('77777777-7777-7777-7777-777777777777', 'KABIR COMPLEX', 22.3050, 73.1700, 3, '07:51 AM'),
  ('77777777-7777-7777-7777-777777777777', 'POLO GROUND', 22.3120, 73.1720, 4, '07:59 AM'),
  ('77777777-7777-7777-7777-777777777777', 'GSFC University', 22.3236, 73.1631, 5, '08:15 AM'),

  -- Route 8 (GJ-06-BV-7989)
  ('88888888-8888-8888-8888-888888888888', 'DARBAR CHOWKDI', 22.2750, 73.1750, 1, '07:25 AM'),
  ('88888888-8888-8888-8888-888888888888', 'PRAMUKH PRASAD/PRAMUKH DARSHAN', 22.2850, 73.1780, 2, '07:33 AM'),
  ('88888888-8888-8888-8888-888888888888', 'AVDHUT FATAK/LAL BAUG FATAK', 22.2950, 73.1800, 3, '07:41 AM'),
  ('88888888-8888-8888-8888-888888888888', 'KALAGHODA', 22.3080, 73.1820, 4, '07:49 AM'),
  ('88888888-8888-8888-8888-888888888888', 'MAHESANA NAGAR CIRCLE', 22.3180, 73.1750, 5, '07:57 AM'),
  ('88888888-8888-8888-8888-888888888888', 'GSFC University', 22.3236, 73.1631, 6, '08:15 AM'),

  -- Route 9 (GJ-06-BV-2915)
  ('99999999-9999-9999-9999-999999999999', 'SARSWATI COMPLEX', 22.3100, 73.2050, 1, '07:25 AM'),
  ('99999999-9999-9999-9999-999999999999', 'TULSIDHAM', 22.3150, 73.1980, 2, '07:33 AM'),
  ('99999999-9999-9999-9999-999999999999', 'RAJ MAHEL GATE', 22.3120, 73.1880, 3, '07:41 AM'),
  ('99999999-9999-9999-9999-999999999999', 'FATEHGUNG- BOB', 22.3200, 73.1820, 4, '07:49 AM'),
  ('99999999-9999-9999-9999-999999999999', 'YOGNIKETAN', 22.3280, 73.1780, 5, '07:57 AM'),
  ('99999999-9999-9999-9999-999999999999', 'NIZAMPURA-Tasty Vadapav', 22.3320, 73.1720, 6, '08:05 AM'),
  ('99999999-9999-9999-9999-999999999999', 'GSFC University', 22.3236, 73.1631, 7, '08:15 AM'),

  -- Route 10 (GJ-16-AU-3840)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'KHISHCOLI CIRCLE', 22.2800, 73.1450, 1, '07:30 AM'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ATLADRA', 22.2880, 73.1500, 2, '07:38 AM'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'KIA MOTER', 22.2950, 73.1550, 3, '07:46 AM'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SUN PHARMA ROAD', 22.3020, 73.1600, 4, '07:54 AM'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TANDALJA', 22.3100, 73.1620, 5, '08:02 AM'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'GSFC University', 22.3236, 73.1631, 6, '08:15 AM'),

  -- Route 11 (GJ-06-AX-1826)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'HARI NAGAR CHAR RASTA', 22.3120, 73.1400, 1, '07:20 AM'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'NANDALAY CIRCLE', 22.3180, 73.1450, 2, '07:28 AM'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ZANSI KI RANI', 22.3240, 73.1500, 3, '07:36 AM'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'JAIN DERASAR', 22.3300, 73.1540, 4, '07:44 AM'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'DASHAMA CHOKDI', 22.3350, 73.1580, 5, '07:52 AM'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ITI GORWA', 22.3380, 73.1620, 6, '08:00 AM'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PANCHWATI CIRCLE', 22.3400, 73.1660, 7, '08:07 AM'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'GSFC University', 22.3236, 73.1631, 8, '08:15 AM'),

  -- Route 12 (GJ-06-BV-6129)
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'AKSHAR CHOWK', 22.2900, 73.1500, 1, '07:15 AM'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'DEVDEEP NAGAR', 22.2960, 73.1540, 2, '07:22 AM'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'VASNA CIRCLE-KHETESHWAR', 22.3020, 73.1580, 3, '07:30 AM'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'SWAMINARAYAN MANDIR', 22.3080, 73.1620, 4, '07:37 AM'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'TIME CIRCLE', 22.3140, 73.1660, 5, '07:45 AM'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'CHHANI JAKAT NAKA', 22.3280, 73.1700, 6, '07:52 AM'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'CHHANI CANAL', 22.3340, 73.1680, 7, '08:00 AM'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'CHHANI GURUDWARA', 22.3380, 73.1650, 8, '08:07 AM'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'GSFC University', 22.3236, 73.1631, 9, '08:15 AM'),

  -- Route 13 (GJ-06-BV-6527)
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'NILAMBER CIRCLE', 22.3050, 73.1350, 1, '07:25 AM'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'YASH COMPLEX', 22.3100, 73.1450, 2, '07:33 AM'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'NATUBHAI CIRCLE', 22.3150, 73.1550, 3, '07:41 AM'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'CHAKLI CIRCLE', 22.3200, 73.1650, 4, '07:49 AM'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'TRIDENT CIRCLE', 22.3250, 73.1720, 5, '07:57 AM'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'GENDA CIRCLE', 22.3300, 73.1700, 6, '08:05 AM'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'GSFC University', 22.3236, 73.1631, 7, '08:15 AM');
