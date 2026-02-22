import { useMemo, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useAuth } from "@/react-app/context/AuthContext";
import { useData } from "@/react-app/context/DataContext";
import { getFillStatus } from "@/react-app/types";
import DashboardLayout from "@/react-app/components/layout/DashboardLayout";
import StatCard from "@/react-app/components/cards/StatCard";
import DustbinCard from "@/react-app/components/cards/DustbinCard";
import {
  Trash2,
  AlertTriangle,
  MapPin,
  Bell,
  TrendingUp,
  Activity,
} from "lucide-react";
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
  const { postcodes, complaints, markDustbinEmptied } = useData();
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
    if (user?.role === "admin") return postcodes;
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
      pendingComplaints: userComplaints.filter((c) => c.status === "Pending").length,
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

  return (
    <DashboardLayout>
      <div ref={pageRef} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {user?.role === "admin" ? "Admin Dashboard" : "My Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.role === "admin"
                ? "Overview of all areas in Gorakhpur"
                : `Monitoring ${filteredPostcodes[0]?.area || "your area"}`}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">Live Monitoring</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Dustbins"
            value={stats.totalBins}
            subtitle="Active bins monitored"
            icon={Trash2}
            variant="default"
          />
          <StatCard
            title="Full Bins"
            value={stats.fullBins}
            subtitle="Requires immediate action"
            icon={AlertTriangle}
            variant="danger"
          />
          <StatCard
            title="Active Areas"
            value={stats.activeAreas}
            subtitle="Localities covered"
            icon={MapPin}
            variant="success"
          />
          <StatCard
            title="Active Alerts"
            value={stats.alerts}
            subtitle={`${stats.pendingComplaints} pending complaints`}
            icon={Bell}
            variant="warning"
          />
        </div>

        {/* Charts Row */}
        <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Area-wise Fill Level */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground">Area-wise Fill Levels</h3>
                <p className="text-xs text-muted-foreground mt-1">
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
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground">Daily Fill Trend</h3>
                <p className="text-xs text-muted-foreground mt-1">
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
