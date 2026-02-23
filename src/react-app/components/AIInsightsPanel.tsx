import { useState } from "react";
import { Sparkles, Loader2, AlertCircle, CheckCircle2, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/react-app/lib/utils";
import { useData } from "@/react-app/context/DataContext";
import { useIoTStream } from "@/react-app/hooks/useIoTStream";
import { useGeminiInsights } from "@/react-app/hooks/useGeminiInsights";
import { parseMarkdown } from "@/react-app/lib/markdownParser.tsx";
import type { SmartCityAnalysisData } from "@/ai/Prompt";

export default function AIInsightsPanel() {
  const { postcodes, complaints } = useData();
  const { liveBins } = useIoTStream();
  const { insights, loading, error, generateInsights } = useGeminiInsights();
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);

  const analyze = async () => {
    try {
      // Prepare data for AI analysis
      const data: SmartCityAnalysisData = {
        bins: postcodes.flatMap((p) =>
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
        ),
        alerts: postcodes
          .flatMap((p) =>
            p.dustbins.map((d) => {
              const live = liveBins.find((b) => b.deviceId === d.id);
              const fill = live?.fillLevel ?? d.fillLevel;
              return fill > 80
                ? { id: d.id, location: d.location, fillLevel: fill, area: p.area }
                : null;
            })
          )
          .filter((a) => a !== null) as SmartCityAnalysisData["alerts"],
        trends: {
          totalBins: postcodes.reduce((sum, p) => sum + p.dustbins.length, 0),
          criticalBins: postcodes.reduce((sum, p) => {
            return (
              sum +
              p.dustbins.filter((d) => {
                const live = liveBins.find((b) => b.deviceId === d.id);
                return (live?.fillLevel ?? d.fillLevel) > 80;
              }).length
            );
          }, 0),
          averageFill:
            liveBins.length > 0
              ? liveBins.reduce((sum, b) => sum + b.fillLevel, 0) / liveBins.length
              : postcodes.reduce((sum, p) => sum + p.dustbins.reduce((s, d) => s + d.fillLevel, 0), 0) /
                postcodes.reduce((sum, p) => sum + p.dustbins.length, 0),
          offlineDevices: liveBins.filter((b) => b.status === "offline").length,
          lowBatteryDevices: liveBins.filter((b) => b.battery && b.battery < 20).length,
        },
        complaints: complaints.slice(0, 5),
      };

      await generateInsights(data);
      setLastAnalyzed(new Date());
    } catch (err) {
      console.error("Analysis error:", err);
    }
  };

  return (
    <div className="command-panel p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider font-mono">AI Insights</h3>
            <p className="text-xs text-muted-foreground font-mono">Powered by Gemini AI</p>
          </div>
        </div>
        <button
          onClick={analyze}
          disabled={loading}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
            loading
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="w-3 h-3 inline mr-1" />
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-red-500">
            <p className="font-medium">Error</p>
            <p className="text-red-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Backend Setup Info */}
      {!error && !insights && !loading && (
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            <strong>AI Insights Ready:</strong> Click "Refresh" above to generate actionable insights from your waste management data using Gemini AI.
            <br />
            API key is securely handled by the backend.
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Analyzing waste management data...</p>
        </div>
      )}

      {/* Insights */}
      {insights && !loading && (
        <div className="space-y-4">
          {lastAnalyzed && (
            <p className="text-xs text-muted-foreground">
              Last analyzed: {lastAnalyzed.toLocaleTimeString()}
            </p>
          )}

      {/* Immediate Actions */}
          {insights.immediateActions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <h4 className="text-sm font-semibold text-foreground">Immediate Actions</h4>
              </div>
              <ul className="space-y-1.5 pl-6">
                {insights.immediateActions.map((action, idx) => (
                  <li key={idx} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-red-500 mt-1 flex-shrink-0">•</span>
                    <span><>{parseMarkdown(action)}</></span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Insights */}
          {insights.insights.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">Operational Insights</h4>
              </div>
              <ul className="space-y-1.5 pl-6">
                {insights.insights.map((insight, idx) => (
                  <li key={idx} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1 flex-shrink-0">•</span>
                    <span><>{parseMarkdown(insight)}</></span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Predictions */}
          {insights.predictions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <h4 className="text-sm font-semibold text-foreground">Predictive Recommendations</h4>
              </div>
              <ul className="space-y-1.5 pl-6">
                {insights.predictions.map((prediction, idx) => (
                  <li key={idx} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-green-500 mt-1 flex-shrink-0">•</span>
                    <span><>{parseMarkdown(prediction)}</></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}


    </div>
  );
}
