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
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "group glass glass-hover rounded-2xl p-6 transition-all duration-500",
        styles.glow
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-foreground tracking-tight">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {trend && (
            <div
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                trend.isPositive
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              )}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
            styles.icon
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
