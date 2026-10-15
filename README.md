<div align="center">
  <img src="public/gsfc-transit-app-logo.png" alt="GSFCU Transit Logo" width="200" />
  <h1>🚌 GSFCU Transit — Smart Campus Mobility & Fleet Platform</h1>
  
  [![Live Demo](https://img.shields.io/badge/Live_Demo-busbuddy--connect.vercel.app-blue?style=for-the-badge&logo=vercel)](https://busbuddy-connect.vercel.app)
</div>

GSFCU Transit is a custom-engineered, real-time campus shuttle tracking and digital transit management system built specifically for GSFC University students, shuttle drivers, and fleet transport administrators.

---

## 🌟 Key Features

- 📍 **Real-Time GPS Fleet Radar**: Live tracking map powered by Leaflet & OpenStreetMap, displaying active shuttle buses across Vadodara routes.
- 🎟️ **Anti-Fraud Dynamic Digital Pass**: Rotating visual token and secure QR pass for authenticated student pass verification.
- ⏱️ **Smart Stop ETAs**: Dynamic arrival predictions per route stop.
- 📢 **Emergency Driver Broadcast System**: Instant alerts pushed by bus drivers to active route passengers (delays, breakdowns, detour alerts).
- 🛡️ **Multi-Tier Role Management**: Secure access tiers tailored for Students, Drivers, and Transport Administrators.

---

## 🛠️ Built With

- **Framework**: [TanStack Start](https://tanstack.com/start) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + Lucide Icons + Custom Glassmorphism UI
- **Database & Backend**: [Neon PostgreSQL](https://neon.tech) Serverless + Node.js Express backend
- **Mapping**: Leaflet + React Leaflet

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Bun or npm

### Installation

```bash
# Clone repository
git clone https://github.com/OMTHAKKAR8495/busbuddy-connect.git
cd busbuddy-connect

# Install dependencies
npm install

# Start local development server
npm run dev
```

---

## 🔒 Environment Variables

Configure your Neon PostgreSQL credentials in `.env.local`:

```env
DATABASE_URL=[DATABASE_URL_REMOVED]
VITE_SUPABASE_URL=https://your-project.supabase.co
PORT=3001
```

---

GSFCU Transit · Crafted with precision for campus transportation.
