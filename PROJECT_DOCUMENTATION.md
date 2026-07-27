# 🌲 GSFC UNIVERSITY
### EDUCATION RE-ENVISIONED
**Software Engineering Laboratory — GSFC University**

---

## Practical Report: Smart Campus Transit & Fleet Management System
- **Course**: Software Engineering Laboratory
- **Practical No.**: Final Software Project Evaluation
- **Selected Application**: GSFCU Transit (BusBuddy Connect)
- **Author**: Om Thakkar (Roll No: 24BT04171)
- **Department**: Computer Science & Engineering
- **Live Vercel Application**: [https://busbuddy-connect.vercel.app](https://busbuddy-connect.vercel.app)
- **GitHub Repository**: [https://github.com/OMTHAKKAR8495/busbuddy-connect.git](https://github.com/OMTHAKKAR8495/busbuddy-connect.git)

---

### (i) Define Requirements

A **requirement** is a documented statement of a capability, feature, function, or constraint that a system, product, or service must satisfy in order to solve a real-world problem or to meet the needs and expectations of its stakeholders. Requirements form the foundation of the entire software development life cycle (SDLC) — every design decision, coding activity, and test case is ultimately traceable back to a requirement.

Requirements are broadly classified into:
- **Functional Requirements (FR)**: Define specific behaviour, functions, or features of the system (what the system does).
- **Non-Functional Requirements (NFR)**: Define the quality attributes, constraints, operational characteristics, and security performance of the system (how well the system performs its functions).

---

### (ii) Methods of Gathering Requirements

| Method | Description |
| :--- | :--- |
| **1. Stakeholder Interviews** | One-to-one discussions with GSFCU Transport Office admins and student commuters to identify pain points with physical paper/plastic bus passes. |
| **2. Field Observation** | Observing gate conductors manually checking student IDs at campus entry gates to calculate queue delay times. |
| **3. Prototyping** | Building interactive React + Tailwind CSS mock-ups of the digital pass and live Leaflet bus tracking radar to gather immediate faculty feedback. |
| **4. Use Case Modeling** | Modeling step-by-step actor interactions for Students, Bus Drivers, and Transport HQ Admins. |

---

### (iii) Functional & Non-Functional Requirements

**Selected Application**: **GSFCU Transit (BusBuddy Connect)** — A smart campus mobility ecosystem for 13 official GSFC University bus routes, featuring live GPS bus tracking, anti-fraud 15-second dynamic TOTP QR passes, realtime conductor gate QR scanning via `jsQR`, and master admin fleet control.

#### A. Functional Requirements (FR)

| ID | Requirement Description |
| :--- | :--- |
| **FR-1** | The system shall allow students, drivers, and admins to authenticate securely via Supabase Auth and assign role-based access control. |
| **FR-2** | The system shall display 13 official GSFC University shuttle routes (Soma Talav, Sama Savli, Waghodia, Subhanpura, Gotri, etc.) with real-time Leaflet map markers. |
| **FR-3** | The system shall allow students to apply for semester bus passes and choose assigned pickup stops. |
| **FR-4** | The system shall generate an anti-fraud dynamic digital bus pass with a 15-second rotating QR token, student photo avatar, and Roll Number `24BT04171`. |
| **FR-5** | The system shall provide drivers with a shift control cockpit to broadcast real-time smartphone GPS coordinates to campus radar. |
| **FR-6** | The system shall provide gate conductors with a `jsQR` realtime phone camera scanner to verify student identity, semester fee status, and route validity. |
| **FR-7** | The system shall provide an Admin HQ dashboard to approve/reject pass applications, inspect QR tokens, manage routes, and dispatch emergency SOS alerts. |
| **FR-8** | The system shall provide a printable PDF pass and academic report generator for evaluation. |

#### B. Non-Functional Requirements (NFR)

| ID | Category | Requirement Description |
| :--- | :---: | :--- |
| **NFR-1** | **Performance** | The live bus tracking radar page shall render within 1.5 seconds under normal network load. |
| **NFR-2** | **Security** | Dynamic pass QR codes shall expire every 15 seconds to eliminate screenshot sharing and fraud. |
| **NFR-3** | **Usability** | The mobile interface shall feature a touch-optimized bottom navigation bar suitable for 375px–430px smartphone viewports. |
| **NFR-4** | **Availability** | The system shall maintain 99.9% uptime on Vercel Global Edge CDN infrastructure. |
| **NFR-5** | **Realtime Latency** | Driver GPS location stream updates shall broadcast to student maps in less than 2 seconds via WebSockets. |
| **NFR-6** | **Compatibility** | The conductor QR scanner shall support both rear smartphone cameras (`getUserMedia`) and gallery photo uploads. |

---

### (iv) Processes Covered under Functional & Non-Functional Requirements

| Process | Governed by | Description |
| :--- | :---: | :--- |
| **User Authentication & Role Assignment** | FR-1, NFR-3 | Secure onboarding of Students, Drivers, and Admins with role-based routing. |
| **Route & Stop Management** | FR-2, NFR-1 | Displaying 13 GSFCU routes and pickup stop schedules on interactive Leaflet maps. |
| **Digital Pass Generation & Verification** | FR-4, FR-6, NFR-2 | Generation of 15s rotating TOTP QR passes and gate conductor scanning via `jsQR`. |
| **Driver GPS Telemetry Broadcast** | FR-5, NFR-5 | Real-time smartphone location streaming from driver cockpit to fleet HQ. |
| **Admin Fleet HQ Operations** | FR-3, FR-7, NFR-4 | Pass approvals, fee payment verification, speed analytics, and emergency SOS alerts. |

---

### (v) Project Timeline, Execution Period & Cost Breakdown

#### A. Development Period (4-Week Sprint Schedule)
- **Total Development Time**: **4 Weeks (1 Month)**
- **Week 1 (Requirements & Route Seeding)**: Analysis of GSFC University bus routes (Routes R1 to R13), database schema design (PostgreSQL/MongoDB tables for buses, passes, profiles, stops, and alerts).
- **Week 2 (Realtime Radar & Telemetry)**: Building Leaflet map engine, driver shift control cockpit, and live location broadcast stream.
- **Week 3 (Digital Pass & Admin HQ)**: Developing student digital pass with 15s TOTP rotating QR code, student photo avatar, print modal, and Admin approval queue.
- **Week 4 (Conductor QR Scanner & Cloud Deploy)**: Integrating `jsQR` live phone camera decoder, mobile bottom navigation bar, role-based access matrix, and Vercel cloud deployment.

#### B. Commercial Cost Estimation & Budget Analysis

| Cost Category | Scope & Details | Commercial Estimate (INR) | Commercial Estimate (USD) |
| :--- | :--- | :---: | :---: |
| **UI/UX Design & Prototyping** | Glassmorphism responsive design system, mobile simulator | ₹25,000 | $300 USD |
| **Frontend Engineering** | React 19, TypeScript, Vite, TanStack Router, Leaflet Maps Engine | ₹75,000 | $900 USD |
| **Backend & Security** | Supabase PostgreSQL, Row Level Security (RLS), MongoDB | ₹50,000 | $600 USD |
| **QR Scanner Engine** | `jsQR` phone camera frame decoding loop, TOTP anti-fraud token engine | ₹30,000 | $360 USD |
| **QA & Cloud CI/CD** | Mobile viewport testing (375px–430px), Vercel cloud deployment | ₹20,000 | $240 USD |
| **TOTAL COMMERCIAL BUILD VALUE** | **Complete Production Campus Transit System** | **₹2,00,000 INR** | **$2,400 USD** |

#### C. Operational Cloud Infrastructure & Hardware Savings
- **Vercel Web Hosting**: **₹0 / Month** (Free Hobby CDN Tier)
- **Supabase PostgreSQL & Realtime**: **₹0 / Month** (Free Tier)
- **MongoDB Atlas Cluster**: **₹0 / Month** (Free Tier)
- **TOTAL MONTHLY OPERATIONAL COST**: **₹0 / Month**
- **HARDWARE COST SAVINGS**: **Saved ₹1,50,000 INR upfront** by utilizing Driver Smartphone GPS Telemetry instead of purchasing expensive external hardware tracker units for 13 buses!

---

### Conclusion

Through this project, requirements for the **GSFCU Transit System** were identified and classified into functional and non-functional categories. The system successfully replaces legacy static transit methods with a secure, real-time, anti-fraud campus mobility platform engineered for GSFC University.

**Software Engineering Laboratory — GSFC University**  
**Author**: Om Thakkar (Roll No: 24BT04171)  
**Page 1**
