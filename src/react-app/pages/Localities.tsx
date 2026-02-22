import { useMemo } from "react";
import { useData } from "@/react-app/context/DataContext";
import { getFillStatus } from "@/react-app/types";
import DashboardLayout from "@/react-app/components/layout/DashboardLayout";
import { MapPin, Trash2, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/react-app/lib/utils";

export default function LocalitiesPage() {
  const { postcodes } = useData();

  const localityStats = useMemo(() => {
    return postcodes.map((postcode) => {
      const totalBins = postcode.dustbins.length;
      const fullBins = postcode.dustbins.filter(
        (d) => getFillStatus(d.fillLevel) === "high"
      ).length;
      const avgFill = Math.round(
        postcode.dustbins.reduce((acc, d) => acc + d.fillLevel, 0) / totalBins
      );

      return {
        ...postcode,
        totalBins,
        fullBins,
        avgFill,
        status: avgFill > 70 ? "critical" : avgFill > 40 ? "moderate" : "normal",
      };
    });
  }, [postcodes]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "moderate":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-green-500/20 text-green-400 border-green-500/30";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Localities</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and monitor all areas in Gorakhpur
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {postcodes.length}
                </p>
                <p className="text-xs text-muted-foreground">Total Areas</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {localityStats.filter((l) => l.status === "critical").length}
                </p>
                <p className="text-xs text-muted-foreground">Critical Areas</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(
                    localityStats.reduce((acc, l) => acc + l.avgFill, 0) /
                      localityStats.length
                  )}
                  %
                </p>
                <p className="text-xs text-muted-foreground">Avg Fill Level</p>
              </div>
            </div>
          </div>
        </div>

        {/* Localities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {localityStats.map((locality) => (
            <div
              key={locality.pin}
              className="glass glass-hover rounded-2xl p-6 transition-all duration-500 group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">
                      {locality.area}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      PIN: {locality.pin}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-lg border capitalize",
                    getStatusStyle(locality.status)
                  )}
                >
                  {locality.status}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 rounded-xl bg-muted/30">
                  <p className="text-xl font-bold text-foreground">
                    {locality.totalBins}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Total Bins</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/30">
                  <p className="text-xl font-bold text-red-400">
                    {locality.fullBins}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Full Bins</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/30">
                  <p className="text-xl font-bold text-foreground">
                    {locality.avgFill}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">Avg Fill</p>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Overall Fill Level
                  </span>
                  <span className="font-semibold text-foreground">
                    {locality.avgFill}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      locality.avgFill > 70
                        ? "bg-red-500"
                        : locality.avgFill > 40
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    )}
                    style={{ width: `${locality.avgFill}%` }}
                  />
                </div>
              </div>

              {/* Dustbins List */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-3">
                  Dustbins
                </p>
                <div className="space-y-2">
                  {locality.dustbins.map((bin) => (
                    <div
                      key={bin.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/20"
                    >
                      <div className="flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">
                          {bin.id}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          bin.fillLevel > 80
                            ? "text-red-400"
                            : bin.fillLevel > 40
                            ? "text-yellow-400"
                            : "text-green-400"
                        )}
                      >
                        {bin.fillLevel}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
