import { useMemo, useEffect, useState } from "react";
import { useAuth } from "@/react-app/context/AuthContext";
import { useData } from "@/react-app/context/DataContext";
import { getFillStatus } from "@/react-app/types";
import DashboardLayout from "@/react-app/components/layout/DashboardLayout";
import DustbinCard from "@/react-app/components/cards/DustbinCard";
import { Trash2, Filter, Zap } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { cn } from "@/react-app/lib/utils";

type FilterType = "all" | "low" | "medium" | "high";

export default function DustbinsPage() {
  const { user } = useAuth();
  const { postcodes, markDustbinEmptied, updateDustbinLevel } = useData();
  const [filter, setFilter] = useState<FilterType>("all");
  const [iotEnabled, setIotEnabled] = useState(false);

  // Filter postcodes for regular users
  const filteredPostcodes = useMemo(() => {
    if (user?.role === "admin") return postcodes;
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

  // IoT Simulation - auto-increment fill levels
  useEffect(() => {
    if (!iotEnabled) return;

    const interval = setInterval(() => {
      postcodes.forEach((postcode) => {
        postcode.dustbins.forEach((bin) => {
          if (bin.fillLevel < 100) {
            const increment = Math.floor(Math.random() * 3) + 3; // 3-5% increment
            updateDustbinLevel(postcode.pin, bin.id, bin.fillLevel + increment);
          }
        });
      });
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [iotEnabled, postcodes, updateDustbinLevel]);

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {user?.role === "admin" ? "All Dustbins" : "My Area Dustbins"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.role === "admin"
                ? "Manage and monitor all dustbins across Gorakhpur"
                : `Monitoring dustbins in ${filteredPostcodes[0]?.area || "your area"}`}
            </p>
          </div>
          
          {/* IoT Simulation Toggle */}
          {user?.role === "admin" && (
            <Button
              onClick={() => setIotEnabled(!iotEnabled)}
              className={cn(
                "gap-2 transition-all duration-300",
                iotEnabled
                  ? "bg-primary hover:bg-primary/90 neon-glow-sm"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              <Zap className={cn("w-4 h-4", iotEnabled && "animate-pulse")} />
              {iotEnabled ? "IoT Simulation ON" : "Start IoT Simulation"}
            </Button>
          )}
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
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter:</span>
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300",
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

        {/* Dustbins Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          <div className="text-center py-12 glass rounded-2xl">
            <Trash2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No dustbins found with the selected filter
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
