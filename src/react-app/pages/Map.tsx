import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import DashboardLayout from "@/react-app/components/layout/DashboardLayout";
import MarkerWithStatus from "@/react-app/components/map/MarkerWithStatus";
import { useIoT } from "@/react-app/hooks/useIoT";
import { IoTDeviceData } from "@/react-app/types/iot";
import { AlertCircle, MapPin, Activity } from "lucide-react";

// Fix for Leaflet icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Gorakhpur coordinates (center of demo data)
const GORAKHPUR_CENTER: [number, number] = [26.15, 83.18];
const INITIAL_ZOOM = 14;

/**
 * MapUpdater Component
 * Handles real-time map updates without full re-renders
 */
function MapUpdater({ devices }: { devices: IoTDeviceData[] }) {
  const map = useMap();

  useEffect(() => {
    if (devices.length === 0) return;

    // Calculate bounds to fit all markers
    const bounds = L.latLngBounds(
      devices.map((device) => [device.lat, device.lng] as [number, number])
    );

    // Add padding to bounds
    try {
      map.fitBounds(bounds, { padding: [50, 50] });
    } catch (error) {
      console.warn("[Map] Could not fit bounds:", error);
    }
  }, [devices, map]);

  return null;
}

/**
 * Smart City Live Map Page
 * Displays real-time IoT dustbin markers on an interactive map
 * Features:
 * - Live marker updates from IoT service
 * - Color-coded markers (green/yellow/red based on fill level)
 * - Pulsing animation for critical bins (>80% fill)
 * - Tooltips with device information
 * - Real-time synchronization with simulated device data
 */
export default function MapPage() {
  const [devices, setDevices] = useState<IoTDeviceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceStats, setDeviceStats] = useState({
    total: 0,
    online: 0,
    critical: 0,
  });

  const { getDevices, subscribeToDeviceUpdates } = useIoT();

  // Initialize map with devices
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsLoading(true);

        // Get initial devices
        const initialDevices = getDevices();
        setDevices(initialDevices);
        updateStats(initialDevices);

        // Subscribe to real-time updates
        const unsubscribe = subscribeToDeviceUpdates((updatedDevices) => {
          setDevices(updatedDevices);
          updateStats(updatedDevices);
        });

        setIsLoading(false);

        return unsubscribe;
      } catch (error) {
        console.error("[Map] Failed to initialize:", error);
        setIsLoading(false);
      }
    };

    const unsubscribe = initializeMap();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [getDevices, subscribeToDeviceUpdates]);

  // Update device statistics
  const updateStats = (deviceList: IoTDeviceData[]) => {
    const stats = {
      total: deviceList.length,
      online: deviceList.filter((d) => d.status === "online").length,
      critical: deviceList.filter((d) => d.fillLevel > 80).length,
    };
    setDeviceStats(stats);
  };

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Smart City Live Map</h1>
                <p className="text-sm text-muted-foreground">
                  Real-time monitoring of waste management bins in Gorakhpur
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-6 pt-4 pb-2 flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">
              Total Bins: <span className="text-primary font-bold">{deviceStats.total}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
            <Activity className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">
              Online: <span className="text-green-600 font-bold">{deviceStats.online}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium">
              Critical: <span className="text-red-600 font-bold">{deviceStats.critical}</span>
            </span>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative overflow-hidden">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-card/50">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Loading live map...</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={GORAKHPUR_CENTER}
              zoom={INITIAL_ZOOM}
              style={{ width: "100%", height: "100%" }}
              zoomControl={true}
              scrollWheelZoom={true}
              className="relative"
            >
              {/* OpenStreetMap Tile Layer */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Map bounds updater */}
              <MapUpdater devices={devices} />

              {/* Render markers for all devices */}
              {devices.map((device) => (
                <MarkerWithStatus key={device.deviceId} device={device} />
              ))}
            </MapContainer>
          )}
        </div>

        {/* Footer Info */}
        <div className="border-t border-border bg-card px-6 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Low (&lt;40%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Medium (40-80%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span>Critical (&gt;80%)</span>
              </div>
            </div>
            <span>Updates every 3-5 seconds • Center: Gorakhpur, India</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
