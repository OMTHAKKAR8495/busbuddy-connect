import { createFileRoute } from "@tanstack/react-router";
import ConductorScannerPage from "@/components/conductor-scanner";

export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "Conductor QR Bus Pass Scanner — GSFCU Transit" },
      { name: "description", content: "Scan and verify GSFC University student bus passes and identity cards." },
    ],
  }),
  component: ScannerRoute,
});

function ScannerRoute() {
  return <ConductorScannerPage />;
}
