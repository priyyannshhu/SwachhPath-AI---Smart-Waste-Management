import { LucideIcon } from "lucide-react";
import { cn } from "@/react-app/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger";
  isLive?: boolean;
}

const variantStyles = {
  default: {
    icon: "bg-primary/20 text-primary",
    glow: "group-hover:neon-glow-sm",
  },
  success: {
    icon: "bg-green-500/20 text-green-400",
    glow: "group-hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]",
  },
  warning: {
    icon: "bg-yellow-500/20 text-yellow-400",
    glow: "group-hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]",
  },
  danger: {
    icon: "bg-red-500/20 text-red-400",
    glow: "group-hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]",
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  isLive = false,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "group command-panel transition-all duration-500 relative p-3 sm:p-5",
        styles.glow
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            {isLive && (
              <span className="live-indicator text-xs">
                LIVE
              </span>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight font-mono break-words">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground font-mono line-clamp-2">{subtitle}</p>
            )}
          </div>
          {trend && (
            <div
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium font-mono",
                trend.isPositive
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              )}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 flex-shrink-0",
            styles.icon
          )}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
}
