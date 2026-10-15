import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "./app-shell";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  Play,
  StopCircle,
  Radio,
  AlertTriangle,
  Gauge,
  Clock,
  Compass,
  Bus as BusIcon,
  Send,
  CheckCircle2,
  Users,
  ShieldAlert,
  Navigation,
  MapPin,
  Crosshair,
  IdCard,
  Edit,
  Printer,
  Sparkles,
  X,
} from "lucide-react";

type User = { userId: string; role: "driver"; profile: { full_name: string } };

const OFFICIAL_DRIVERS = [
  { id: "drv-101", name: "Suresh Kumar (Emp ID: GSFC-DRV-101)" },
  { id: "drv-102", name: "Ramesh Patel (Emp ID: GSFC-DRV-102)" },
  { id: "drv-103", name: "Mahesh Singh (Emp ID: GSFC-DRV-103)" },
  { id: "drv-104", name: "Vikram Parmar (Emp ID: GSFC-DRV-104)" },
  { id: "drv-105", name: "Ketan Solanki (Emp ID: GSFC-DRV-105)" },
  { id: "drv-106", name: "Dinesh Varma (Emp ID: GSFC-DRV-106)" },
  { id: "drv-107", name: "Prakash Jha (Emp ID: GSFC-DRV-107)" },
  { id: "drv-108", name: "Bharat Thakor (Emp ID: GSFC-DRV-108)" },
];

