import { useMemo } from "react";
import { Wifi, WifiOff, Battery, BatteryLow, AlertTriangle } from "lucide-react";
import { cn } from "@/react-app/lib/utils";

interface BinWithStatus {
  id: string;
  location: string;
  area: string;
  fillLevel: number;
  battery?: number;
  status?: "online" | "offline" | "maintenance";
}

interface DeviceStatusPanelProps {
  bins: BinWithStatus[];
}

export default function DeviceStatusPanel({ bins }: DeviceStatusPanelProps) {
  const stats = useMemo(() => {
    const online = bins.filter((b) => b.status === "online").length;
    const offline = bins.filter((b) => b.status === "offline").length;
    const lowBattery = bins.filter((b) => b.battery != null && b.battery < 20).length;
    return { total: bins.length, online, offline, lowBattery };
  }, [bins]);

  const sortedBins = useMemo(() => {
    return [...bins].sort((a, b) => {
      // Offline first
      if (a.status === "offline" && b.status !== "offline") return -1;
      if (a.status !== "offline" && b.status === "offline") return 1;
      // Then low battery
      if ((a.battery ?? 100) < 20 && (b.battery ?? 100) >= 20) return -1;
      if ((a.battery ?? 100) >= 20 && (b.battery ?? 100) < 20) return 1;
      // Then by fill level (high first)
      return b.fillLevel - a.fillLevel;
    });
  }, [bins]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass rounded-2xl p-4 border border-border">
        <h2 className="text-lg font-bold text-foreground mb-3">Device Status</h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <Wifi className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Online</p>
              <p className="text-sm font-semibold text-foreground">{stats.online}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <WifiOff className="w-4 h-4 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Offline</p>
              <p className="text-sm font-semibold text-foreground">{stats.offline}</p>
            </div>
          </div>
        </div>
        {stats.lowBattery > 0 && (
          <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <BatteryLow className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Low Battery</p>
              <p className="text-sm font-semibold text-foreground">{stats.lowBattery} devices</p>
            </div>
          </div>
        )}
      </div>

      {/* Device List */}
      <div className="glass rounded-2xl border border-border overflow-hidden">
        <div className="p-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground">All Devices ({stats.total})</h3>
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          {sortedBins.map((bin) => {
            const isOnline = bin.status === "online";
            const isLowBattery = bin.battery != null && bin.battery < 20;
            const fillStatus = bin.fillLevel <= 40 ? "low" : bin.fillLevel <= 80 ? "medium" : "high";
            const fillColor =
              fillStatus === "low" ? "bg-green-500" : fillStatus === "medium" ? "bg-yellow-500" : "bg-red-500";

            return (
              <div
                key={bin.id}
                className={cn(
                  "p-3 border-b border-border last:border-b-0 transition-colors",
                  !isOnline && "bg-red-500/5",
                  isLowBattery && "bg-amber-500/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isOnline ? (
                        <Wifi className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      ) : (
                        <WifiOff className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      )}
                      <span className="text-sm font-semibold text-foreground truncate">{bin.id}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{bin.location}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{bin.area}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {bin.battery != null && (
                      <div className="flex items-center gap-1">
                        {isLowBattery ? (
                          <BatteryLow className="w-3 h-3 text-amber-500" />
                        ) : (
                          <Battery className="w-3 h-3 text-muted-foreground" />
                        )}
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isLowBattery ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                          )}
                        >
                          {bin.battery}%
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <div className={cn("w-2 h-2 rounded-full", fillColor)} />
                      <span className="text-xs font-semibold text-foreground">{bin.fillLevel}%</span>
                    </div>
                  </div>
                </div>
                {!isOnline && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-red-500">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Device offline</span>
                  </div>
                )}
                {isLowBattery && isOnline && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <BatteryLow className="w-3 h-3" />
                    <span>Low battery warning</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
