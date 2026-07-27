import { createFileRoute } from "@tanstack/react-router";
import { Printer, Download, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "GSFC University Practical Evaluation Report — GSFCU Transit" },
      { name: "description", content: "Academic Software Engineering Practical 1 Report for GSFC University." },
    ],
  }),
  component: PracticalReportPage,
});

function PracticalReportPage() {
  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-4 sm:p-8 font-serif">
      {/* Top Action Bar for PDF Download */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-md border border-slate-300 print:hidden font-sans">
        <Link to="/app" className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to Application
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-slate-500">GSFC University Practical 1 Report</span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition active:scale-95"
          >
            <Download className="h-4 w-4" /> Download / Save as PDF
          </button>
        </div>
      </div>

      {/* Printable Practical Report Shell */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-300 space-y-6 text-sm leading-relaxed">
        {/* University Logo Header */}
        <div className="text-center border-b-2 border-indigo-950 pb-4 font-sans space-y-1">
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-950 tracking-wider">🌲 GSFC UNIVERSITY</div>
          <div className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest">EDUCATION RE-ENVISIONED</div>
          <div className="text-xs font-bold text-slate-600 mt-1">Software Engineering Laboratory — GSFC University</div>
        </div>

        {/* Practical Title */}
        <div className="bg-slate-50 border-2 border-indigo-950 p-4 rounded-lg text-center font-sans">
          <h1 className="text-lg sm:text-xl font-extrabold text-indigo-950">Practical 1 Evaluation Report</h1>
          <h2 className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
            Identifying Requirements & Implementing Smart Campus Transit System
          </h2>
        </div>

        {/* Metadata Table */}
        <table className="w-full border-collapse border border-slate-400 text-xs font-sans">
          <tbody>
            <tr>
              <td className="border border-slate-400 p-2 bg-slate-50"><strong>Course:</strong> Software Engineering Laboratory</td>
              <td className="border border-slate-400 p-2 bg-slate-50"><strong>Practical No.:</strong> 1</td>
            </tr>
            <tr>
              <td className="border border-slate-400 p-2"><strong>Selected Application:</strong> GSFCU Transit (BusBuddy Connect)</td>
              <td className="border border-slate-400 p-2"><strong>Topic:</strong> Requirement Analysis & Elicitation</td>
            </tr>
            <tr>
              <td className="border border-slate-400 p-2"><strong>Student Author:</strong> Om Thakkar (Roll No: 24BT04171)</td>
              <td className="border border-slate-400 p-2"><strong>Department:</strong> Computer Science & Engineering</td>
            </tr>
            <tr>
              <td className="border border-slate-400 p-2"><strong>Live Application URL:</strong> https://busbuddy-connect.vercel.app</td>
              <td className="border border-slate-400 p-2"><strong>GitHub Repository:</strong> https://github.com/OMTHAKKAR8495/busbuddy-connect.git</td>
            </tr>
          </tbody>
        </table>

        {/* Section i */}
        <div className="space-y-2">
          <div className="bg-indigo-950 text-white px-3 py-1.5 font-sans font-bold text-sm rounded">
            (i) Define Requirements
          </div>
          <p className="text-xs">
            A <strong>requirement</strong> is a documented statement of a capability, feature, function, or constraint that a system, product, or service must satisfy in order to solve a real-world problem or to meet the needs and expectations of its stakeholders. Requirements form the foundation of the entire software development life cycle (SDLC).
          </p>
          <ul className="list-disc pl-6 text-xs space-y-1">
            <li><strong>Functional Requirements (FR):</strong> Define specific behavior, functions, or features of the system (what the system does).</li>
            <li><strong>Non-Functional Requirements (NFR):</strong> Define quality attributes, performance, security, and constraints (how well the system performs its functions).</li>
          </ul>
        </div>

        {/* Section ii */}
        <div className="space-y-2">
          <div className="bg-indigo-950 text-white px-3 py-1.5 font-sans font-bold text-sm rounded">
            (ii) Methods of Gathering Requirements
          </div>
          <table className="w-full border-collapse border border-slate-400 text-xs font-sans">
            <thead>
              <tr className="bg-indigo-950 text-white">
                <th className="border border-slate-400 p-2 text-left w-1/3">Method</th>
                <th className="border border-slate-400 p-2 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-400 p-2 font-bold">1. Stakeholder Interviews</td>
                <td className="border border-slate-400 p-2">One-to-one discussions with GSFCU Transport Office admins and student commuters to understand pain points with physical paper bus passes.</td>
              </tr>
              <tr>
                <td className="border border-slate-400 p-2 font-bold">2. Observation</td>
                <td className="border border-slate-400 p-2">Watching conductors manually verify student passes at campus entry gates to calculate queue delays.</td>
              </tr>
              <tr>
                <td className="border border-slate-400 p-2 font-bold">3. Prototyping</td>
                <td className="border border-slate-400 p-2">Building interactive React mock-ups of the digital pass and live Leaflet bus tracking radar to refine requirements.</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section iii */}
        <div className="space-y-2">
          <div className="bg-indigo-950 text-white px-3 py-1.5 font-sans font-bold text-sm rounded">
            (iii) Functional & Non-Functional Requirements
          </div>

          <h3 className="font-sans font-bold text-xs text-indigo-950 uppercase mt-2">A. Functional Requirements (FR)</h3>
          <table className="w-full border-collapse border border-slate-400 text-xs font-sans">
            <thead>
              <tr className="bg-indigo-900 text-white">
                <th className="border border-slate-400 p-2 w-16">ID</th>
                <th className="border border-slate-400 p-2 text-left">Requirement Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-slate-400 p-2 font-bold text-center">FR-1</td><td className="border border-slate-400 p-2">The system shall allow users to log in with role-based access control (Student, Driver, Admin).</td></tr>
              <tr><td className="border border-slate-400 p-2 font-bold text-center">FR-2</td><td className="border border-slate-400 p-2">The system shall display 13 official GSFC University routes with real-time Leaflet map bus markers.</td></tr>
              <tr><td className="border border-slate-400 p-2 font-bold text-center">FR-3</td><td className="border border-slate-400 p-2">The system shall generate an anti-fraud dynamic digital pass with a 15-second rotating QR token, student photo, and Roll 24BT04171.</td></tr>
              <tr><td className="border border-slate-400 p-2 font-bold text-center">FR-4</td><td className="border border-slate-400 p-2">The system shall provide drivers with a shift cockpit to broadcast real-time smartphone GPS coordinates.</td></tr>
              <tr><td className="border border-slate-400 p-2 font-bold text-center">FR-5</td><td className="border border-slate-400 p-2">The system shall provide gate conductors with a <code>jsQR</code> realtime camera scanner to verify student identity.</td></tr>
              <tr><td className="border border-slate-400 p-2 font-bold text-center">FR-6</td><td className="border border-slate-400 p-2">The system shall provide an Admin HQ panel for pass approvals, fee verification, and emergency SOS alerts.</td></tr>
            </tbody>
          </table>

          <h3 className="font-sans font-bold text-xs text-indigo-950 uppercase mt-4">B. Non-Functional Requirements (NFR)</h3>
          <table className="w-full border-collapse border border-slate-400 text-xs font-sans">
            <thead>
              <tr className="bg-indigo-900 text-white">
                <th className="border border-slate-400 p-2 w-16">ID</th>
                <th className="border border-slate-400 p-2 w-28">Category</th>
                <th className="border border-slate-400 p-2 text-left">Requirement Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-slate-400 p-2 font-bold text-center">NFR-1</td><td className="border border-slate-400 p-2 font-semibold">Performance</td><td className="border border-slate-400 p-2">The bus tracking radar page shall render within 1.5 seconds under normal load.</td></tr>
              <tr><td className="border border-slate-400 p-2 font-bold text-center">NFR-2</td><td className="border border-slate-400 p-2 font-semibold">Security</td><td className="border border-slate-400 p-2">Dynamic pass QR tokens shall expire every 15 seconds to eliminate screenshot pass sharing.</td></tr>
              <tr><td className="border border-slate-400 p-2 font-bold text-center">NFR-3</td><td className="border border-slate-400 p-2 font-semibold">Usability</td><td className="border border-slate-400 p-2">The mobile interface shall feature a touch bottom bar suitable for 375px–430px smartphone viewports.</td></tr>
              <tr><td className="border border-slate-400 p-2 font-bold text-center">NFR-4</td><td className="border border-slate-400 p-2 font-semibold">Availability</td><td className="border border-slate-400 p-2">The application shall maintain 99.9% uptime on Vercel Global Edge CDN.</td></tr>
            </tbody>
          </table>
        </div>

        {/* Section iv */}
        <div className="space-y-2">
          <div className="bg-indigo-950 text-white px-3 py-1.5 font-sans font-bold text-sm rounded">
            (iv) Project Execution Timeline & Commercial Budget Analysis
          </div>
          <table className="w-full border-collapse border border-slate-400 text-xs font-sans">
            <thead>
              <tr className="bg-indigo-900 text-white">
                <th className="border border-slate-400 p-2">Phase</th>
                <th className="border border-slate-400 p-2 text-left">Deliverables</th>
                <th className="border border-slate-400 p-2 text-left">Commercial Estimate</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-slate-400 p-2 font-bold">Week 1</td><td className="border border-slate-400 p-2">Requirement Gathering, 13 Routes Seeding & PostgreSQL Schemas</td><td className="border border-slate-400 p-2">₹25,000 ($300 USD)</td></tr>
              <tr><td className="border border-slate-400 p-2 font-bold">Week 2</td><td className="border border-slate-400 p-2">Realtime Leaflet Map Radar & Driver Telemetry GPS Broadcast</td><td className="border border-slate-400 p-2">₹75,000 ($900 USD)</td></tr>
              <tr><td className="border border-slate-400 p-2 font-bold">Week 3</td><td className="border border-slate-400 p-2">15s Rotating TOTP Digital Pass, Photo Avatar & Admin HQ Queue</td><td className="border border-slate-400 p-2">₹50,000 ($600 USD)</td></tr>
              <tr><td className="border border-slate-400 p-2 font-bold">Week 4</td><td className="border border-slate-400 p-2"><code>jsQR</code> Phone Camera Scanner, Mobile UI & Vercel Cloud Deploy</td><td className="border border-slate-400 p-2">₹50,000 ($600 USD)</td></tr>
              <tr className="bg-slate-100 font-bold"><td colSpan={2} className="border border-slate-400 p-2 text-right">Total Commercial Build Valuation:</td><td className="border border-slate-400 p-2 text-emerald-700">₹2,00,000 ($2,400 USD)</td></tr>
            </tbody>
          </table>
          <p className="text-[11px] text-slate-500 font-sans mt-1">
            *Monthly Cloud Infrastructure Cost: <strong>₹0 / Month</strong> (Vercel + Supabase + MongoDB Free Tiers). Hardware savings of ₹1,50,000 achieved by using Driver Smartphone Telemetry instead of external GPS trackers.
          </p>
        </div>

        {/* Footer Signature Box */}
        <div className="pt-8 border-t border-slate-300 flex justify-between items-end font-sans text-xs">
          <div>
            <div className="font-bold text-slate-700">Software Engineering Laboratory</div>
            <div className="text-slate-500">GSFC University, Vadodara</div>
          </div>
          <div className="text-right">
            <div className="border-b border-slate-900 pb-1 font-bold">Om Thakkar (24BT04171)</div>
            <div className="text-slate-500 mt-1">Student Author Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
}