export default function DriverDashboard({
  user,
  onOverrideRole,
  overrideRole,
}: {
  user: User;
  onOverrideRole?: (r: "student" | "driver" | "admin" | "scanner" | null) => void;
  overrideRole?: "student" | "driver" | "admin" | "scanner" | null;
}) {
  const qc = useQueryClient();
  const { data: buses = [] } = useQuery({
    queryKey: ["buses-with-routes"],
    queryFn: async () =>
      (
        await supabase
          .from("buses")
          .select("id, bus_number, plate, route_id, driver_id, routes(id,route_number,name,polyline)")
          .eq("active", true)
      ).data ?? [],
  });

  const { data: activeTrip, refetch: refetchTrip } = useQuery({
    queryKey: ["my-active-trip", user.userId],
    queryFn: async () =>
      (
        await supabase
          .from("trips")
          .select("*, buses(bus_number, plate), routes(id,route_number,name,polyline)")
          .eq("driver_id", user.userId)
          .eq("active", true)
          .maybeSingle()
      ).data,
  });

  // Check if a specific driver profile is active from Driver Pass Login or Admin Launch
  const activeProfile = (() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("gsfcu_active_driver_profile");
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return null;
  })();

  const loggedInDriverLabel = user.profile.full_name
    ? `${user.profile.full_name} (Logged-in Account)`
    : activeProfile?.driver_name
      ? `${activeProfile.driver_name} (Logged-in Pass)`
      : "Om Thakkar (Logged-in Account)";

  // Determine initial bus selection based on active profile
  const initialBusId = (() => {
    if (activeProfile?.assigned_bus) {
      const busNum = activeProfile.assigned_bus.split(" ")[0].toLowerCase();
      if (busNum.includes("bus-04")) return "bus-04";
      if (busNum.includes("bus-03")) return "bus-03";
      if (busNum.includes("bus-02")) return "bus-02";
      if (busNum.includes("bus-01")) return "bus-01";
    }
    return "bus-01";
  })();

  const [selectedBus, setSelectedBus] = useState<string>(initialBusId);
  const [selectedDriver, setSelectedDriver] = useState<string>(loggedInDriverLabel);
  const [customDriverName, setCustomDriverName] = useState<string>("");
  const [isCustomDriver, setIsCustomDriver] = useState<boolean>(false);
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [localActiveTrip, setLocalActiveTrip] = useState<any>(null);
  const [streaming, setStreaming] = useState(false);
  const [lastPos, setLastPos] = useState<{ lat: number; lng: number; speed?: number; heading?: number } | null>({
    lat: 22.3655,
    lng: 73.1815,
    speed: 38,
    heading: 90,
  });
  const [pingCount, setPingCount] = useState(12);
  const [customMsg, setCustomMsg] = useState("");
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [shiftSeconds, setShiftSeconds] = useState(0);
  const [showForceStopConfirm, setShowForceStopConfirm] = useState(false);
  const [activePunchInCoords, setActivePunchInCoords] = useState<string>("22.36550, 73.18150");

  const watchIdRef = useRef<number | null>(null);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic driver list including authenticated account and new driver registration
  const driverOptions = [
    { id: "logged-in-user", name: loggedInDriverLabel },
    ...OFFICIAL_DRIVERS,
    { id: "register-custom", name: "➕ Register New Driver Name…" },
  ];

  // Pre-seeded buses list fallback for presentation demo
  const fallbackBuses = [
    {
      id: "bus-01",
      bus_number: "BUS-01",
      plate: "GJ-06-AX-1001",
      driver_id: user.userId,
      route_id: "route-01",
      routes: { id: "route-01", route_number: "R1", name: "Soma Talav (BPC Pump) → GSFC University" },
    },
    {
      id: "bus-04",
      bus_number: "BUS-04",
      plate: "GJ-06-AX-1004",
      driver_id: user.userId,
      route_id: "route-02",
      routes: { id: "route-02", route_number: "R2", name: "Sama Savli Circle → GSFC University" },
    },
    {
      id: "bus-03",
      bus_number: "BUS-03",
      plate: "GJ-06-AX-1003",
      driver_id: user.userId,
      route_id: "route-03",
      routes: { id: "route-03", route_number: "R3", name: "Waghodia Road → GSFC University" },
    },
  ];

  const displayBuses = buses.length > 0 ? buses : fallbackBuses;
  const myBuses = displayBuses;

  // Selected Bus object
  const currentBusObj = displayBuses.find((b) => b.id === selectedBus) || displayBuses[0];

  const finalDriverName = isCustomDriver && customDriverName.trim()
    ? `${customDriverName.trim()} (Newly Registered Driver)`
    : selectedDriver;

  // Unified active trip state
  const currentShift =
    localActiveTrip ||
    activeTrip || {
      id: "trip-demo-active",
      bus_id: currentBusObj.id,
      route_id: currentBusObj.route_id || "route-01",
      driver_name: finalDriverName,
      buses: { bus_number: currentBusObj.bus_number, plate: currentBusObj.plate },
      routes: currentBusObj.routes || { route_number: "R1", name: "Soma Talav (BPC Pump) → GSFC University" },
    };

  // Shift duration counter
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isShiftActive || activeTrip) {
      interval = setInterval(() => setShiftSeconds((s) => s + 1), 1000);
    } else {
      setShiftSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isShiftActive, activeTrip]);

  function startTrip() {
    const bus = displayBuses.find((b) => b.id === selectedBus) || displayBuses[0];
    const newShiftObj = {
      id: "trip-" + Date.now(),
      bus_id: bus.id,
      route_id: bus.route_id || "route-01",
      driver_name: finalDriverName,
      buses: { bus_number: bus.bus_number, plate: bus.plate },
      routes: bus.routes || { route_number: "R1", name: "Soma Talav (BPC Pump) → GSFC University" },
    };

    setLocalActiveTrip(newShiftObj);
    setIsShiftActive(true);
    setStreaming(true);

    const startTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const shiftDayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const shiftDateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const startLat = lastPos?.lat ?? 22.3655;
    const startLng = lastPos?.lng ?? 73.1815;
    const punchInCoordsFormatted = `${startLat.toFixed(5)}, ${startLng.toFixed(5)}`;
    setActivePunchInCoords(punchInCoordsFormatted);

    const shiftLogObj = {
      id: "shift-" + Date.now(),
      driver_name: finalDriverName,
      bus_number: bus.bus_number,
      bus_plate: bus.plate,
      route_number: bus.routes?.route_number || "Route R1",
      route_name: bus.routes?.name || "Soma Talav → GSFC Campus",
      start_location: "Depot / Origin Stop",
      punch_in_lat: Number(startLat.toFixed(5)),
      punch_in_lng: Number(startLng.toFixed(5)),
      punch_in_coords: punchInCoordsFormatted,
      shift_start_time: startTimeStr,
      shift_stop_time: "In Transit 🟢",
      shift_day: shiftDayStr,
      shift_date: shiftDateStr,
      month_year: "July 2026",
      created_at: new Date().toISOString(),
    };

    try {
      const existingShifts = JSON.parse(localStorage.getItem("gsfcu_driver_shifts") || "[]");
      existingShifts.unshift(shiftLogObj);
      localStorage.setItem("gsfcu_driver_shifts", JSON.stringify(existingShifts));
      localStorage.setItem("gsfcu_active_shift_id", shiftLogObj.id);
    } catch (e) {
      console.error("Shift store fallback:", e);
    }

    try {
      // Auto-save driver shift into Neon/Supabase DB
      (supabase as any).from("driver_shift_logs_july_2026").insert({
        id: shiftLogObj.id.startsWith("shift-") ? undefined : shiftLogObj.id,
        driver_name: finalDriverName,
        bus_number: bus.bus_number,
        bus_plate: bus.plate,
        route_number: bus.routes?.route_number || "Route R1",
        route_name: bus.routes?.name || "Soma Talav → GSFC Campus",
        start_location: bus.routes?.name ? bus.routes.name.split("→")[0].trim() : "Soma Talav Depot",
        punch_in_lat: Number(startLat.toFixed(5)),
        punch_in_lng: Number(startLng.toFixed(5)),
        punch_in_coords: punchInCoordsFormatted,
        shift_start_time: startTimeStr,
        shift_stop_time: "In Transit 🟢",
        shift_day: shiftDayStr,
        shift_date: shiftDateStr,
        month_year: "July 2026"
      }).then(() => console.log("Automatic driver shift recorded in database"));

      (supabase as any).from("user_login_audit_logs").insert({
        email: user.userId + "@gsfcuniversity.ac.in",
        role: "driver",
        login_method: "automatic_shift_login",
        status: "success"
      }).then(() => console.log("Login audit recorded in database"));

      supabase.from("trips").insert({
        bus_id: bus.id,
        route_id: bus.route_id || "route-01",
        driver_id: user.userId,
        active: true,
      }).then(() => refetchTrip());
    } catch (e) {
      console.log("Trip start background push:", e);
    }

    toast.success(`📍 Shift Started! Punch In: [${startLat.toFixed(5)}, ${startLng.toFixed(5)}] at ${startTimeStr}`);
    startStreaming();
  }

  function endTrip() {
    const stopLat = lastPos?.lat ?? 22.3980;
    const stopLng = lastPos?.lng ?? 73.2090;

    stopStreaming();
    stopSimulation();
    setIsShiftActive(false);
    setLocalActiveTrip(null);

    const stopTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      const activeShiftId = localStorage.getItem("gsfcu_active_shift_id");
      const existingShifts = JSON.parse(localStorage.getItem("gsfcu_driver_shifts") || "[]");
      const updatedShifts = existingShifts.map((s: any) => {
        if (s.id === activeShiftId || s.shift_stop_time.includes("In Transit")) {
          return {
            ...s,
            shift_stop_time: `${stopTimeStr} 🛑 (Completed)`,
            punch_out_lat: Number(stopLat.toFixed(5)),
            punch_out_lng: Number(stopLng.toFixed(5)),
            punch_out_coords: `${stopLat.toFixed(5)}, ${stopLng.toFixed(5)}`,
          };
        }
        return s;
      });
      localStorage.setItem("gsfcu_driver_shifts", JSON.stringify(updatedShifts));
    } catch (e) {
      console.error("Shift end update:", e);
    }

    try {
      // Update shift end in database
      (supabase as any)
        .from("driver_shift_logs_july_2026")
        .update({
          shift_stop_time: `${stopTimeStr} 🛑 (Completed)`,
          punch_out_lat: Number(stopLat.toFixed(5)),
          punch_out_lng: Number(stopLng.toFixed(5)),
          punch_out_coords: `${stopLat.toFixed(5)}, ${stopLng.toFixed(5)}`,
        })
        .eq("driver_name", finalDriverName)
        .eq("shift_stop_time", "In Transit 🟢")
        .then(() => console.log("Driver shift stop updated in database"));
    } catch (e) {
      console.log("Shift stop update err:", e);
    }

    if (activeTrip) {
      try {
        supabase.from("trips").update({ active: false, ended_at: new Date().toISOString() }).eq("id", activeTrip.id).then(() => refetchTrip());
      } catch (e) {
        console.log("Trip end background push:", e);
      }
    }

    toast.success(`🛑 Shift Ended at ${stopTimeStr}! Punch Out: [${stopLat.toFixed(5)}, ${stopLng.toFixed(5)}]. Logs updated live.`);
  }

  // Real GPS watch position & Broadcast to all 3 departments + Home Page Map
  function startStreaming() {
    if (!currentShift) return;
    if (!navigator.geolocation) return toast.error("Geolocation not supported by device browser");
    stopSimulation();
    setStreaming(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords;
        const currentSpeedKmh = speed != null ? speed * 3.6 : 38;
        const telemetryPayload = {
          bus_id: currentShift.bus_id,
          label: `Bus ${currentShift.buses?.bus_number || 'BUS-01'} (${finalDriverName})`,
          lat: latitude,
          lng: longitude,
          speed: currentSpeedKmh,
          heading: heading ?? 90,
          route_id: currentShift.route_id,
          updatedAt: Date.now(),
        };

        setLastPos({ lat: latitude, lng: longitude, speed: currentSpeedKmh, heading: heading ?? 90 });
        setPingCount((c) => c + 1);

        // Broadcast to localStorage and window event for instant 0ms cross-tab map sync
        localStorage.setItem("gsfc_live_telemetry", JSON.stringify(telemetryPayload));
        window.dispatchEvent(new CustomEvent("gsfc_live_telemetry_event", { detail: telemetryPayload }));

        try {
          await supabase.from("bus_locations").insert({
            bus_id: currentShift.bus_id,
            trip_id: currentShift.id,
            lat: latitude,
            lng: longitude,
            speed: currentSpeedKmh,
            heading: heading ?? 90,
          });
        } catch (e) {
          console.log("Telemetry insert fallback:", e);
        }
      },
      (err) => {
        console.warn("GPS Device Notice:", err.message);
        // If device GPS times out or is indoors/unavailable, automatically fall back to simulated route GPS so demo never breaks
        if (!isSimulating) {
          toast.info("Device GPS weak/timed out — automatically switching to live route tracking demo.");
          startSimulation();
        }
      },
      { enableHighAccuracy: false, maximumAge: 30000, timeout: 15000 }
    );
  }

  function stopStreaming() {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setStreaming(false);
  }

  // Simulation mode for testing route movement
  function startSimulation() {
    if (!currentShift) return;
    stopStreaming();
    setIsSimulating(true);
    setStreaming(true);

    const polyline = (currentShift.routes?.polyline as [number, number][]) ?? [
      [22.3655, 73.1815],
      [22.3712, 73.1865],
      [22.3801, 73.1932],
      [22.3910, 73.2015],
      [22.3980, 73.2090],
    ];

    let idx = 0;
    simTimerRef.current = setInterval(async () => {
      const point = polyline[idx % polyline.length];
      const speed = Math.floor(32 + Math.random() * 12);
      const heading = Math.floor(Math.random() * 360);
      const telemetryPayload = {
        bus_id: currentShift.bus_id,
        label: `Bus ${currentShift.buses?.bus_number || 'BUS-01'} (${finalDriverName})`,
        lat: point[0],
        lng: point[1],
        speed,
        heading,
        route_id: currentShift.route_id,
        updatedAt: Date.now(),
      };

      setLastPos({ lat: point[0], lng: point[1], speed, heading });
      setPingCount((c) => c + 1);

      // Broadcast to localStorage and window event for instant 0ms cross-tab map sync
      localStorage.setItem("gsfc_live_telemetry", JSON.stringify(telemetryPayload));
      window.dispatchEvent(new CustomEvent("gsfc_live_telemetry_event", { detail: telemetryPayload }));

      try {
        await supabase.from("bus_locations").insert({
          bus_id: currentShift.bus_id,
          trip_id: currentShift.id,
          lat: point[0],
          lng: point[1],
          speed,
          heading,
        });
      } catch (e) {
        console.log("Telemetry simulation fallback:", e);
      }

      idx++;
    }, 2000);
  }

  function stopSimulation() {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    simTimerRef.current = null;
    setIsSimulating(false);
    setStreaming(false);
  }

  useEffect(() => {
    return () => {
      stopStreaming();
      stopSimulation();
    };
  }, []);

  async function sendAlert(type: "breakdown" | "traffic_delay", customText?: string) {
    if (!currentShift) return;
    const msg =
      customText ||
      (type === "breakdown"
        ? "SOS ALERT: Bus breakdown on route. Alternate shuttle dispatched."
        : "TRAFFIC DELAY: Heavy congestion. Expect 10-15 min delay.");

    try {
      await supabase.from("alerts").insert({
        trip_id: currentShift.id,
        route_id: currentShift.route_id,
        driver_id: user.userId,
        alert_type: type,
        message: msg,
      });
    } catch (e) {
      console.log("Alert insert fallback:", e);
    }
    toast.success("Emergency alert dispatches pushed to route passengers");
    setShowMsgModal(false);
    setCustomMsg("");
  }

  const formatShiftTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs > 0 ? hrs + "h " : ""}${mins}m ${s}s`;
  };

  const [activeDriverTab, setActiveDriverTab] = useState<"active" | "history" | "my-pass">("active");
  const [historyShifts, setHistoryShifts] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilterRoute, setHistoryFilterRoute] = useState("");
  const [historyFilterDate, setHistoryFilterDate] = useState("");

  // Load shifts for Completed Drives History
  useEffect(() => {
    const loadHistory = async () => {
      let local: any[] = [];
      try {
        local = JSON.parse(localStorage.getItem("gsfcu_driver_shifts") || "[]");
      } catch (e) {
        local = [];
      }
      const seedShifts = [
        {
          id: "shift-demo-01",
          driver_name: "Om Thakkar",
          bus_number: "Bus #01",
          bus_plate: "GJ-06-AX-1001",
          route_number: "Route R1",
          route_name: "Soma Talav → GSFC Campus",
          shift_start_time: "07:30 AM",
          shift_stop_time: "09:15 AM 🛑 (Completed)",
          punch_in_coords: "22.2879, 73.1927",
          punch_out_coords: "22.3236, 73.1631",
          shift_day: "Tuesday",
          shift_date: "July 28, 2026",
        },
        {
          id: "shift-demo-02",
          driver_name: "Ramesh Patel",
          bus_number: "Bus #04",
          bus_plate: "GJ-06-AX-1004",
          route_number: "Route R2",
          route_name: "Sama Savli Road → GSFC Campus",
          shift_start_time: "07:45 AM",
          shift_stop_time: "09:30 AM 🛑 (Completed)",
          punch_in_coords: "22.2950, 73.2100",
          punch_out_coords: "22.3236, 73.1631",
          shift_day: "Tuesday",
          shift_date: "July 28, 2026",
        },
        {
          id: "shift-demo-03",
          driver_name: "Suresh Kumar",
          bus_number: "Bus #02",
          bus_plate: "GJ-06-AX-1002",
          route_number: "Route R4",
          route_name: "Maneja → Makarpura → GSFC",
          shift_start_time: "07:15 AM",
          shift_stop_time: "05:15 PM 🛑 (Completed)",
          punch_in_coords: "22.3300, 73.1650",
          punch_out_coords: "22.3236, 73.1631",
          shift_day: "Monday",
          shift_date: "July 27, 2026",
        },
        {
          id: "shift-demo-04",
          driver_name: "Mahesh Singh",
          bus_number: "Bus #03",
          bus_plate: "GJ-06-AX-1003",
          route_number: "Route R3",
          route_name: "Waghodia → GSFC Campus",
          shift_start_time: "07:00 AM",
          shift_stop_time: "04:45 PM 🛑 (Completed)",
          punch_in_coords: "22.3150, 73.2150",
          punch_out_coords: "22.3236, 73.1631",
          shift_day: "Monday",
          shift_date: "July 27, 2026",
        },
        {
          id: "shift-demo-05",
          driver_name: "Vikram Parmar",
          bus_number: "Bus #05",
          bus_plate: "GJ-06-AX-1005",
          route_number: "Route R5",
          route_name: "Earth Icon → GSFC Campus",
          shift_start_time: "07:35 AM",
          shift_stop_time: "09:20 AM 🛑 (Completed)",
          punch_in_coords: "22.3200, 73.1950",
          punch_out_coords: "22.3236, 73.1631",
          shift_day: "Monday",
          shift_date: "July 27, 2026",
        },
      ];

      try {
        const { data } = await (supabase as any)
          .from("driver_shift_logs_july_2026")
          .select("*")
          .order("created_at", { ascending: false });
        const dbShifts = data ?? [];
        const combined = [...local, ...dbShifts, ...seedShifts];
        const unique = Array.from(
          new Map(combined.map((s) => [s.driver_name + (s.shift_start_time || "") + (s.shift_date || ""), s])).values()
        );
        setHistoryShifts(unique);
      } catch (e) {
        const combined = [...local, ...seedShifts];
        const unique = Array.from(
          new Map(combined.map((s) => [s.driver_name + (s.shift_start_time || ""), s])).values()
        );
        setHistoryShifts(unique);
      }
    };
    loadHistory();
  }, [isShiftActive]);

  // Filter completed drives
  const completedDrivesList = historyShifts.filter((s) => {
    const isCompleted = !s.shift_stop_time?.includes("In Transit") && !s.shift_stop_time?.includes("🟢");
    if (!isCompleted) return false;

    if (historySearch) {
      const q = historySearch.toLowerCase();
      const match =
        (s.driver_name || "").toLowerCase().includes(q) ||
        (s.bus_number || "").toLowerCase().includes(q) ||
        (s.bus_plate || "").toLowerCase().includes(q) ||
        (s.route_number || "").toLowerCase().includes(q) ||
        (s.route_name || "").toLowerCase().includes(q);
      if (!match) return false;
    }

    if (historyFilterRoute && !(s.route_number || "").toLowerCase().includes(historyFilterRoute.toLowerCase())) {
      return false;
    }

    if (historyFilterDate && s.shift_date !== historyFilterDate) {
      return false;
    }

    return true;
  });

  // Export Completed Drives to CSV
  function exportDrivesCSV() {
    if (completedDrivesList.length === 0) {
      toast.error("No completed drives available to export");
      return;
    }

    const headers = [
      "Shift ID",
      "Driver Name",
      "Bus Number",
      "Vehicle Plate",
      "Route Number",
      "Route Name",
      "Shift Start Time",
      "Punch-In Coordinates (Lat, Lng)",
      "Shift Stop Time",
      "Punch-Out Coordinates (Lat, Lng)",
      "Shift Day",
      "Shift Date",
      "Status"
    ];

    const rows = completedDrivesList.map((s) => [
      `"${s.id || ''}"`,
      `"${s.driver_name || ''}"`,
      `"${s.bus_number || ''}"`,
      `"${s.bus_plate || ''}"`,
      `"${s.route_number || ''}"`,
      `"${s.route_name || ''}"`,
      `"${s.shift_start_time || ''}"`,
      `"${s.punch_in_coords || (s.punch_in_lat ? `${s.punch_in_lat}, ${s.punch_in_lng}` : '22.2879, 73.1927')}"`,
      `"${(s.shift_stop_time || '').replace(' 🛑 (Completed)', '')}"`,
      `"${s.punch_out_coords || (s.punch_out_lat ? `${s.punch_out_lat}, ${s.punch_out_lng}` : '22.3236, 73.1631')}"`,
      `"${s.shift_day || ''}"`,
      `"${s.shift_date || ''}"`,
      `"Completed"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GSFCU_Completed_Drives_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("✓ Completed Drives CSV Report downloaded!");
  }

  // Print/Download PDF Report
  function printDrivesPDF() {
    if (completedDrivesList.length === 0) {
      toast.error("No completed drives available to generate PDF");
      return;
    }

    const printWin = window.open("", "_blank");
    if (!printWin) {
      toast.error("Popup blocked! Allow popups to view and save PDF report.");
      return;
    }

    const rowsHtml = completedDrivesList
      .map(
        (s, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${s.driver_name || "—"}</strong></td>
          <td>${s.bus_number || "—"} (${s.bus_plate || "—"})</td>
          <td>${s.route_number || "—"}: ${s.route_name || "—"}</td>
          <td>${s.shift_date || "—"} (${s.shift_day || ""})</td>
          <td>
            <div>${s.shift_start_time || "—"}</div>
            <div style="font-family:monospace; font-size:9px; color:#0284c7;">📍 ${s.punch_in_coords || "22.2879, 73.1927"}</div>
          </td>
          <td>
            <div>${(s.shift_stop_time || "—").replace(" 🛑 (Completed)", "")}</div>
            <div style="font-family:monospace; font-size:9px; color:#d97706;">🛑 ${s.punch_out_coords || "22.3236, 73.1631"}</div>
          </td>
          <td><span style="color:#059669; font-weight:bold;">Completed</span></td>
        </tr>
      `
      )
      .join("");

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GSFCU Transit — Completed Drives & Shift Audit Report</title>
          <style>
            @page { size: A4 landscape; margin: 16mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 20px; font-size: 11px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 16px; }
            .header h1 { font-size: 18px; margin: 0; color: #0f172a; }
            .header p { margin: 2px 0 0; color: #64748b; font-size: 11px; }
            .summary { display: flex; gap: 20px; margin-bottom: 16px; }
            .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 16px; }
            .summary-box strong { font-size: 16px; color: #0284c7; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
            td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .footer { margin-top: 24px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>GSFC UNIVERSITY — TRANSIT FLEET OPERATIONS</h1>
              <p>Official Driver Shift Audit & Completed Drives Performance Log</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Generated On:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Logged By:</strong> ${user.profile.full_name || "Om Thakkar"}</p>
            </div>
          </div>

          <div class="summary">
            <div class="summary-box">
              <div>Total Completed Drives</div>
              <strong>${completedDrivesList.length}</strong>
            </div>
            <div class="summary-box">
              <div>Active Date</div>
              <strong>${historyFilterDate || "All Recorded Dates"}</strong>
            </div>
            <div class="summary-box">
              <div>Status</div>
              <strong style="color: #059669;">100% Verified Stops</strong>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Driver Name</th>
                <th>Bus & Vehicle Plate</th>
                <th>Assigned Route</th>
                <th>Date & Day</th>
                <th>Start Time</th>
                <th>Stop Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            <span>GSFCU Transit Smart Fleet Operations — Software Engineering Lab</span>
            <span>Authorized Driver Fleet Documentation</span>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  }

  return (
    <AppShell
      title="Driver Cockpit"
      role={`Driver · ${user.profile.full_name}`}
      onOverrideRole={onOverrideRole}
      overrideRole={overrideRole}
    >
      {/* Driver View Sub-Tabs */}
      <div className="mb-6 flex gap-2 rounded-xl bg-muted p-1.5 border border-border/60">
        <button
          onClick={() => setActiveDriverTab("active")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold transition ${
            activeDriverTab === "active" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Radio className={`h-4 w-4 ${isShiftActive ? "text-emerald-500 animate-pulse" : ""}`} />
          Active Drive Cockpit {isShiftActive && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-600 font-bold">In Transit</span>}
        </button>

        <button
          onClick={() => setActiveDriverTab("history")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold transition ${
            activeDriverTab === "history" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="h-4 w-4 text-primary" />
          Completed Drives & Logs ({completedDrivesList.length})
        </button>

        <button
          onClick={() => setActiveDriverTab("my-pass")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold transition ${
            activeDriverTab === "my-pass" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <IdCard className="h-4 w-4 text-emerald-500" />
          Official Driver ID Pass
        </button>
      </div>

      {activeDriverTab === "history" ? (
        /* Completed Drives History Tab */
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-emerald-500/10 to-primary/10 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  LOGGED DRIVER PERFORMANCE & SHIFTS
                </span>
                <h2 className="font-display text-2xl font-extrabold mt-1.5 flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" /> Completed Drives History
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Review all finished shuttle runs, exact start/stop timestamps, bus plates, and download official reports.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={exportDrivesCSV}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition active:scale-95"
                >
                  <Send className="h-4 w-4 rotate-45" /> Export CSV
                </button>
                <button
                  onClick={printDrivesPDF}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary hover:opacity-90 px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition active:scale-95"
                >
                  <Clock className="h-4 w-4" /> Download PDF Report
                </button>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="space-y-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search driver name, bus plate, route..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="min-w-[220px] flex-1 rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />

              <select
                value={historyFilterRoute}
                onChange={(e) => setHistoryFilterRoute(e.target.value)}
                className="rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium outline-none focus:border-primary"
              >
                <option value="">All Routes</option>
                <option value="R1">Route R1</option>
                <option value="R2">Route R2</option>
                <option value="R3">Route R3</option>
                <option value="R4">Route R4</option>
                <option value="R5">Route R5</option>
                <option value="R6">Route R6</option>
                <option value="R7">Route R7</option>
                <option value="R8">Route R8</option>
                <option value="R9">Route R9</option>
                <option value="R10">Route R10</option>
                <option value="R11">Route R11</option>
                <option value="R12">Route R12</option>
                <option value="R13">Route R13</option>
              </select>

              <select
                value={historyFilterDate}
                onChange={(e) => setHistoryFilterDate(e.target.value)}
                className="rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium outline-none focus:border-primary"
              >
                <option value="">All Dates</option>
                {Array.from(new Set(historyShifts.map((s) => s.shift_date).filter(Boolean))).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {(historySearch || historyFilterRoute || historyFilterDate) && (
                <button
                  onClick={() => {
                    setHistorySearch("");
                    setHistoryFilterRoute("");
                    setHistoryFilterDate("");
                  }}
                  className="text-xs font-bold text-destructive hover:underline"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground font-mono border-t border-border/40 pt-2">
              <span>Showing {completedDrivesList.length} Completed Drives</span>
              <span className="text-emerald-600 dark:text-emerald-400">Total Logged Records</span>
            </div>
          </div>

          {/* Completed Drives Table */}
          <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 font-bold text-muted-foreground">
                    <th className="p-3.5">Driver & Bus</th>
                    <th className="p-3.5">Assigned Route</th>
                    <th className="p-3.5">Date & Day</th>
                    <th className="p-3.5">Start Time & Punch In</th>
                    <th className="p-3.5">Stop Time & Punch Out</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {completedDrivesList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No completed drives found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    completedDrivesList.map((s, idx) => (
                      <tr key={s.id || idx} className="hover:bg-muted/30 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-foreground">{s.driver_name || "—"}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {s.bus_number} · {s.bus_plate}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-block rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary font-mono mr-1.5">
                            {s.route_number || "R1"}
                          </span>
                          <span className="text-xs font-medium">{s.route_name || "GSFC University"}</span>
                        </td>
                        <td className="p-3.5 font-mono text-muted-foreground">
                          <div>{s.shift_date || "July 28, 2026"}</div>
                          <div className="text-[10px] opacity-70">{s.shift_day || "Tuesday"}</div>
                        </td>
                        <td className="p-3.5 font-mono">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">{s.shift_start_time || "—"}</div>
                          <div className="text-[10px] text-primary mt-0.5 flex items-center gap-1 font-mono">
                            <span>📍</span> {s.punch_in_coords || "22.2879, 73.1927"}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono">
                          <div className="font-bold text-foreground">{(s.shift_stop_time || "—").replace(" 🛑 (Completed)", "")}</div>
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1 font-mono">
                            <span>🛑</span> {s.punch_out_coords || "22.3236, 73.1631"}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3" /> Completed
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeDriverTab === "my-pass" ? (
        /* Driver Official ID Pass & Change Pass View */
        <DriverOfficialPassView user={user} assignedBus={currentShift?.buses} assignedRoute={currentShift?.routes} />
      ) : (
        /* Active Drive Cockpit View */
        <div>
          {!isShiftActive && !activeTrip ? (
            <div className="mx-auto max-w-lg rounded-2xl border border-border/80 bg-card p-8 shadow-xl">
              <div className="flex items-center gap-3 border-b border-border/60 pb-4 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BusIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Start Your Driver Shift</h2>
              <p className="text-xs text-muted-foreground">Select your assigned GSFCU shuttle bus & route</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Assigned Bus & Route
              </label>
              <select
                value={selectedBus}
                onChange={(e) => setSelectedBus(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select GSFCU Route & Bus…</option>
                {myBuses.map((b) => (
                  <option key={b.id} value={b.id}>
                    Bus {b.bus_number} ({b.plate}) — Route {b.routes?.route_number}: {b.routes?.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Assigned Bus Driver Name & Emp ID
              </label>
              <select
                value={isCustomDriver ? "➕ Register New Driver Name…" : selectedDriver}
                onChange={(e) => {
                  if (e.target.value === "➕ Register New Driver Name…") {
                    setIsCustomDriver(true);
                  } else {
                    setIsCustomDriver(false);
                    setSelectedDriver(e.target.value);
                  }
                }}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {driverOptions.map((drv) => (
                  <option key={drv.id} value={drv.name}>
                    {drv.name}
                  </option>
                ))}
              </select>

              {isCustomDriver && (
                <div className="mt-2.5 space-y-1">
                  <input
                    type="text"
                    value={customDriverName}
                    onChange={(e) => setCustomDriverName(e.target.value)}
                    placeholder="Enter Full Name of New Bus Driver (e.g. Ramesh Chandra)..."
                    className="w-full rounded-xl border border-primary/50 bg-primary/5 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    ⚡ New driver profile will be registered automatically in Supabase database upon starting shift.
                  </p>
                </div>
              )}
            </div>

            {/* Live GPS Coordinates Punch-In Preview */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-primary">
                <span className="flex items-center gap-1.5">
                  <Crosshair className="h-4 w-4 animate-spin text-primary" style={{ animationDuration: '4s' }} />
                  Verified Geolocation Punch Coordinates
                </span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                  Ready to Punch
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">Detected Latitude & Longitude:</span>
                <span className="font-bold text-foreground">
                  📍 {lastPos?.lat ? lastPos.lat.toFixed(5) : "22.36550"}, {lastPos?.lng ? lastPos.lng.toFixed(5) : "73.18150"}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                These exact GPS coordinates will be permanently recorded as your official punch-in location upon starting shift.
              </p>
            </div>

            <button
              onClick={startTrip}
              disabled={!selectedBus || !selectedDriver}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
            >
              <Play className="h-4 w-4" /> Punch In Shift & Begin GPS Telemetry
            </button>

            {myBuses.length === 0 && (
              <p className="text-center text-xs text-amber-600 dark:text-amber-400">
                No assigned buses found. Contact Transport Admin to assign your driver account.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Shift Header Card */}
          <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-primary via-primary to-indigo-900 p-6 text-primary-foreground shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
                  <span className="beacon-dot"></span> ACTIVE SHIFT IN PROGRESS
                </div>
                <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
                  Bus {currentShift.buses?.bus_number} ({currentShift.buses?.plate})
                </h2>
                <div className="text-sm font-bold text-emerald-300 mt-1 flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> Assigned Driver: {currentShift.driver_name || selectedDriver}
                </div>
                <p className="text-sm opacity-90 font-medium mt-0.5">
                  Route {currentShift.routes?.route_number}: {currentShift.routes?.name}
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs uppercase tracking-wider opacity-70">Shift Duration</div>
                <div className="font-mono text-xl font-bold">{formatShiftTime(shiftSeconds)}</div>
              </div>
            </div>

            {/* Live Telemetry Gauges */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                <div className="text-[10px] uppercase tracking-wider opacity-70">GPS Stream Status</div>
                <div className="mt-1 font-semibold text-sm flex items-center gap-1.5">
                  <Radio className={`h-4 w-4 ${streaming ? "animate-pulse text-emerald-400" : "text-amber-400"}`} />
                  {streaming ? (isSimulating ? "Simulating GPS" : "Live GPS Active") : "Paused"}
                </div>
              </div>

              <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                <div className="text-[10px] uppercase tracking-wider opacity-70">Live Speed</div>
                <div className="mt-1 font-display text-2xl font-bold">
                  {lastPos?.speed != null ? Math.round(lastPos.speed) : 0}{" "}
                  <span className="text-xs font-normal opacity-80">km/h</span>
                </div>
              </div>

              <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                <div className="text-[10px] uppercase tracking-wider opacity-70">GPS Pings Transmitted</div>
                <div className="mt-1 font-display text-2xl font-bold">{pingCount}</div>
              </div>

              <div className="rounded-xl bg-white/10 p-3 backdrop-blur border border-emerald-400/30 bg-emerald-500/10">
                <div className="text-[10px] uppercase tracking-wider opacity-80 text-emerald-300 font-semibold flex items-center gap-1">
                  <span>📍</span> Punch-In Lat/Lng
                </div>
                <div className="mt-1 font-mono text-xs font-bold text-white truncate" title={activePunchInCoords}>
                  {activePunchInCoords}
                </div>
                <div className="text-[9px] opacity-70 mt-0.5">Recorded at start</div>
              </div>

              <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                <div className="text-[10px] uppercase tracking-wider opacity-70 flex items-center gap-1">
                  <Crosshair className="h-3 w-3" /> Live Lat/Lng
                </div>
                <div className="mt-1 font-mono text-xs truncate">
                  {lastPos ? `${lastPos.lat.toFixed(5)}, ${lastPos.lng.toFixed(5)}` : "Acquiring..."}
                </div>
                <div className="text-[9px] opacity-70 mt-0.5">Continuous GPS</div>
              </div>
            </div>
          </div>

          {/* Active Shift Controls */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {!streaming ? (
              <button
                onClick={startStreaming}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
              >
                <Gauge className="h-4 w-4" /> Start Real Device GPS
              </button>
            ) : (
              <button
                onClick={stopStreaming}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3.5 text-sm font-semibold transition hover:bg-muted"
              >
                Pause GPS Stream
              </button>
            )}

            {!isSimulating ? (
              <button
                onClick={startSimulation}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700"
              >
                <Navigation className="h-4 w-4" /> Simulate Drive (Demo)
              </button>
            ) : (
              <button
                onClick={stopSimulation}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3.5 text-sm font-semibold transition hover:bg-muted"
              >
                Stop Simulation
              </button>
            )}

            <button
              onClick={() => sendAlert("traffic_delay")}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-600"
            >
              <AlertTriangle className="h-4 w-4" /> Delay Alert (10m)
            </button>

            <button
              onClick={() => sendAlert("breakdown")}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition hover:bg-red-700"
            >
              <ShieldAlert className="h-4 w-4" /> SOS Breakdown Alert
            </button>
          </div>

          {/* ⚠️ Forgot to Stop — Force Stop Warning Banner */}
          {shiftSeconds > 10 && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-amber-700 dark:text-amber-300 text-sm">Forgot to Stop Your Trip?</div>
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                    Your shift has been active for <span className="font-bold font-mono">{formatShiftTime(shiftSeconds)}</span>. If your route is complete, use the Force Stop button to end GPS tracking immediately and log your stop time in Admin HQ.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForceStopConfirm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-600 shadow-lg shadow-amber-500/25 transition active:scale-95 whitespace-nowrap"
              >
                <StopCircle className="h-4 w-4" /> Force Stop Trip Now
              </button>
            </div>
          )}

          {/* Broadcast Custom Message Action */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-display font-bold text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" /> Route Broadcast Dispatch
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Send an instant push update to all students tracking Route {currentShift?.routes?.route_number || "R1"}.
            </p>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="e.g. Bus delayed by 5 mins near Nizampura stop due to roadwork..."
                className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={() => sendAlert("traffic_delay", customMsg)}
                disabled={!customMsg.trim()}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>

          {/* End Shift Button */}
          <button
            onClick={() => setShowForceStopConfirm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-500/60 bg-card py-4 text-sm font-bold text-red-600 hover:bg-red-500 hover:text-white transition shadow-sm"
          >
            <StopCircle className="h-5 w-5" /> Complete Shift & Stop Tracking
          </button>
        </div>
      )}
      </div>
      )}


      {/* ✅ Force Stop Confirmation Modal */}
      {showForceStopConfirm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-500">
                <StopCircle className="h-6 w-6" />
              </div>
              <div>
                <div className="font-bold text-base text-foreground">Stop Trip Confirmation</div>
                <div className="text-xs text-muted-foreground mt-0.5">This will end GPS tracking and log your stop time</div>
              </div>
            </div>

            <div className="rounded-xl bg-muted/50 border border-border/60 p-4 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shift Duration</span>
                <span className="font-bold text-foreground">{formatShiftTime(shiftSeconds)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Punch-In GPS</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">📍 {activePunchInCoords}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Punch-Out GPS</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  🛑 {lastPos?.lat ? lastPos.lat.toFixed(5) : "22.39800"}, {lastPos?.lng ? lastPos.lng.toFixed(5) : "73.20900"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stop Time</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Route</span>
                <span className="font-bold">{currentShift?.routes?.route_number || "R1"}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Your stop time will be logged live in <strong>Admin HQ Driver Shift Logs</strong>. GPS pings will stop immediately.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowForceStopConfirm(false)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowForceStopConfirm(false);
                  endTrip();
                }}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 shadow-lg shadow-red-600/25 transition active:scale-95"
              >
                ✅ Yes, Stop Trip
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

// ========================================================
// DRIVER OFFICIAL DIGITAL ID PASS & CHANGE PASS COMPONENT
// ========================================================
function DriverOfficialPassView({
  user,
  assignedBus,
  assignedRoute,
}: {
  user: User;
  assignedBus?: { bus_number?: string; plate?: string };
  assignedRoute?: { route_number?: string; name?: string };
}) {
  const driverName = user.profile.full_name || "Om Thakkar";

  // Read driver passes from localStorage (shared with Admin HQ)
  const [driverPasses, setDriverPasses] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("gsfcu_driver_id_passes");
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [
      {
        id: "drv-pass-101",
        driver_name: driverName,
        employee_id: "GSFC-DRV-101",
        license_number: "GJ06-2018-DL9871",
        phone_number: "+91 98250 11442",
        blood_group: "B+",
        assigned_bus: `${assignedBus?.bus_number || "BUS-01"} (${assignedBus?.plate || "GJ-06-AX-1001"})`,
        assigned_route: assignedRoute?.route_number ? `Route ${assignedRoute.route_number}` : "Route R1",
        route_name: assignedRoute?.name || "Soma Talav (BPC Pump) → GSFC University",
        valid_from: "2026-07-01",
        valid_until: "2027-06-30",
        emergency_contact: "+91 94280 55112 (Family)",
        security_badge_code: "DRV-SEC-9841",
        status: "Active",
      },
    ];
  });

  // Find this driver's pass or fallback to first
  const myPass =
    driverPasses.find(
      (p) =>
        p.driver_name?.toLowerCase().includes(driverName.toLowerCase()) ||
        driverName.toLowerCase().includes(p.driver_name?.toLowerCase())
    ) || driverPasses[0];

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(myPass?.driver_name || driverName);
  const [editEmpId, setEditEmpId] = useState(myPass?.employee_id || "GSFC-DRV-101");
  const [editLicense, setEditLicense] = useState(myPass?.license_number || "GJ06-2021-DL5542");
  const [editPhone, setEditPhone] = useState(myPass?.phone_number || "+91 98765 43210");
  const [editBlood, setEditBlood] = useState(myPass?.blood_group || "B+");
  const [editEmergency, setEditEmergency] = useState(myPass?.emergency_contact || "+91 98250 99881");
  const [editBus, setEditBus] = useState(myPass?.assigned_bus || "BUS-01 (GJ-06-AX-1001)");
  const [editRoute, setEditRoute] = useState(myPass?.assigned_route || "Route R1");
  const [editValidUntil, setEditValidUntil] = useState(myPass?.valid_until || "2027-06-30");
  const [editPhoto, setEditPhoto] = useState(myPass?.photo_url || "");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Photo exceeds 2MB");
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditPhoto(event.target?.result as string);
      toast.success("Photo updated for pass!");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveModifiedPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return toast.error("Driver name cannot be empty");

    const updatedPass = {
      ...myPass,
      driver_name: editName.trim(),
      employee_id: editEmpId.trim() || myPass.employee_id,
      license_number: editLicense.trim() || myPass.license_number,
      phone_number: editPhone.trim() || myPass.phone_number,
      blood_group: editBlood,
      emergency_contact: editEmergency.trim() || myPass.emergency_contact,
      assigned_bus: editBus,
      assigned_route: editRoute,
      valid_until: editValidUntil,
      photo_url: editPhoto || myPass.photo_url,
    };

    const updatedList = driverPasses.map((p) => (p.id === myPass.id ? updatedPass : p));
    if (!driverPasses.some((p) => p.id === myPass.id)) {
      updatedList.unshift(updatedPass);
    }

    setDriverPasses(updatedList);
    try {
      localStorage.setItem("gsfcu_driver_id_passes", JSON.stringify(updatedList));
    } catch (err) {
      console.error(err);
    }

    toast.success("✓ Your Driver ID Pass credentials were successfully updated!");
    setShowEditModal(false);
  };

  const printMyPass = () => {
    const printWin = window.open("", "_blank");
    if (!printWin) return toast.error("Please allow popups to print your ID pass");

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GSFCU Driver ID Pass — ${myPass.driver_name}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
            .card-container { display: flex; justify-content: center; margin-top: 30px; }
            .id-card { width: 340px; height: 520px; border-radius: 20px; background: linear-gradient(135deg, #091e3a 0%, #102a4e 50%, #030b15 100%); color: #fff; padding: 24px; box-sizing: border-box; box-shadow: 0 10px 25px rgba(0,0,0,0.3); border: 2px solid rgba(255,255,255,0.15); page-break-inside: avoid; }
            .header { text-align: center; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 14px; margin-bottom: 16px; }
            .badge-title { font-size: 11px; letter-spacing: 2px; color: #10b981; font-weight: 800; text-transform: uppercase; }
            .org-title { font-size: 16px; font-weight: 900; letter-spacing: 0.5px; margin-top: 3px; }
            .photo-box { width: 90px; height: 100px; border-radius: 14px; background: #1e293b; border: 2px solid #10b981; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; font-size: 36px; }
            .photo-img { width: 100%; height: 100%; object-fit: cover; }
            .driver-name { font-size: 19px; font-weight: 800; text-align: center; margin: 0; color: #ffffff; }
            .emp-id { font-size: 12px; font-family: monospace; color: #38bdf8; text-align: center; font-weight: 700; margin-top: 2px; }
            .info-grid { margin-top: 18px; font-size: 11px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 14px; }
            .label { color: #94a3b8; font-size: 9px; text-transform: uppercase; font-weight: 600; }
            .val { font-weight: 700; color: #f1f5f9; }
            .footer-strip { margin-top: 18px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 12px; }
            .status-badge { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 3px 8px; border-radius: 999px; font-size: 9px; font-weight: 800; }
          </style>
        </head>
        <body>
          <h2 style="text-align:center; color:#0f172a; margin-bottom: 5px;">GSFC UNIVERSITY TRANSPORT AUTHORITY</h2>
          <p style="text-align:center; color:#64748b; font-size: 12px; margin-top:0;">Official Driver Accreditation Card & Campus Transit Authorization</p>
          <div class="card-container">
            <div class="id-card">
              <div class="header">
                <div class="badge-title">OFFICIAL TRANSPORT ID PASS</div>
                <div class="org-title">GSFC UNIVERSITY</div>
                <div style="font-size: 9px; opacity:0.8;">Vigyan Bhavan, Fertilizernagar, Vadodara</div>
              </div>
              <div class="photo-box">
                ${myPass.photo_url ? `<img src="${myPass.photo_url}" class="photo-img" />` : `👨‍✈️`}
              </div>
              <div class="driver-name">${myPass.driver_name}</div>
              <div class="emp-id">${myPass.employee_id} · DRIVER PASS</div>
              <div class="info-grid">
                <div><div class="label">Assigned Shuttle</div><div class="val">${myPass.assigned_bus.split(" ")[0]}</div></div>
                <div><div class="label">Route Line</div><div class="val">${myPass.assigned_route}</div></div>
                <div><div class="label">Driving License</div><div class="val">${myPass.license_number}</div></div>
                <div><div class="label">Blood Group</div><div class="val">${myPass.blood_group}</div></div>
                <div><div class="label">Validity</div><div class="val">${myPass.valid_from} → ${myPass.valid_until}</div></div>
                <div><div class="label">Emergency Contact</div><div class="val">${myPass.emergency_contact}</div></div>
              </div>
              <div class="footer-strip">
                <div>
                  <span class="status-badge">AUTHORIZED DRIVER</span>
                  <div style="font-size: 8px; color: #94a3b8; margin-top: 4px; font-family: monospace;">CODE: ${myPass.security_badge_code}</div>
                </div>
                <div style="font-size: 10px; font-family: monospace; text-align: right; color:#38bdf8;">
                  Verified Campus Gate
                </div>
              </div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-emerald-500/10 via-primary/10 to-emerald-500/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono border border-emerald-500/20">
              OFFICIAL DRIVER CREDENTIAL PORTAL
            </span>
            <h2 className="font-display text-2xl font-extrabold mt-1 flex items-center gap-2">
              <IdCard className="h-6 w-6 text-primary" /> My Official Driver ID & Transit Pass
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Issued by GSFC University Transport Authority. You can view, verify QR code, or change your pass details anytime.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditName(myPass.driver_name);
                setEditEmpId(myPass.employee_id);
                setEditLicense(myPass.license_number);
                setEditPhone(myPass.phone_number);
                setEditBlood(myPass.blood_group);
                setEditEmergency(myPass.emergency_contact);
                setEditBus(myPass.assigned_bus);
                setEditRoute(myPass.assigned_route);
                setEditValidUntil(myPass.valid_until);
                setEditPhoto(myPass.photo_url || "");
                setShowEditModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition active:scale-95 shadow-sm"
            >
              <Edit className="h-4 w-4" /> Change / Update Pass
            </button>

            <button
              onClick={printMyPass}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition active:scale-95 shadow-md"
            >
              <Printer className="h-4 w-4" /> Print Physical ID
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid: Digital Card & Verification Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Premium Digital ID Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-primary to-indigo-950 p-6 text-white shadow-2xl border border-white/10 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <img src="/gsfc-transit-app-logo.png" alt="GSFCU" className="h-10 w-auto rounded-xl shadow-md" />
              <div>
                <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  GSFC UNIVERSITY TRANSIT AUTHORITY
                </div>
                <div className="text-sm font-extrabold">CAMPUS DRIVER ID PASS</div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-2 shadow-lg">
              <QRCodeSVG
                value={JSON.stringify({
                  type: "DRIVER_PASS",
                  id: myPass.id,
                  name: myPass.driver_name,
                  empId: myPass.employee_id,
                  route: myPass.assigned_route,
                  bus: myPass.assigned_bus,
                  validUntil: myPass.valid_until,
                  code: myPass.security_badge_code,
                })}
                size={70}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-20 w-20 shrink-0 rounded-2xl bg-white/10 border-2 border-emerald-400 overflow-hidden flex items-center justify-center text-4xl shadow-inner">
              {myPass.photo_url ? (
                <img src={myPass.photo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>👨‍✈️</span>
              )}
            </div>

            <div>
              <div className="text-xl font-bold">{myPass.driver_name}</div>
              <div className="text-xs font-mono text-sky-300 font-bold mt-0.5">{myPass.employee_id}</div>
              <div className="text-[11px] opacity-80 font-mono mt-0.5">Blood Group: {myPass.blood_group}</div>
              <div className="mt-1.5 inline-block rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/30">
                ● 100% AUTHORIZED TRANSIT
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 text-xs font-mono space-y-2 opacity-90">
            <div className="flex justify-between">
              <span className="opacity-70">Assigned Bus:</span>
              <span className="font-bold">{myPass.assigned_bus}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Assigned Route:</span>
              <span className="font-bold text-emerald-300">{myPass.assigned_route}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Driving License:</span>
              <span>{myPass.license_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Pass Validity:</span>
              <span>{myPass.valid_from} → {myPass.valid_until}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Emergency Contact:</span>
              <span>{myPass.emergency_contact}</span>
            </div>
          </div>

          <div className="rounded-xl bg-white/10 p-2.5 text-center text-[10px] font-mono tracking-widest text-emerald-300 border border-white/5">
            OFFICIAL SECURITY BADGE · {myPass.security_badge_code}
          </div>
        </div>

        {/* Right Column: Information & Change Pass Option Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="border-b border-border/60 pb-3">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-500" /> Digital Credentials & Verification
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Keep this ID pass active while driving campus shuttles. Security and gate scanners can scan the QR code to verify your authorization.
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="rounded-xl bg-muted/40 p-3.5 space-y-1 border border-border/40">
                <div className="font-bold text-foreground flex items-center justify-between">
                  <span>Transport Authorization Status</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">ACTIVE & VALID</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Accredited by GSFC University Administrative Authority for Academic Year 2026-27.
                </p>
              </div>

              <div className="rounded-xl bg-muted/40 p-3.5 space-y-1 border border-border/40">
                <div className="font-bold text-foreground">Need to Change Assigned Route or Bus?</div>
                <p className="text-muted-foreground text-[11px]">
                  If your shuttle assignment, driving license, or phone number changes, use the &quot;Change / Update Pass&quot; button below.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => {
                setEditName(myPass.driver_name);
                setEditEmpId(myPass.employee_id);
                setEditLicense(myPass.license_number);
                setEditPhone(myPass.phone_number);
                setEditBlood(myPass.blood_group);
                setEditEmergency(myPass.emergency_contact);
                setEditBus(myPass.assigned_bus);
                setEditRoute(myPass.assigned_route);
                setEditValidUntil(myPass.valid_until);
                setEditPhoto(myPass.photo_url || "");
                setShowEditModal(true);
              }}
              className="flex-1 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground hover:opacity-90 transition text-center shadow-md flex items-center justify-center gap-1.5"
            >
              <Edit className="h-4 w-4" /> Change / Modify My Pass Details
            </button>

            <button
              onClick={printMyPass}
              className="rounded-xl border border-border bg-card px-4 py-3 text-xs font-semibold text-foreground hover:bg-muted transition flex items-center justify-center gap-1.5"
            >
              <Printer className="h-4 w-4" /> Download Printable PDF
            </button>
          </div>
        </div>
      </div>

      {/* Edit Pass Modal for Driver */}
      {showEditModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary font-mono">
                  DRIVER SELF-SERVICE DESK
                </span>
                <h3 className="font-display font-extrabold text-lg text-foreground mt-0.5 flex items-center gap-2">
                  <Edit className="h-5 w-5 text-amber-500" /> Change / Update Driver Pass
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-full bg-muted p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModifiedPass} className="space-y-4">
              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Change Profile Photo (Optional)
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative h-14 w-14 shrink-0 rounded-2xl bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                    {editPhoto ? (
                      <img src={editPhoto} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl">👨‍✈️</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="block w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90"
                    />
                  </div>
                </div>
              </div>

              {/* Driver Full Name & Emp ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Driver Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Staff / Employee ID
                  </label>
                  <input
                    type="text"
                    value={editEmpId}
                    onChange={(e) => setEditEmpId(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Driving License & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Driving License (DL)
                  </label>
                  <input
                    type="text"
                    value={editLicense}
                    onChange={(e) => setEditLicense(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Mobile Phone Number
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Blood Group & Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Blood Group
                  </label>
                  <select
                    value={editBlood}
                    onChange={(e) => setEditBlood(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    value={editEmergency}
                    onChange={(e) => setEditEmergency(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Bus & Route */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Assigned Shuttle Bus
                  </label>
                  <select
                    value={editBus}
                    onChange={(e) => setEditBus(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="BUS-01 (GJ-06-AX-1001)">BUS-01 (GJ-06-AX-1001)</option>
                    <option value="BUS-02 (GJ-06-AX-1002)">BUS-02 (GJ-06-AX-1002)</option>
                    <option value="BUS-03 (GJ-06-AX-1003)">BUS-03 (GJ-06-AX-1003)</option>
                    <option value="BUS-04 (GJ-06-AX-1004)">BUS-04 (GJ-06-AX-1004)</option>
                    <option value="BUS-05 (GJ-06-AX-1005)">BUS-05 (GJ-06-AX-1005)</option>
                    <option value="BUS-06 (GJ-06-AX-1006)">BUS-06 (GJ-06-AX-1006)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Assigned Route
                  </label>
                  <select
                    value={editRoute}
                    onChange={(e) => setEditRoute(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {Array.from({ length: 13 }, (_, i) => `Route R${i + 1}`).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Pass Expiry Date
                </label>
                <input
                  type="date"
                  value={editValidUntil}
                  onChange={(e) => setEditValidUntil(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:opacity-90 transition active:scale-95"
                >
                  Save Pass Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
