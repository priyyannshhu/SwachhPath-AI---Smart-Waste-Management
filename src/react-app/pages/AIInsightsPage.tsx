import { useState } from "react";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Zap,
  BarChart3,
  FileText,
  Clock,
} from "lucide-react";
import { cn } from "@/react-app/lib/utils";
import { useData } from "@/react-app/context/DataContext";
import { useIoTStream } from "@/react-app/hooks/useIoTStream";
import { formatDataForAI } from "@/ai/Prompt";
import { getSmartCityInsights, isGeminiConfigured, type GeminiResponse } from "@/services/geminiService";
import DashboardLayout from "@/react-app/components/layout/DashboardLayout";

export default function AIInsightsPage() {
  const { postcodes, complaints } = useData();
  const { liveBins } = useIoTStream();
  const [insights, setInsights] = useState<GeminiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);

  const isConfigured = isGeminiConfigured();
  const dataSummary = formatDataForAI(postcodes, liveBins, complaints);

  const analyze = async () => {
    if (!isConfigured) {
      setError("Gemini API key not configured. Set VITE_GEMINI_API_KEY in .env");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await getSmartCityInsights(dataSummary);
      setInsights(result);
      setLastAnalyzed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get AI insights");
      console.error("AI Insights error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-[80vh] space-y-8">
        {/* Hero / Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 p-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.15)_0%,transparent_50%)]" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/30 flex items-center justify-center border border-primary/40">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                  AI Insights
                </h1>
                <p className="text-muted-foreground mt-1 max-w-xl">
                  Smart waste analysis powered by Gemini. Get actionable recommendations from your bin dataset, alerts, and fill trends.
                </p>
                {lastAnalyzed && (
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Last analyzed: {lastAnalyzed.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={analyze}
              disabled={isLoading || !isConfigured}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all shrink-0",
                isLoading || !isConfigured
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Run AI Analysis
                </>
              )}
            </button>
          </div>
        </div>

        {/* Data summary sent to AI */}
        <div className="rounded-2xl border border-border bg-card/50 p-6">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            Data sent to AI
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-2xl font-bold text-foreground font-mono">{dataSummary.trends.totalBins}</p>
              <p className="text-xs text-muted-foreground">Total bins</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-2xl font-bold text-red-500 font-mono">{dataSummary.trends.criticalBins}</p>
              <p className="text-xs text-muted-foreground">Critical (&gt;80%)</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-2xl font-bold text-foreground font-mono">{Math.round(dataSummary.trends.averageFill)}%</p>
              <p className="text-xs text-muted-foreground">Avg fill</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-2xl font-bold text-foreground font-mono">{dataSummary.alerts.length}</p>
              <p className="text-xs text-muted-foreground">Alerts</p>
            </div>
          </div>
        </div>

        {/* Setup / Error */}
        {!isConfigured && !error && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>Setup:</strong> Add <code className="bg-muted px-1.5 py-0.5 rounded text-xs">VITE_GEMINI_API_KEY</code> to <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.env</code>.
              Get your key from{" "}
              <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">
                Google AI Studio
              </a>.
            </p>
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-600 dark:text-red-400">Error</p>
              <p className="text-sm text-red-600/90 dark:text-red-400/90 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="rounded-2xl border border-border bg-card/50 p-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Analyzing waste management data with Gemini AI...</p>
          </div>
        )}

        {/* Results */}
        {insights && !isLoading && (
          <div className="space-y-6">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              AI recommendations
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Immediate Actions */}
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-foreground">Immediate Actions</h3>
                </div>
                <ul className="space-y-2">
                  {insights.immediateActions.map((action, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Operational Insights */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Operational Insights</h3>
                </div>
                <ul className="space-y-2">
                  {insights.insights.map((insight, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Predictions */}
              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <h3 className="font-semibold text-foreground">Predictive Recommendations</h3>
                </div>
                <ul className="space-y-2">
                  {insights.predictions.map((prediction, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>{prediction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!insights && !isLoading && !error && isConfigured && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Click &quot;Run AI Analysis&quot; to get insights from Gemini.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
