import { useMemo, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Icon, LatLngExpression } from "leaflet";
import { useAuth } from "@/react-app/context/AuthContext";
import { useData } from "@/react-app/context/DataContext";
import { getFillStatus } from "@/react-app/types";
import { fetchSimulatedData } from "@/services/iotService";
import { useIoTStream } from "@/react-app/hooks/useIoTStream";
import DashboardLayout from "@/react-app/components/layout/DashboardLayout";
import DeviceStatusPanel from "@/react-app/components/DeviceStatusPanel";
import { MapPin, AlertTriangle } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue in react-leaflet
import L from "leaflet";
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom colored markers with pulsing animation for critical bins
function createColoredIcon(color: string, isPulsing: boolean): Icon {
  const svg = `
    <svg width="32" height="48" viewBox="0 0 32 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.164 0 0 7.164 0 16c0 16 16 32 16 32s16-16 16-32C32 7.164 24.836 0 16 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="#fff" opacity="0.9"/>
      ${isPulsing ? '<circle cx="16" cy="16" r="12" fill="none" stroke="' + color + '" stroke-width="2" opacity="0.6"><animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/></circle>' : ''}
    </svg>
  `;
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  return new Icon({
    iconUrl: url,
    iconSize: [32, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -48],
  });
}

// Center map on bounds
function MapBounds({ liveBins }: { liveBins: any[] }) {
  const map = useMap();
  const { postcodes } = useData();
  const defaultCoords = useMemo(() => {
    const coords = new Map<string, { lat: number; lng: number }>();
    liveBins.forEach((b) => coords.set(b.deviceId, { lat: b.lat, lng: b.lng }));
    return coords;
  }, [liveBins]);

  useEffect(() => {
    const binsWithCoords = postcodes.flatMap((p) =>
      p.dustbins
        .map((d) => {
          const live = liveBins.find((b) => b.deviceId === d.id);
          const fallback = defaultCoords.get(d.id);
          const lat = d.lat ?? live?.lat ?? fallback?.lat;
          const lng = d.lng ?? live?.lng ?? fallback?.lng;
          return lat && lng ? { ...d, area: p.area, pin: p.pin, lat, lng } : null;
        })
        .filter((d): d is NonNullable<typeof d> => d !== null)
    );

    if (binsWithCoords.length > 0) {
      const bounds = binsWithCoords.map((b) => [b.lat!, b.lng!] as [number, number]);
      if (bounds.length === 1) {
        map.setView(bounds[0], 15);
      } else {
        map.fitBounds(bounds as [[number, number], [number, number]], { padding: [50, 50] });
      }
    } else {
      // Default to Gorakhpur center
      map.setView([26.7606, 83.3732], 13);
    }
  }, [map, postcodes, liveBins, defaultCoords]);

  return null;
}

export default function MapPage() {
  const { user } = useAuth();
  const { postcodes } = useData();
  const { liveBins } = useIoTStream();
  const [defaultCoords, setDefaultCoords] = useState<Map<string, { lat: number; lng: number }>>(new Map());

  // Load default coords from iot_stream if needed
  useEffect(() => {
    fetchSimulatedData().then((devices) => {
      const coords = new Map<string, { lat: number; lng: number }>();
      devices.forEach((d) => coords.set(d.deviceId, { lat: d.lat, lng: d.lng }));
      setDefaultCoords(coords);
    });
  }, []);

  // Filter postcodes for regular users
  const filteredPostcodes = useMemo(() => {
    if (user?.role === "admin" || !user?.pin) return postcodes;
    return postcodes.filter((p) => p.pin === user?.pin);
  }, [postcodes, user]);

  // Get all dustbins with coordinates
  const binsWithCoords = useMemo(() => {
    return filteredPostcodes.flatMap((p) =>
      p.dustbins
        .map((d) => {
          const live = liveBins.find((b) => b.deviceId === d.id);
          const fallback = defaultCoords.get(d.id);
          const lat = d.lat ?? live?.lat ?? fallback?.lat;
          const lng = d.lng ?? live?.lng ?? fallback?.lng;
          if (!lat || !lng) return null;
          const fillLevel = live?.fillLevel ?? d.fillLevel;
          const battery = live?.battery ?? d.battery;
          const status = live?.status ?? d.status ?? "online";
          return {
            ...d,
            area: p.area,
            pin: p.pin,
            lat,
            lng,
            fillLevel,
            battery,
            status,
          };
        })
        .filter((d): d is NonNullable<typeof d> => d !== null)
    );
  }, [filteredPostcodes, liveBins, defaultCoords]);

  // Default center: Gorakhpur
  const center: LatLngExpression = [26.7606, 83.3732];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Command Center style header */}
        <div className="command-panel p-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h1 className="text-xl font-bold text-foreground uppercase tracking-wider font-mono">
              Live Map Tracking
            </h1>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-2 ml-5">
            Real-time dustbin locations • Green &lt;40% • Yellow 40–80% • Red &gt;80% • Pulsing = critical
          </p>
        </div>

        {/* Map + Status Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map */}
          <div className="lg:col-span-3 h-[600px] rounded-2xl overflow-hidden glass border border-border">
            <MapContainer
              center={center}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapBounds liveBins={liveBins} />
              {binsWithCoords.map((bin) => {
                const fillStatus = getFillStatus(bin.fillLevel);
                const isCritical = fillStatus === "high";
                const color =
                  fillStatus === "low" ? "#22c55e" : fillStatus === "medium" ? "#eab308" : "#ef4444";
                const markerIcon = createColoredIcon(color, isCritical);

                return (
                  <Marker
                    key={bin.id}
                    position={[bin.lat!, bin.lng!]}
                    icon={markerIcon}
                  >
                    <Popup>
                      <div className="space-y-2 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-foreground">{bin.id}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium">{bin.location}</p>
                          <p className="text-xs">{bin.area} • PIN: {bin.pin}</p>
                        </div>
                        <div className="space-y-1 pt-2 border-t border-border">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Fill Level:</span>
                            <span className="font-semibold text-foreground">{bin.fillLevel}%</span>
                          </div>
                          {bin.battery != null && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Battery:</span>
                              <span className="font-semibold text-foreground">{bin.battery}%</span>
                            </div>
                          )}
                          {isCritical && (
                            <div className="flex items-center gap-1 text-xs text-red-500 mt-2">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Critical fill level</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* Device Status Panel */}
          <div className="lg:col-span-1">
            <DeviceStatusPanel bins={binsWithCoords} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
