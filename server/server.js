import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import User from "./models/User.js";
import Route from "./models/Route.js";
import Stop from "./models/Stop.js";
import Bus from "./models/Bus.js";
import BusLocation from "./models/BusLocation.js";
import BusPass from "./models/BusPass.js";
import Alert from "./models/Alert.js";
import DriverShiftLog from "./models/DriverShiftLog.js";
import AttendanceLog from "./models/AttendanceLog.js";
import jwt from "jsonwebtoken";
import { protect } from "./middleware/auth.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gsfcu_transit";
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log(`[MongoDB] Connected successfully to ${MONGODB_URI}`))
  .catch((err) => console.error(`[MongoDB Connection Error]`, err));

// ==================== REST API ENDPOINTS ====================

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", service: "GSFCU Transit MongoDB API", timestamp: new Date() });
});

// ==================== AUTH ENDPOINTS ====================

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_super_secret_key_gsfcu_transit", {
    expiresIn: "30d",
  });
};

app.post("/api/auth/register", async (req, res) => {
  try {
    const { fullName, email, password, role, rollNumber, phone } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ fullName, email, password, role, rollNumber, phone });
    if (user) {
      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/auth/me", protect, (req, res) => {
  res.json(req.user);
});


// GET all 13 Routes with Stops
app.get("/api/routes", async (req, res) => {
  try {
    const routes = await Route.find({ active: true }).sort({ routeNumber: 1 });
    const result = await Promise.all(
      routes.map(async (r) => {
        const stops = await Stop.find({ routeId: r._id }).sort({ stopOrder: 1 });
        return { ...r.toObject(), stops };
      })
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Buses
app.get("/api/buses", async (req, res) => {
  try {
    const buses = await Bus.find({ active: true }).populate("routeId").populate("driverId", "fullName email");
    res.json(buses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST GPS Location Ping (Driver telemetry)
app.post("/api/locations", async (req, res) => {
  try {
    const { busId, tripId, lat, lng, speed, heading } = req.body;
    const location = await BusLocation.create({ busId, tripId, lat, lng, speed, heading });

    // Emit live WebSocket update to connected clients
    io.emit("busLocationUpdate", { busId, lat, lng, speed, heading, recordedAt: location.recordedAt });

    res.status(201).json(location);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Latest Bus Locations
app.get("/api/locations/latest", async (req, res) => {
  try {
    const buses = await Bus.find({ active: true });
    const latestLocations = await Promise.all(
      buses.map(async (b) => {
        const loc = await BusLocation.findOne({ busId: b._id }).sort({ recordedAt: -1 });
        return loc ? { busId: b._id, busNumber: b.busNumber, plate: b.plate, lat: loc.lat, lng: loc.lng, speed: loc.speed, heading: loc.heading, recordedAt: loc.recordedAt } : null;
      })
    );
    res.json(latestLocations.filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Emergency Alert (Driver)
app.post("/api/alerts", async (req, res) => {
  try {
    const { routeId, driverId, alertType, message } = req.body;
    const alert = await Alert.create({ routeId, driverId, alertType, message });
    
    // Broadcast via WebSocket to subscribers
    io.emit("newAlert", alert);

    res.status(201).json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Alerts for Route
app.get("/api/alerts", async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(50).populate("routeId", "routeNumber name");
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Bus Pass Application (Student)
app.post("/api/passes", async (req, res) => {
  try {
    const { studentId, routeId, pickupStopId } = req.body;
    const pass = await BusPass.create({ studentId, routeId, pickupStopId });
    res.status(201).json(pass);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Student Passes
app.get("/api/passes", async (req, res) => {
  try {
    const passes = await BusPass.find().populate("studentId", "fullName rollNumber email").populate("routeId", "routeNumber name");
    res.json(passes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH Update Pass Status / Fee (Admin)
app.patch("/api/passes/:id", async (req, res) => {
  try {
    const { status, feePaid } = req.body;
    const updated = await BusPass.findByIdAndUpdate(req.params.id, { status, feePaid }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== DRIVER SHIFTS & ATTENDANCE ====================

// GET Driver Shift Logs
app.get("/api/shifts", protect, async (req, res) => {
  try {
    const shifts = await DriverShiftLog.find().sort({ createdAt: -1 }).limit(100).populate("driverId", "fullName email").populate("routeId", "routeNumber name");
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Driver Shift Log
app.post("/api/shifts", protect, async (req, res) => {
  try {
    const { routeId, status } = req.body;
    const shift = await DriverShiftLog.create({ driverId: req.user._id, routeId, status });
    res.status(201).json(shift);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Attendance Logs
app.get("/api/attendance", protect, async (req, res) => {
  try {
    const logs = await AttendanceLog.find().sort({ createdAt: -1 }).limit(500).populate("studentId", "fullName rollNumber email").populate("routeId", "routeNumber name").populate("stopId", "name");
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Attendance Log
app.post("/api/attendance", protect, async (req, res) => {
  try {
    const { studentId, routeId, stopId } = req.body;
    const log = await AttendanceLog.create({ studentId, routeId, stopId });
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Users by Role
app.get("/api/users", protect, async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};
    const users = await User.find(query).select("-password");
    res.json(users);
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
  console.log(`🚀 [MongoDB Backend] Server running on http://localhost:${PORT}`);
});
