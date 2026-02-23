/**
 * useGeminiInsights Hook
 * 
 * Manages AI analysis state and ensures on-demand (user-triggered) generation
 * Uses the secure backend proxy for all Gemini API calls
 */

import { useState, useCallback } from "react";
import { analyzeWithGemini, parseGeminiResponse, type GeminiResponse } from "@/services/geminiService";
import { AI_PROMPTS, type SmartCityAnalysisData } from "@/ai/Prompt";

interface UseGeminiInsightsReturn {
  insights: GeminiResponse | null;
  loading: boolean;
  error: string | null;
  generateInsights: (data: SmartCityAnalysisData) => Promise<void>;
  clear: () => void;
}

/**
 * Hook for on-demand AI insights generation
 * Call generateInsights() to trigger analysis
 * 
 * Example usage:
 * ```tsx
 * const { insights, loading, error, generateInsights } = useGeminiInsights();
 * 
 * const handleAnalyze = async () => {
 *   await generateInsights(currentSystemData);
 * };
 * ```
 */
export function useGeminiInsights(): UseGeminiInsightsReturn {
  const [insights, setInsights] = useState<GeminiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = useCallback(async (data: SmartCityAnalysisData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Generate the prompt from the data
      const prompt = AI_PROMPTS.smartCityAnalysis(data);
      
      // Call backend endpoint (which securely calls Gemini)
      const responseText = await analyzeWithGemini(prompt);
      
      // Parse the response
      const parsed = parseGeminiResponse(responseText);
      setInsights(parsed);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to generate insights";
      setError(errorMsg);
      console.error("useGeminiInsights error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setInsights(null);
    setError(null);
  }, []);

  return {
    insights,
    loading,
    error,
    generateInsights,
    clear,
  };
}

export default useGeminiInsights;
