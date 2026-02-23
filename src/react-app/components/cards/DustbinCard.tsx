import { Trash2, MapPin, AlertTriangle, Battery, Wifi } from "lucide-react";
import { cn } from "@/react-app/lib/utils";
import { getFillStatus, getStatusBgColor, getProgressColor } from "@/react-app/types";
import { Button } from "@/react-app/components/ui/button";

interface DustbinCardProps {
  id: string;
  location: string;
  fillLevel: number;
  area: string;
  pin: string;
  battery?: number;
  status?: "online" | "offline" | "maintenance";
  onMarkEmpty?: () => void;
  showEmptyButton?: boolean;
  predictedOverflow?: string;
}

export default function DustbinCard({
  id,
  location,
  fillLevel,
  area,
  pin,
  battery,
  status,
  onMarkEmpty,
  showEmptyButton = false,
  predictedOverflow,
}: DustbinCardProps) {
  const fillStatus = getFillStatus(fillLevel);
  const statusColor = getStatusBgColor(fillStatus);
  const progressColor = getProgressColor(fillStatus);

  const statusLabel = {
    low: "Normal",
    medium: "Moderate",
    high: "Critical",
  }[fillStatus];

  return (
    <div
      className={cn(
        "glass glass-hover rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-500 group",
        fillStatus === "high" && "animate-pulse-glow border-red-500/30"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div
            className={cn(
              "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 flex-shrink-0",
              fillStatus === "high"
                ? "bg-red-500/20"
                : fillStatus === "medium"
                ? "bg-yellow-500/20"
                : "bg-green-500/20"
            )}
          >
            <Trash2
              className={cn(
                "w-4 h-4 sm:w-5 sm:h-5",
                fillStatus === "high"
                  ? "text-red-400"
                  : fillStatus === "medium"
                  ? "text-yellow-400"
                  : "text-green-400"
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm sm:text-base text-foreground truncate">{id}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{area}</span>
            </div>
          </div>
        </div>
        <span
          className={cn(
            "px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-lg border whitespace-nowrap flex-shrink-0",
            statusColor,
            fillStatus === "high" && "animate-blink"
          )}
        >
          {statusLabel}
        </span>
      </div>

      {/* Location */}
      <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
        {location}
      </p>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-muted-foreground">Fill Level</span>
          <span className="font-semibold text-foreground">{fillLevel}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              progressColor
            )}
            style={{ width: `${fillLevel}%` }}
          />
        </div>
      </div>

      {/* Predicted Overflow */}
      {predictedOverflow && fillStatus === "high" && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-xs text-red-400 font-medium">
            Overflow in ~{predictedOverflow}
          </span>
        </div>
      )}

      {/* IoT: battery & device status when from device */}
      {(battery != null || status) && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {battery != null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-md bg-muted text-muted-foreground">
              <Battery className="w-3 h-3" />
              {battery}%
            </span>
          )}
          {status && (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-md",
                status === "online" && "bg-green-500/15 text-green-600 dark:text-green-400",
                status === "offline" && "bg-muted text-muted-foreground",
                status === "maintenance" && "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              )}
            >
              <Wifi className="w-3 h-3" />
              {status}
            </span>
          )}
        </div>
      )}

      {/* PIN Badge */}
      <div className="mt-4 flex items-center justify-between">
        <span className="px-2 py-1 text-[10px] font-medium rounded-md bg-muted text-muted-foreground">
          PIN: {pin}
        </span>
        {showEmptyButton && fillStatus === "high" && onMarkEmpty && (
          <Button
            size="sm"
            onClick={onMarkEmpty}
            className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Mark Empty
          </Button>
        )}
      </div>
    </div>
  );
}
