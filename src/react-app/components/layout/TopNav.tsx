import { useEffect, useRef } from "react";
import { Bell, Search } from "lucide-react";
import { gsap } from "gsap";
import { useAuth } from "@/react-app/context/AuthContext";
import { useData } from "@/react-app/context/DataContext";
import { getFillStatus } from "@/react-app/types";
import { useState } from "react";

export default function TopNav() {
  const { user } = useAuth();
  const { postcodes } = useData();
  const [showAlerts, setShowAlerts] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { y: -64, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", delay: 0.2 }
      );
    }
  }, []);

  // Calculate alerts (bins > 80%)
  const alerts = postcodes.flatMap((postcode) =>
    postcode.dustbins
      .filter((bin) => getFillStatus(bin.fillLevel) === "high")
      .map((bin) => ({
        ...bin,
        area: postcode.area,
        pin: postcode.pin,
      }))
  );

  return (
    <header
      ref={headerRef}
      className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-background/95 backdrop-blur-xl border-b border-border/50 z-40"
      style={{
        background: "linear-gradient(180deg, hsl(var(--background) / 0.95) 0%, hsl(var(--background) / 0.85) 100%)",
      }}
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search areas, dustbins..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowAlerts(!showAlerts)}
              className="relative p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {alerts.length}
                </span>
              )}
            </button>

            {/* Alerts Dropdown */}
            {showAlerts && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-border bg-destructive/10">
                  <h3 className="font-semibold text-sm text-foreground">
                    Critical Alerts ({alerts.length})
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No critical alerts
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-3 border-b border-border last:border-0 hover:bg-muted/50"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {alert.id} - {alert.location}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {alert.area} ({alert.pin})
                            </p>
                          </div>
                          <span className="px-2 py-1 text-xs font-bold rounded-lg bg-red-500/20 text-red-400 animate-blink">
                            {alert.fillLevel}%
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="flex items-center gap-3 pl-4 border-l border-border">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center font-semibold text-primary text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
