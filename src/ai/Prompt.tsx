/**
 * Centralized AI Prompts — SwachhPath AI
 *
 * All prompts for Gemini AI analysis are defined here.
 * This ensures consistency and makes it easy to update prompts.
 */

import type { Complaint, Postcode } from "@/react-app/types";
import type { IoTDevicePayload } from "@/react-app/types";

export interface SmartCityAnalysisData {
  bins: Array<{
    id: string;
    location: string;
    area: string;
    fillLevel: number;
    battery?: number;
    status?: "online" | "offline" | "maintenance";
  }>;
  alerts: Array<{
    id: string;
    location: string;
    fillLevel: number;
    area: string;
  }>;
  trends: {
    totalBins: number;
    criticalBins: number;
    averageFill: number;
    offlineDevices: number;
    lowBatteryDevices: number;
  };
  complaints?: Complaint[];
}

export const AI_PROMPTS = {
  /**
   * Smart City Analysis — Main operational insights prompt
   */
  smartCityAnalysis: (data: SmartCityAnalysisData): string => {
    return `You are an AI monitoring a smart waste management system for Gorakhpur city.
Your role is to provide short, actionable operational insights based on real-time sensor data.

Current System Status:
- Total bins monitored: ${data.trends.totalBins}
- Critical bins (>80% full): ${data.trends.criticalBins}
- Average fill level: ${Math.round(data.trends.averageFill)}%
- Offline devices: ${data.trends.offlineDevices}
- Low battery devices (<20%): ${data.trends.lowBatteryDevices}

Critical Alerts (bins needing immediate attention):
${data.alerts.map((a) => `- ${a.id} (${a.location}, ${a.area}): ${a.fillLevel}% full`).join("\n")}

Bin Dataset:
${data.bins.map((b) => {
  const status = b.status === "offline" ? " [OFFLINE]" : b.battery && b.battery < 20 ? " [LOW BATTERY]" : "";
  return `- ${b.id}: ${b.fillLevel}% full, ${b.location} (${b.area})${status}`;
}).join("\n")}

${data.complaints && data.complaints.length > 0 ? `
Recent Complaints:
${data.complaints.slice(0, 5).map((c) => {
  const issueText = c.title || c.issue || "No description";
  const areaText = c.locality || c.area || "Unknown area";
  return `- ${issueText} (${areaText}, Status: ${c.status})`;
}).join("\n")}
` : ""}

Please provide:
1. **Immediate Actions** (2-3 urgent recommendations for bins that need attention NOW)
2. **Operational Insights** (patterns you notice, areas needing more frequent collection, etc.)
3. **Predictive Recommendations** (which bins might overflow soon, optimal collection routes)

Keep responses concise, actionable, and focused on operational efficiency. Use bullet points.
Format your response as JSON with keys: "immediateActions", "insights", "predictions".`;
  },

  /**
   * Fill Trend Analysis — Analyze fill patterns over time
   */
  fillTrendAnalysis: (trends: { hourly: number[]; areas: Record<string, number> }): string => {
    return `Analyze waste collection fill trends:

Hourly average fill levels: ${trends.hourly.join(", ")}
Area-wise average fill:
${Object.entries(trends.areas).map(([area, fill]) => `- ${area}: ${fill}%`).join("\n")}

Provide insights on:
- Peak collection times
- Areas needing more frequent service
- Optimal collection schedule recommendations`;
  },

  /**
   * Route Optimization — Suggest efficient collection routes
   */
  routeOptimization: (criticalBins: Array<{ id: string; lat: number; lng: number; fillLevel: number }>): string => {
    return `Optimize waste collection routes for these critical bins:

${criticalBins.map((b) => `- ${b.id}: ${b.fillLevel}% full at (${b.lat}, ${b.lng})`).join("\n")}

Suggest:
- Optimal route order
- Estimated time
- Priority bins to visit first`;
  },
};

/**
 * Format data for AI analysis
 */
export function formatDataForAI(
  postcodes: Postcode[],
  liveBins: IoTDevicePayload[],
  complaints?: Complaint[]
): SmartCityAnalysisData {
  const allBins = postcodes.flatMap((p) =>
    p.dustbins.map((d) => {
      const live = liveBins.find((b) => b.deviceId === d.id);
      return {
        id: d.id,
        location: d.location,
        area: p.area,
        fillLevel: live?.fillLevel ?? d.fillLevel,
        battery: live?.battery ?? d.battery,
        status: live?.status ?? d.status,
      };
    })
  );

  const alerts = allBins
    .filter((b) => b.fillLevel > 80)
    .map((b) => ({
      id: b.id,
      location: b.location,
      fillLevel: b.fillLevel,
      area: b.area,
    }));

  const trends = {
    totalBins: allBins.length,
    criticalBins: alerts.length,
    averageFill: allBins.reduce((sum, b) => sum + b.fillLevel, 0) / allBins.length,
    offlineDevices: allBins.filter((b) => b.status === "offline").length,
    lowBatteryDevices: allBins.filter((b) => b.battery != null && b.battery < 20).length,
  };

  return {
    bins: allBins,
    alerts,
    trends,
    complaints,
  };
}
