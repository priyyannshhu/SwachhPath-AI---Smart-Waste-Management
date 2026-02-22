import { Trash2, MapPin, AlertTriangle } from "lucide-react";
import { cn } from "@/react-app/lib/utils";
import { getFillStatus, getStatusBgColor, getProgressColor } from "@/react-app/types";
import { Button } from "@/react-app/components/ui/button";

interface DustbinCardProps {
  id: string;
  location: string;
  fillLevel: number;
  area: string;
  pin: string;
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
  onMarkEmpty,
  showEmptyButton = false,
  predictedOverflow,
}: DustbinCardProps) {
  const status = getFillStatus(fillLevel);
  const statusColor = getStatusBgColor(status);
  const progressColor = getProgressColor(status);

  const statusLabel = {
    low: "Normal",
    medium: "Moderate",
    high: "Critical",
  }[status];

  return (
    <div
      className={cn(
        "glass glass-hover rounded-2xl p-5 transition-all duration-500 group",
        status === "high" && "animate-pulse-glow border-red-500/30"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
              status === "high"
                ? "bg-red-500/20"
                : status === "medium"
                ? "bg-yellow-500/20"
                : "bg-green-500/20"
            )}
          >
            <Trash2
              className={cn(
                "w-5 h-5",
                status === "high"
                  ? "text-red-400"
                  : status === "medium"
                  ? "text-yellow-400"
                  : "text-green-400"
              )}
            />
          </div>
          <div>
            <p className="font-semibold text-foreground">{id}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{area}</span>
            </div>
          </div>
        </div>
        <span
          className={cn(
            "px-2.5 py-1 text-xs font-semibold rounded-lg border",
            statusColor,
            status === "high" && "animate-blink"
          )}
        >
          {statusLabel}
        </span>
      </div>

      {/* Location */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-1">
        {location}
      </p>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
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
      {predictedOverflow && status === "high" && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-xs text-red-400 font-medium">
            Overflow in ~{predictedOverflow}
          </span>
        </div>
      )}

      {/* PIN Badge */}
      <div className="mt-4 flex items-center justify-between">
        <span className="px-2 py-1 text-[10px] font-medium rounded-md bg-muted text-muted-foreground">
          PIN: {pin}
        </span>
        {showEmptyButton && status === "high" && onMarkEmpty && (
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
