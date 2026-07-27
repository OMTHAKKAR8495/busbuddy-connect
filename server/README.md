# 🍃 GSFCU Transit — MongoDB + Express + Socket.io Backend

This directory contains the standalone **MongoDB & Node.js Express Backend** for the GSFCU Transit application. It features Mongoose schemas for all 13 official GSFC University routes, live WebSocket GPS streaming via Socket.io, dynamic pass validation, and REST API endpoints.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Database**: MongoDB (Mongoose ORM)
- **Server Framework**: Express.js
- **Real-time WebSockets**: Socket.io
- **Security & Auth**: JWT + bcryptjs

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

Create `.env` or set environment variables:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/gsfcu_transit
JWT_SECRET=gsfcu_transit_super_secret_jwt_key
```

### 3. Seed All 13 Official GSFC University Routes

Populate MongoDB with all 13 official GSFC University student shuttle routes (2026-27), bus license plates, and Vadodara stops:

```bash
npm run seed
```

### 4. Start Server

```bash
# Production server
npm start

# Development server (auto-restart with nodemon)
npm run dev
```

---

## 📡 REST & WebSocket API Endpoints

- `GET /api/health` — API status check
- `GET /api/routes` — Fetch all 13 active GSFCU routes & stop lists
- `GET /api/buses` — Fetch all 13 shuttle buses & assigned drivers
- `POST /api/locations` — Post live driver GPS ping (emits `busLocationUpdate` via Socket.io)
- `GET /api/locations/latest` — Fetch current locations for active fleet
- `POST /api/alerts` — Broadcast driver emergency SOS / traffic delay alert (emits `newAlert` via Socket.io)
- `GET /api/alerts` — Fetch recent route alerts
- `POST /api/passes` — Apply for digital student bus pass
- `GET /api/passes` — Fetch pass applications
- `PATCH /api/passes/:id` — Admin fee payment verification & pass approval
