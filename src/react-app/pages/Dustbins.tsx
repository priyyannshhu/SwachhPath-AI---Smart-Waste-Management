import { useMemo, useState } from "react";
import { useAuth } from "@/react-app/context/AuthContext";
import { useData } from "@/react-app/context/DataContext";
import { getFillStatus } from "@/react-app/types";
import DashboardLayout from "@/react-app/components/layout/DashboardLayout";
import DustbinCard from "@/react-app/components/cards/DustbinCard";
import { Trash2, Filter, Zap, Wifi } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { cn } from "@/react-app/lib/utils";
import type { IoTMode } from "@/services/iotService";

type FilterType = "all" | "low" | "medium" | "high";

export default function DustbinsPage() {
  const { user } = useAuth();
  const { postcodes, markDustbinEmptied, iotMode, setIotMode } = useData();
  const [filter, setFilter] = useState<FilterType>("all");
  const iotEnabled = iotMode === "demo" || iotMode === "live";

  // Filter postcodes for regular users
  const filteredPostcodes = useMemo(() => {
    if (user?.role === "admin" || !user?.pin) return postcodes;
    return postcodes.filter((p) => p.pin === user?.pin);
  }, [postcodes, user]);

  // Get all dustbins with area info
  const allDustbins = useMemo(() => {
    return filteredPostcodes.flatMap((p) =>
      p.dustbins.map((d) => ({ ...d, area: p.area, pin: p.pin }))
    );
  }, [filteredPostcodes]);

  // Apply filter
  const displayedDustbins = useMemo(() => {
    if (filter === "all") return allDustbins;
    return allDustbins.filter((d) => getFillStatus(d.fillLevel) === filter);
  }, [allDustbins, filter]);

  const filterOptions: { value: FilterType; label: string; color: string }[] = [
    { value: "all", label: "All Bins", color: "bg-muted" },
    { value: "low", label: "Normal", color: "bg-green-500" },
    { value: "medium", label: "Moderate", color: "bg-yellow-500" },
    { value: "high", label: "Critical", color: "bg-red-500" },
  ];

  // Calculate predicted overflow
  const calculateOverflow = (fillLevel: number): string => {
    if (fillLevel < 80) return "";
    const remainingCapacity = 100 - fillLevel;
    const secondsToFull = (remainingCapacity / 4) * 5; // Based on IoT simulation rate
    const minutesToFull = secondsToFull / 60;
    if (minutesToFull < 1) return "< 1 min";
    if (minutesToFull < 60) return `${Math.round(minutesToFull)} min`;
    return `${Math.round(minutesToFull / 60)} hours`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Command Center style header */}
        <div className="command-panel p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <h1 className="text-xl font-bold text-foreground uppercase tracking-wider font-mono">
                  {user?.role === "admin" ? "All Dustbins" : "My Area Dustbins"}
                </h1>
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-2 ml-5">
                {user?.role === "admin"
                  ? "Manage and monitor all dustbins across Gorakhpur"
                  : `Monitoring dustbins in ${filteredPostcodes[0]?.area || "your area"}`}
              </p>
            </div>
          
          {/* IoT Mode: Off | Demo (simulated) | Live (ESP32-ready) */}
          {user?.role === "admin" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">IoT:</span>
              <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
                {(
                  [
                    { mode: "off" as IoTMode, label: "Off", icon: null },
                    { mode: "demo" as IoTMode, label: "Demo", icon: Zap },
                    { mode: "live" as IoTMode, label: "Live", icon: Wifi },
                  ] as const
                ).map(({ mode: m, label, icon: Icon }) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setIotMode(m)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                      iotMode === m
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {Icon && <Icon className={cn("w-3.5 h-3.5", iotMode === m && "animate-pulse")} />}
                    {label}
                  </button>
                ))}
              </div>
              {iotMode === "live" && (
                <span className="text-[10px] text-muted-foreground max-w-[120px]">
                  Ready for ESP32 / WebSocket / MQTT
                </span>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap items-center gap-3 p-4 glass rounded-2xl">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {allDustbins.length} Total
            </span>
          </div>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">
              {allDustbins.filter((d) => getFillStatus(d.fillLevel) === "low").length} Normal
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-xs text-muted-foreground">
              {allDustbins.filter((d) => getFillStatus(d.fillLevel) === "medium").length} Moderate
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">
              {allDustbins.filter((d) => getFillStatus(d.fillLevel) === "high").length} Critical
            </span>
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2 overflow-x-auto">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">Filter:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={cn(
                  "px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300 whitespace-nowrap",
                  filter === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                <span className="flex items-center gap-1.5">
                  {option.value !== "all" && (
                    <span className={cn("w-2 h-2 rounded-full", option.color)} />
                  )}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Dustbins Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {displayedDustbins.map((bin) => (
            <DustbinCard
              key={bin.id}
              {...bin}
              showEmptyButton={user?.role === "admin"}
              onMarkEmpty={() => markDustbinEmptied(bin.pin, bin.id)}
              predictedOverflow={iotEnabled ? calculateOverflow(bin.fillLevel) : undefined}
            />
          ))}
        </div>

        {displayedDustbins.length === 0 && (
          <div className="text-center py-8 sm:py-12 glass rounded-xl sm:rounded-2xl px-4">
            <Trash2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground">
              No dustbins found with the selected filter
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
