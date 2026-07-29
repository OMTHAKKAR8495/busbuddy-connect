import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker paths for bundlers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const busIcon = L.divIcon({
  html: `<div style="background:oklch(0.78 0.16 75);border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.25);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;">🚌</div>`,
  className: "", iconSize: [34, 34], iconAnchor: [17, 17],
});

export type BusOnMap = { bus_id: string; label: string; lat: number; lng: number; heading?: number | null; speed?: number | null };
export type RouteOnMap = { polyline: [number, number][]; color?: string };
export type StopOnMap = { lat: number; lng: number; name: string };

export default function LiveMap({
  buses = [], routes = [], stops = [], center = [22.3236, 73.1631], zoom = 12, height = 420,
}: {
  buses?: BusOnMap[];
  routes?: RouteOnMap[];
  stops?: StopOnMap[];
  center?: [number, number];
  zoom?: number;
  height?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ height }} className="rounded-xl bg-muted animate-pulse" />;
  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isCustomGoogleKey = googleMapsKey && !googleMapsKey.includes("YourGoogleMapsApiKeyHere");

  const tileUrl = isCustomGoogleKey
    ? `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${googleMapsKey}`
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const tileAttribution = isCustomGoogleKey
    ? '&copy; <a href="https://maps.google.com">Google Maps</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  const safeRoutes = (routes || [])
    .map((r) => ({
      ...r,
      polyline: (r?.polyline || []).filter(
        (p) => Array.isArray(p) && p.length >= 2 && typeof p[0] === "number" && typeof p[1] === "number" && !isNaN(p[0]) && !isNaN(p[1])
      ),
    }))
    .filter((r) => r.polyline.length > 0);

  const safeBuses = (buses || []).filter(
    (b) => b && typeof b.lat === "number" && typeof b.lng === "number" && !isNaN(b.lat) && !isNaN(b.lng)
  );

  const safeStops = (stops || []).filter(
    (s) => s && typeof s.lat === "number" && typeof s.lng === "number" && !isNaN(s.lat) && !isNaN(s.lng)
  );

  const safeCenter: [number, number] = Array.isArray(center) && center.length >= 2 && typeof center[0] === "number" && typeof center[1] === "number"
    ? center
    : [22.3236, 73.1631];

  return (
    <div className="overflow-hidden rounded-xl border border-border" style={{ height }}>
      <MapContainer center={safeCenter} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer attribution={tileAttribution} url={tileUrl} />
        {safeRoutes.map((r, i) => (
          <Polyline key={i} positions={r.polyline} pathOptions={{ color: r.color ?? "#1e40af", weight: 4, opacity: 0.7 }} />
        ))}
        {safeStops.map((s, i) => (
          <CircleMarker key={i} center={[s.lat, s.lng]} radius={6} pathOptions={{ color: "#1e40af", fillColor: "#fff", fillOpacity: 1, weight: 2 }}>
            <Popup>{s.name}</Popup>
          </CircleMarker>
        ))}
        {safeBuses.map((b) => (
          <Marker key={b.bus_id || Math.random().toString()} position={[b.lat, b.lng]} icon={busIcon}>
            <Popup>
              <div className="font-medium">{b.label}</div>
              {b.speed != null && <div className="text-xs">Speed: {Math.round(b.speed)} km/h</div>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
