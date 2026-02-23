import { useMemo, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useAuth } from "@/react-app/context/AuthContext";
import { useData } from "@/react-app/context/DataContext";
import { getFillStatus } from "@/react-app/types";
import DashboardLayout from "@/react-app/components/layout/DashboardLayout";
import StatCard from "@/react-app/components/cards/StatCard";
import { cn } from "@/react-app/lib/utils";
import DustbinCard from "@/react-app/components/cards/DustbinCard";
import AIInsightsPanel from "@/react-app/components/AIInsightsPanel";
import { Link } from "react-router";
import {
  Trash2,
  AlertTriangle,
  MapPin,
  Bell,
  TrendingUp,
  Activity,
  Radio,
  Clock,
  Zap,
  Map as MapIcon,
  MessageSquareWarning,
} from "lucide-react";
import { useIoTStream } from "@/react-app/hooks/useIoTStream";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function DashboardPage() {
  const { user } = useAuth();
  const { postcodes, complaints, markDustbinEmptied, iotMode, setIotMode } = useData();
  const { isStreaming } = useIoTStream();
  const pageRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate page content
    if (pageRef.current) {
      gsap.fromTo(
        pageRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" }
      );
    }

    // Animate stats cards with stagger
    if (statsRef.current) {
      const cards = statsRef.current.children;
      gsap.fromTo(
        cards,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, delay: 0.2, ease: "power3.out" }
      );
    }

    // Animate charts
    if (chartsRef.current) {
      const charts = chartsRef.current.children;
      gsap.fromTo(
        charts,
        { y: 40, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.15, delay: 0.4, ease: "power3.out" }
      );
    }
  }, []);

  // Filter data for regular users
  const filteredPostcodes = useMemo(() => {
    if (user?.role === "admin" || !user?.pin) return postcodes;
    return postcodes.filter((p) => p.pin === user?.pin);
  }, [postcodes, user]);

  // Calculate statistics
  const stats = useMemo(() => {
    const allDustbins = filteredPostcodes.flatMap((p) =>
      p.dustbins.map((d) => ({ ...d, area: p.area, pin: p.pin }))
    );
    const fullBins = allDustbins.filter((d) => getFillStatus(d.fillLevel) === "high");
    const activeAreas = new Set(filteredPostcodes.map((p) => p.area)).size;
    const userComplaints = user?.role === "admin" 
      ? complaints 
      : complaints.filter((c) => c.pin === user?.pin);

    return {
      totalBins: allDustbins.length,
      fullBins: fullBins.length,
      activeAreas,
      alerts: fullBins.length,
      pendingComplaints: userComplaints.filter((c) => String(c.status).toLowerCase() === "pending").length,
      allDustbins,
      criticalBins: fullBins,
    };
  }, [filteredPostcodes, complaints, user]);

  // Chart data
  const areaChartData = useMemo(() => {
    return filteredPostcodes.map((p) => ({
      name: p.area,
      avgFill: Math.round(
        p.dustbins.reduce((acc, d) => acc + d.fillLevel, 0) / p.dustbins.length
      ),
      bins: p.dustbins.length,
    }));
  }, [filteredPostcodes]);

  const fillTrendData = useMemo(() => {
    // Simulated hourly trend data
    return [
      { time: "6AM", level: 25 },
      { time: "8AM", level: 35 },
      { time: "10AM", level: 48 },
      { time: "12PM", level: 62 },
      { time: "2PM", level: 71 },
      { time: "4PM", level: 78 },
      { time: "6PM", level: 85 },
      { time: "8PM", level: 72 },
    ];
  }, []);

  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <DashboardLayout>
      <div ref={pageRef} className="space-y-6">
        {/* Command Center Header */}
        <div className="command-panel p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0"></div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground uppercase tracking-wider font-mono truncate">
                  Smart City Command Center
                </h1>
              </div>
              <p className="text-xs text-muted-foreground font-mono ml-4 sm:ml-5 truncate">
                {user?.role === "admin"
                  ? "MUNICIPAL MONITORING SYSTEM • GORAKHPUR"
                  : `AREA MONITORING • ${filteredPostcodes[0]?.area?.toUpperCase() || "YOUR AREA"}`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary flex-shrink-0" />
                <span className="text-xs font-mono text-primary font-semibold whitespace-nowrap">{currentTime}</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30">
                <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary flex-shrink-0" />
                <span className="text-xs font-mono text-primary font-semibold">
                  {iotMode === "demo" ? "DEMO" : iotMode === "live" ? "LIVE" : "OFF"}
                </span>
              </div>
              {isStreaming && (
                <div className="live-indicator text-xs">
                  LIVE
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions + IoT Control (all features visible) */}
        <div className="command-panel p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider whitespace-nowrap">Quick access</span>
              <Link
                to="/dustbins"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Dustbins</span>
              </Link>
              <Link
                to="/map"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                <MapIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Map</span>
              </Link>
              <Link
                to="/complaints"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                <MessageSquareWarning className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Complaints</span>
              </Link>
            </div>
            {user?.role === "admin" && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider whitespace-nowrap">IoT mode</span>
                <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
                  {(["off", "demo", "live"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setIotMode(mode)}
                      className={cn(
                        "flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                        iotMode === mode
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {mode === "demo" && <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                      {mode === "off" ? "Off" : mode === "demo" ? "Demo" : "Live"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features strip - all capabilities visible */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 rounded-md bg-muted/80 text-muted-foreground font-mono">
            IoT Demo/Live
          </span>
          <span className="px-2 py-1 rounded-md bg-muted/80 text-muted-foreground font-mono">
            Live Map + Device Status
          </span>
          <span className="px-2 py-1 rounded-md bg-muted/80 text-muted-foreground font-mono">
            AI Insights (Gemini)
          </span>
          <span className="px-2 py-1 rounded-md bg-muted/80 text-muted-foreground font-mono">
            Command Center
          </span>
        </div>

        {/* Stats Grid - Command Center Style */}
        <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Total Dustbins"
            value={stats.totalBins}
            subtitle="Active bins monitored"
            icon={Trash2}
            variant="default"
            isLive={isStreaming}
          />
          <StatCard
            title="Full Bins"
            value={stats.fullBins}
            subtitle="Requires immediate action"
            icon={AlertTriangle}
            variant="danger"
            isLive={isStreaming}
          />
          <StatCard
            title="Active Areas"
            value={stats.activeAreas}
            subtitle="Localities covered"
            icon={MapPin}
            variant="success"
            isLive={isStreaming}
          />
          <StatCard
            title="Active Alerts"
            value={stats.alerts}
            subtitle={`${stats.pendingComplaints} pending complaints`}
            icon={Bell}
            variant="warning"
            isLive={isStreaming}
          />
        </div>

        {/* Charts Row - Command Center Style */}
        <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Area-wise Fill Level */}
          <div className="command-panel p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider font-mono">
                  Area-wise Fill Levels
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  Average fill percentage by locality
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={areaChartData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="avgFill"
                    fill="hsl(var(--primary))"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fill Level Trend */}
          <div className="command-panel p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider font-mono">
                  Daily Fill Trend
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  Average fill level throughout the day
                </p>
              </div>
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fillTrendData}>
                  <defs>
                    <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="level"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#fillGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AIInsightsPanel />
          </div>
          {/* Spacer or additional content can go here */}
        </div>

        {/* Critical Bins Section */}
        {stats.criticalBins.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="font-semibold text-foreground">Critical Bins</h3>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/20 text-red-400">
                {stats.criticalBins.length} bins need attention
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.criticalBins.slice(0, 6).map((bin) => (
                <DustbinCard
                  key={bin.id}
                  {...bin}
                  showEmptyButton={user?.role === "admin"}
                  onMarkEmpty={() => markDustbinEmptied(bin.pin, bin.id)}
                  predictedOverflow={calculateOverflow(bin.fillLevel)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Calculate predicted overflow time based on current fill level
function calculateOverflow(fillLevel: number): string {
  if (fillLevel < 80) return "";
  const remainingCapacity = 100 - fillLevel;
  // Assuming 5% fill per 5 seconds in simulation
  const minutesToFull = (remainingCapacity / 5) * 0.083; // Convert to minutes
  if (minutesToFull < 1) return "< 1 min";
  if (minutesToFull < 60) return `${Math.round(minutesToFull)} min`;
  return `${Math.round(minutesToFull / 60)} hours`;
}
