# 🎨 GSFCU Transit — Frontend Application

This folder contains the complete React + TanStack Start + Vite frontend application for **GSFCU Transit** (Smart Campus Mobility & Pass System).

---

## 🛠️ Stack & Architecture
- **Framework**: React 19 + TanStack Start / Router + Vite
- **Styling**: Tailwind CSS + Shadcn UI + Lucide Icons
- **Database / Auth**: Supabase PostgreSQL & Auth (Google OAuth)
- **Map & Real-time**: Leaflet JS + WebSockets Real-Time GPS Tracking
- **Pass Verification**: 15s Rotating TOTP Dynamic QR Codes + Conductor Scanner

---

## 🚀 How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production
npm run build
```

---

## 📁 Directory Structure
- `src/components/`: React UI components (Student Dashboard, Driver Map Console, Admin HQ, Conductor Scanner, Digital Pass)
- `src/routes/`: TanStack Router pages (`/index`, `/app`, `/auth`, `/scanner`)
- `src/integrations/supabase/`: Supabase PostgreSQL & Auth Client
- `public/`: PWA Web App Manifest, Service Worker (`sw.js`), and high-res GSFC Transit App Logo
