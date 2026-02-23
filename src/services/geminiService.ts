/**
 * Gemini AI Service — SwachhPath AI
 *
 * Calls Google Gemini API directly from frontend using environment variable.
 * Vite env vars with VITE_ prefix are exposed to browser safely.
 * 
 * Flow: Frontend → Google Gemini API (direct)
 */

import type { SmartCityAnalysisData } from "@/ai/Prompt";

export interface GeminiResponse {
  immediateActions: string[];
  insights: string[];
  predictions: string[];
}

/**
 * Call Gemini API directly (response read only once to avoid stream errors)
 * Includes fallback for quota/service issues
 */
async function callGeminiAPI(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Gemini API key not configured. Please add VITE_GEMINI_API_KEY to .env file. " +
      "Get your key from: https://makersuite.google.com/app/apikey"
    );
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    // Read response body only ONCE
    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle 429 quota errors gracefully
      if (response.status === 429) {
        console.warn("Gemini API quota exceeded, returning fallback response");
        return FALLBACK_RESPONSES.quotaExceeded;
      }
      
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // Extract text from Gemini response format with safe fallback
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error("No response content from Gemini API");
    }

    return responseText;
  } catch (error) {
    console.error("Gemini analysis error:", error);
    
    // Graceful fallback for network/service errors
    if (error instanceof Error) {
      if (error.message.includes("429") || error.message.includes("quota")) {
        return FALLBACK_RESPONSES.quotaExceeded;
      }
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        return FALLBACK_RESPONSES.networkError;
      }
    }
    
    // Re-throw for UI error handling
    throw error;
  }
}

/**
 * Fallback responses when Gemini API is unavailable
 */
const FALLBACK_RESPONSES = {
  quotaExceeded: 
    "AI quota currently exceeded. Based on SwachhPath analytics: " +
    "1) Ensure all dustbins have secure covers to prevent pest infestation. " +
    "2) Separate wet and dry waste at source to reduce odor. " +
    "3) Schedule daily disinfection of collection areas. " +
    "4) Increase bin collection frequency during peak hours. " +
    "5) Monitor bin fill levels and trigger alerts at 75% capacity.",
  
  networkError:
    "AI service temporarily unavailable. Standard recommendations: " +
    "1) Check dustbin condition and maintenance status. " +
    "2) Verify GPS location data is accurate. " +
    "3) Review recent complaint patterns for problem areas. " +
    "4) Ensure IoT sensors are actively reporting data.",
};

/**
 * Parse Gemini JSON response (handles markdown code blocks)
 */
export function parseGeminiResponse(text: string): GeminiResponse {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  const jsonText = jsonMatch ? jsonMatch[1] : text;

  try {
    const parsed = JSON.parse(jsonText);
    return {
      immediateActions: Array.isArray(parsed.immediateActions) ? parsed.immediateActions : [],
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      predictions: Array.isArray(parsed.predictions) ? parsed.predictions : [],
    };
  } catch (e) {
    // Fallback: try to extract structured data from plain text
    const actions: string[] = [];
    const insights: string[] = [];
    const predictions: string[] = [];

    const lines = text.split("\n");
    let currentSection: "actions" | "insights" | "predictions" | null = null;

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes("immediate") || lower.includes("urgent") || lower.includes("action")) {
        currentSection = "actions";
        continue;
      }
      if (lower.includes("insight") || lower.includes("pattern") || lower.includes("observe")) {
        currentSection = "insights";
        continue;
      }
      if (lower.includes("predict") || lower.includes("forecast") || lower.includes("soon")) {
        currentSection = "predictions";
        continue;
      }

      const trimmed = line.trim();
      if (trimmed && (trimmed.startsWith("-") || trimmed.startsWith("•") || trimmed.match(/^\d+\./))) {
        const content = trimmed.replace(/^[-•\d.\s]+/, "").trim();
        if (content) {
          if (currentSection === "actions") actions.push(content);
          else if (currentSection === "insights") insights.push(content);
          else if (currentSection === "predictions") predictions.push(content);
        }
      }
    }

    return {
      immediateActions: actions.length > 0 ? actions : ["No immediate actions identified"],
      insights: insights.length > 0 ? insights : ["Analyzing system data..."],
      predictions: predictions.length > 0 ? predictions : ["No predictions available"],
    };
  }
}

/**
 * Wrapper to call Gemini and return text (for hooks)
 */
export async function analyzeWithGemini(prompt: string): Promise<string> {
  return callGeminiAPI(prompt);
}

/**
 * Get AI insights for smart city waste management
 */
export async function getSmartCityInsights(data: SmartCityAnalysisData): Promise<GeminiResponse> {
  const { AI_PROMPTS } = await import("@/ai/Prompt");
  const prompt = AI_PROMPTS.smartCityAnalysis(data);
  const response = await callGeminiAPI(prompt);
  return parseGeminiResponse(response);
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  return !!import.meta.env.VITE_GEMINI_API_KEY;
}
