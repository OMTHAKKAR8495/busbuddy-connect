import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sql } from "./db.js";
import { protect } from "./middleware/auth.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_key_gsfcu_transit";

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: "30d",
  });
};

// ==================== REST API ENDPOINTS ====================

// Health Check
app.get("/api/health", async (req, res) => {
  try {
    const dbTest = await sql`SELECT 1 as connected`;
    res.json({
      status: "OK",
      service: "GSFCU Transit Neon PostgreSQL API",
      database: dbTest[0]?.connected === 1 ? "Connected (Neon PostgreSQL)" : "Unknown",
      timestamp: new Date(),
    });
  } catch (err) {
    res.status(500).json({ status: "DEGRADED", error: err.message });
  }
});

// ==================== AUTH ENDPOINTS ====================

// Register Account
app.post("/api/auth/register", async (req, res) => {
  try {
    const { fullName, email, password, role = "student", rollNumber, phone } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail || !password || !fullName) {
      return res.status(400).json({ message: "Full name, email, and password are required" });
    }

    const existing = await sql`
      SELECT id FROM public.app_accounts WHERE LOWER(email) = ${cleanEmail} LIMIT 1
    `;
    if (existing.length > 0) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const inserted = await sql`
      INSERT INTO public.app_accounts (full_name, email, password, roll_number, phone, role)
      VALUES (${fullName.trim()}, ${cleanEmail}, ${hashedPassword}, ${rollNumber || null}, ${phone || null}, ${role})
      RETURNING id, full_name, email, role, roll_number, phone, created_at;
    `;

    const user = inserted[0];

    // Mirror to registered_students_master if student
    if (role === "student") {
      try {
        await sql`
          INSERT INTO public.registered_students_master (id, student_name, roll_number, email, phone, status, registered_at)
          VALUES (${user.id}, ${user.full_name}, ${user.roll_number || '24BT04171'}, ${user.email}, ${user.phone || '+91 98765 43210'}, 'Active', NOW())
          ON CONFLICT (email) DO NOTHING;
        `;
      } catch (e) {
        console.warn("[Register mirror student]", e.message);
      }
    }

    // Mirror to profiles
    try {
      await sql`
        INSERT INTO public.profiles (id, full_name, roll_number, phone)
        VALUES (${user.id}, ${user.full_name}, ${user.roll_number || null}, ${user.phone || null})
        ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
      `;
    } catch (e) {
      console.warn("[Register mirror profile]", e.message);
    }

    res.status(201).json({
      _id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      rollNumber: user.roll_number,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error("[Register Error]", error);
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    const users = await sql`
      SELECT id, full_name, email, password, role, roll_number, phone
      FROM public.app_accounts
      WHERE LOWER(email) = ${cleanEmail}
      LIMIT 1;
    `;

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    // Backward compatibility for plaintext seed passwords if any
    const isPlainMatch = !isMatch && user.password === password;

    if (!isMatch && !isPlainMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Record login audit log
    try {
      await sql`
        INSERT INTO public.user_login_audit_logs (email, role, login_method, status, device, ip_address, created_at)
        VALUES (${user.email}, ${user.role}, 'Neon Password', 'SUCCESS', 'Web Client', '127.0.0.1', NOW());
      `;
    } catch (e) {}

    res.json({
      _id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      rollNumber: user.roll_number,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error("[Login Error]", error);
    res.status(500).json({ error: error.message });
  }
});

// Current Authenticated User
app.get("/api/auth/me", protect, (req, res) => {
  res.json({
    _id: req.user.id,
    fullName: req.user.full_name,
    email: req.user.email,
    role: req.user.role,
    rollNumber: req.user.roll_number,
  });
});

// ==================== ROUTES & BUSES ENDPOINTS ====================

// GET all Routes with Stops
app.get("/api/routes", async (req, res) => {
  try {
    const routes = await sql`
      SELECT id, route_number as "routeNumber", name, description, polyline, departure_time as "departureTime", active
      FROM public.routes
      WHERE active = true
      ORDER BY route_number ASC;
    `;

    const stops = await sql`
      SELECT id, route_id as "routeId", name, lat, lng, stop_order as "stopOrder", scheduled_time as "scheduledTime"
      FROM public.stops
      ORDER BY route_id, stop_order ASC;
    `;

    const stopsByRoute = stops.reduce((acc, s) => {
      acc[s.routeId] = acc[s.routeId] || [];
      acc[s.routeId].push(s);
      return acc;
    }, {});

    const result = routes.map((r) => ({
      ...r,
      stops: stopsByRoute[r.id] || [],
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Buses
app.get("/api/buses", async (req, res) => {
  try {
    const buses = await sql`
      SELECT b.id, b.bus_number as "busNumber", b.plate, b.route_id as "routeId", b.driver_id as "driverId", b.active,
             r.route_number as "routeNumber", r.name as "routeName"
      FROM public.buses b
      LEFT JOIN public.routes r ON b.route_id = r.id
      WHERE b.active = true
      ORDER BY b.bus_number ASC;
    `;
    res.json(buses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== GPS & LIVE TELEMETRY ====================

// POST GPS Location Ping
app.post("/api/locations", async (req, res) => {
  try {
    const { busId, tripId, lat, lng, speed = 0, heading = 0 } = req.body;
    
    await sql`
      INSERT INTO public.bus_locations (bus_id, trip_id, lat, lng, speed, heading, recorded_at)
      VALUES (${busId}, ${tripId || null}, ${lat}, ${lng}, ${speed}, ${heading}, NOW());
    `;

    const locPayload = {
      busId,
      lat,
      lng,
      speed,
      heading,
      recordedAt: new Date().toISOString(),
    };

    io.emit("busLocationUpdate", locPayload);
    res.status(201).json(locPayload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Latest Bus Locations
app.get("/api/locations/latest", async (req, res) => {
  try {
    const latestLocations = await sql`
      SELECT DISTINCT ON (bus_id)
        bus_id as "busId",
        lat,
        lng,
        speed,
        heading,
        recorded_at as "recordedAt"
      FROM public.bus_locations
      ORDER BY bus_id, recorded_at DESC;
    `;
    res.json(latestLocations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ALERTS ====================

app.post("/api/alerts", async (req, res) => {
  try {
    const { routeId, driverId, alertType, message } = req.body;
    const inserted = await sql`
      INSERT INTO public.alerts (route_id, driver_id, alert_type, message, created_at)
      VALUES (${routeId || null}, ${driverId || null}, ${alertType}, ${message}, NOW())
      RETURNING id, route_id as "routeId", driver_id as "driverId", alert_type as "alertType", message, created_at as "createdAt";
    `;

    const alert = inserted[0];
    io.emit("newAlert", alert);
    res.status(201).json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await sql`
      SELECT a.id, a.route_id as "routeId", a.driver_id as "driverId", a.alert_type as "alertType", a.message, a.created_at as "createdAt",
             r.route_number as "routeNumber", r.name as "routeName"
      FROM public.alerts a
      LEFT JOIN public.routes r ON a.route_id = r.id
      ORDER BY a.created_at DESC
      LIMIT 50;
    `;
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== BUS PASSES ====================

app.post("/api/passes", async (req, res) => {
  try {
    const { studentId, routeId, pickupStopId } = req.body;
    const inserted = await sql`
      INSERT INTO public.bus_passes (student_id, route_id, pickup_stop_id, valid_from, valid_until, fee_paid, status, secret)
      VALUES (${studentId}, ${routeId}, ${pickupStopId || null}, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', false, 'active', gen_random_uuid())
      RETURNING *;
    `;
    res.status(201).json(inserted[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/passes", async (req, res) => {
  try {
    const passes = await sql`
      SELECT p.*, r.route_number as "routeNumber", r.name as "routeName"
      FROM public.bus_passes p
      LEFT JOIN public.routes r ON p.route_id = r.id
      ORDER BY p.created_at DESC;
    `;
    res.json(passes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/passes/:id", async (req, res) => {
  try {
    const { status, feePaid } = req.body;
    const updated = await sql`
      UPDATE public.bus_passes
      SET status = COALESCE(${status}, status),
          fee_paid = COALESCE(${feePaid}, fee_paid),
          updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING *;
    `;
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== DRIVER SHIFTS & PASSES ====================

app.get("/api/shifts", protect, async (req, res) => {
  try {
    const shifts = await sql`
      SELECT * FROM public.driver_shift_logs_july_2026 ORDER BY created_at DESC LIMIT 100;
    `;
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/shifts", protect, async (req, res) => {
  try {
    const { driverName, busNumber, routeNumber, status = "Started", shiftType = "Morning Shift" } = req.body;
    const inserted = await sql`
      INSERT INTO public.driver_shift_logs_july_2026 (driver_name, bus_number, route_number, shift_type, status, created_at)
      VALUES (${driverName || req.user.full_name}, ${busNumber || 'BUS-01'}, ${routeNumber || 'R1'}, ${shiftType}, ${status}, NOW())
      RETURNING *;
    `;
    res.status(201).json(inserted[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Driver ID passes
app.get("/api/driver-passes", async (req, res) => {
  try {
    const passes = await sql`SELECT * FROM public.driver_id_passes ORDER BY created_at DESC;`;
    res.json(passes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/driver-passes", async (req, res) => {
  try {
    const p = req.body;
    const inserted = await sql`
      INSERT INTO public.driver_id_passes (
        driver_name, employee_id, license_number, phone_number, blood_group,
        assigned_bus, assigned_route, route_name, photo_url, valid_from,
        valid_until, emergency_contact, security_badge_code, status
      ) VALUES (
        ${p.driver_name}, ${p.employee_id}, ${p.license_number}, ${p.phone_number}, ${p.blood_group},
        ${p.assigned_bus}, ${p.assigned_route}, ${p.route_name}, ${p.photo_url || null}, ${p.valid_from},
        ${p.valid_until}, ${p.emergency_contact}, ${p.security_badge_code}, ${p.status || 'Active'}
      )
      RETURNING *;
    `;
    res.status(201).json(inserted[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.io Real-time WebSocket connection
io.on("connection", (socket) => {
  console.log(`[WebSocket] Client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`[WebSocket] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 [Neon PostgreSQL Backend] Server running on http://localhost:${PORT}`);
});
