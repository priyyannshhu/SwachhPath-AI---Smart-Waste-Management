/**
 * Example Component: IoT Device Monitor
 * 
 * Demonstrates how to use IoT data in components
 * Shows real-time device status, battery levels, and connectivity
 */

import { useEffect, useState } from "react";
import { useIoT } from "@/react-app/hooks/useIoT";
import { IoTDeviceData } from "@/react-app/types/iot";
import { Activity, Battery, MapPin, Wifi, WifiOff } from "lucide-react";

export function IoTDeviceMonitor() {
  const { getLiveBins } = useIoT();
  const [devices, setDevices] = useState<IoTDeviceData[]>([]);
  const [updateTime, setUpdateTime] = useState<string>("");

  // Update devices every render cycle (or use subscribeToUpdates for more control)
  useEffect(() => {
    const interval = setInterval(() => {
      const liveBins = getLiveBins();
      setDevices(liveBins);
      setUpdateTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(interval);
  }, [getLiveBins]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-500";
      case "offline":
        return "text-gray-400";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 60) return "text-green-500";
    if (battery > 30) return "text-yellow-500";
    return "text-red-500";
  };

  const getFillColor = (fillLevel: number) => {
    if (fillLevel > 80) return "text-red-500";
    if (fillLevel > 50) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="w-full space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">IoT Device Monitor</h2>
          <p className="text-xs text-muted-foreground">
            Real-time device telemetry (Demo Mode)
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 border border-primary/20">
          <Activity className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-xs font-medium text-primary">
            {devices.filter((d) => d.status === "online").length}/{devices.length} Online
          </span>
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <p>No devices available. Loading...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {devices.map((device) => (
            <div
              key={device.deviceId}
              className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
            >
              {/* Device Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">
                    {device.deviceId}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {device.lat.toFixed(4)}, {device.lng.toFixed(4)}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded bg-background ${getStatusColor(device.status)}`}
                >
                  {device.status === "online" ? (
                    <Wifi className="w-3 h-3" />
                  ) : (
                    <WifiOff className="w-3 h-3" />
                  )}
                  <span className="text-xs font-medium capitalize">{device.status}</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-2">
                {/* Fill Level */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Fill Level</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-1.5 bg-background rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          device.fillLevel > 80
                            ? "bg-red-500"
                            : device.fillLevel > 50
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{ width: `${device.fillLevel}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold w-10 text-right ${getFillColor(device.fillLevel)}`}>
                      {device.fillLevel.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Battery */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Battery className="w-3 h-3" /> Battery
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-background rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          device.battery > 60
                            ? "bg-green-500"
                            : device.battery > 30
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${device.battery}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold w-10 text-right ${getBatteryColor(device.battery)}`}>
                      {device.battery.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Last Update</span>
                  <span className="text-xs font-mono text-foreground">
                    {device.timestamp ? new Date(device.timestamp).toLocaleTimeString() : "N/A"}
                  </span>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="mt-3 pt-3 border-t border-border flex gap-2">
                {device.status === "online" && device.battery < 30 && (
                  <div className="px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-500">
                    Low Battery
                  </div>
                )}
                {device.fillLevel > 80 && (
                  <div className="px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-500">
                    Near Full
                  </div>
                )}
                {device.status !== "online" && (
                  <div className="px-2 py-1 rounded text-xs font-medium bg-gray-500/10 text-gray-500">
                    Offline
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-4 py-2 rounded-md bg-background border border-border">
        <span>Last update: {updateTime || "Waiting..."}</span>
        <span>Total devices: {devices.length}</span>
      </div>

      {/* Integration Notes */}
      <div className="p-3 rounded-md bg-blue-500/5 border border-blue-500/20">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          ℹ️ <strong>Demo Mode:</strong> Device data is simulated locally. Switch to "live" mode
          in DataContext to connect to real ESP32 devices via HTTP, WebSocket, or MQTT.
        </p>
      </div>
    </div>
  );
}

export default IoTDeviceMonitor;
