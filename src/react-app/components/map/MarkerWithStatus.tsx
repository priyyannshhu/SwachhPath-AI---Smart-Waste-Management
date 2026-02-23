import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { IoTDeviceData } from "@/react-app/types/iot";
import "../../../react-app/styles/map-animations.css";

interface MarkerWithStatusProps {
  device: IoTDeviceData;
}

/**
 * MarkerWithStatus Component
 * Displays a colored marker on the map based on dustbin fill level
 * - Green: < 40% (low)
 * - Yellow: 40-80% (medium)
 * - Red: > 80% (critical, with pulsing animation)
 * 
 * Features:
 * - Color-coded by fill level
 * - Pulsing animation for critical bins
 * - Status indicator (online/offline)
 * - Popup with device information
 */
export default function MarkerWithStatus({ device }: MarkerWithStatusProps) {
  // Determine marker color based on fill level
  const getMarkerColor = (): string => {
    const fillLevel = device.fillLevel;
    if (fillLevel < 40) return "#22c55e"; // Green - low
    if (fillLevel <= 80) return "#eab308"; // Yellow - medium
    return "#ef4444"; // Red - critical
  };

  // Determine if marker should pulse (critical level)
  const isCritical = device.fillLevel > 80;

  // Create custom marker icon using Leaflet's divIcon
  const createCustomIcon = (color: string): L.Icon => {
    const html = `
      <div class="custom-marker marker-container ${isCritical ? "marker-critical" : ""}" style="background-color: ${color};">
        <span class="${isCritical ? "marker-critical-icon" : ""}">📍</span>
        <div class="status-dot ${device.status === "online" ? "status-online" : "status-offline"}"></div>
      </div>
    `;

    return L.divIcon({
      html,
      className: "",
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });
  };

  const markerColor = getMarkerColor();
  const icon = createCustomIcon(markerColor);

  // Format battery and fill level
  const batteryLevel = device.battery ?? 0;
  const fillLevel = Math.round(device.fillLevel);

  return (
    <Marker
      position={[device.lat, device.lng]}
      icon={icon}
    >
      <Popup className="map-popup">
        <div className="space-y-2">
          <div className="font-semibold text-gray-800">
            {device.location}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Fill Level:</span>
              <div className="font-medium text-gray-800">{fillLevel}%</div>
            </div>
            <div>
              <span className="text-gray-600">Battery:</span>
              <div className="font-medium text-gray-800">{batteryLevel}%</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Status: <span className={device.status === "online" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
              {device.status}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Device ID: {device.deviceId}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
